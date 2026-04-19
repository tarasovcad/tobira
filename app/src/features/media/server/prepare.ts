import {randomUUID} from "crypto";
import {ALLOWED_MEDIA_DOMAINS} from "@/features/media/constants";
import type {MediaImages, PostMediaItem} from "@/db/schema";
import type {MediaMediaItem} from "@/app/home/_types/bookmark-metadata";
import {extractXMedia} from "./fetch";
import {uploadToR2} from "@/lib/storage/r2-storage";
import {normalizeInputUrl} from "@/lib/fetch/web/url";

type ExtractedMediaMetadata = Awaited<ReturnType<typeof extractXMedia>>;

type MediaExtendedItem = MediaMediaItem;

type BookmarkToInsert = {
  id: string;
  url: string;
  description: string | null;
  userId: string;
  kind: "media";
  images: MediaImages;
  metadata: Record<string, unknown> | null;
};

export type PrepareMediaBookmarkResult = {
  normalized: URL;
  mediaUrls: string[];
  mediaItems: MediaMediaItem[];
} & (
  | {requiresSelection: true}
  | {requiresSelection: false; bookmarkId: string; bookmarkToInsert: BookmarkToInsert}
);

export async function prepareMediaBookmarkCreation(input: {
  url: string;
  selectedMediaUrls?: string[];
  userId: string;
}): Promise<PrepareMediaBookmarkResult> {
  const normalized = normalizeInputUrl(input.url);
  const hostname = normalized.hostname;

  const isAllowedDomain = ALLOWED_MEDIA_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
  if (!isAllowedDomain) {
    throw new Error("Domain not supported for media bookmarks");
  }

  const isXDomain = hostname === "x.com" || hostname.endsWith(".x.com");
  if (!isXDomain) {
    throw new Error("Only X (x.com) URLs are currently supported for media bookmarks.");
  }

  const extractedMetadata = await extractXMedia(normalized.toString());

  if (!extractedMetadata) {
    throw new Error("Could not fetch post data. Please try again.");
  }

  if (extractedMetadata.hasMedia === false) {
    throw new Error("This post has no media. Please save it as a Website bookmark instead.");
  }

  const mediaUrls = Array.isArray(extractedMetadata.mediaURLs) ? extractedMetadata.mediaURLs : [];
  const mediaItems = Array.isArray(extractedMetadata.media_extended)
    ? (extractedMetadata.media_extended as MediaMediaItem[]).filter(
        (item) => typeof item?.url === "string" && mediaUrls.includes(item.url),
      )
    : [];

  if (!input.selectedMediaUrls && mediaUrls.length > 1) {
    return {requiresSelection: true, normalized, mediaUrls, mediaItems};
  }

  const urlsToCreate = input.selectedMediaUrls?.length ? input.selectedMediaUrls : mediaUrls;

  if (urlsToCreate.length === 0) {
    throw new Error("This post has no media. Please save it as a Website bookmark instead.");
  }

  const bookmarkId = randomUUID();
  const items = await Promise.all(
    urlsToCreate.map((mediaUrl, index) =>
      processMediaItem({mediaUrl, bookmarkId, index, extractedMetadata}),
    ),
  );

  return {
    requiresSelection: false,
    normalized,
    mediaUrls,
    mediaItems,
    bookmarkId,
    bookmarkToInsert: {
      id: bookmarkId,
      url: normalized.toString(),
      description: extractedMetadata.text ?? null,
      userId: input.userId,
      kind: "media",
      images: {items},
      metadata: buildMediaMetadata(extractedMetadata),
    },
  };
}

async function processMediaItem(input: {
  mediaUrl: string;
  bookmarkId: string;
  index: number;
  extractedMetadata: ExtractedMediaMetadata;
}): Promise<PostMediaItem> {
  const mediaInfo: MediaExtendedItem | null =
    input.extractedMetadata?.media_extended?.find(
      (item: MediaExtendedItem) => item.url === input.mediaUrl,
    ) ?? null;

  const type = mediaInfo?.type === "photo" || !mediaInfo?.type ? "image" : mediaInfo.type;

  if (type === "video" || type === "gif") {
    return processVideoItem({...input, mediaInfo, type});
  }

  return processImageItem({...input, mediaInfo});
}

async function processVideoItem(input: {
  mediaUrl: string;
  bookmarkId: string;
  index: number;
  mediaInfo: MediaExtendedItem | null;
  type: "video" | "gif";
}): Promise<PostMediaItem> {
  const {mediaUrl, bookmarkId, index, mediaInfo, type} = input;
  const baseKey = `posts/${bookmarkId}/media_${index}`;

  const key = await downloadAndUploadToR2(mediaUrl, `${baseKey}.mp4`);

  const key_thumbnail = await (mediaInfo?.thumbnail_url
    ? downloadAndUploadToR2(mediaInfo.thumbnail_url, `${baseKey}_thumbnail.jpg`).catch(() => null)
    : Promise.resolve(null));

  return {
    type,
    width: mediaInfo?.size?.width ?? undefined,
    height: mediaInfo?.size?.height ?? undefined,
    alt: mediaInfo?.altText ?? null,
    source_url: mediaUrl,
    key,
    ...(key_thumbnail ? {key_thumbnail} : {}),
  };
}

async function processImageItem(input: {
  mediaUrl: string;
  bookmarkId: string;
  index: number;
  mediaInfo: MediaExtendedItem | null;
}): Promise<PostMediaItem> {
  const {mediaUrl, bookmarkId, index, mediaInfo} = input;
  const baseKey = `posts/${bookmarkId}/media_${index}`;

  const smallSrcUrl = buildTwitterSizedUrl(mediaUrl, "small");
  const mediumSrcUrl = buildTwitterSizedUrl(mediaUrl, "medium");
  const largeSrcUrl = buildTwitterSizedUrl(mediaUrl, "large");

  const [key_small, key_medium, key_large] = await Promise.all([
    smallSrcUrl
      ? downloadAndUploadToR2(smallSrcUrl, `${baseKey}_small.jpg`)
      : Promise.resolve(null),
    mediumSrcUrl
      ? downloadAndUploadToR2(mediumSrcUrl, `${baseKey}_medium.jpg`).catch(() => null)
      : Promise.resolve(null),
    largeSrcUrl
      ? downloadAndUploadToR2(largeSrcUrl, `${baseKey}_large.jpg`)
      : Promise.resolve(null),
  ]);

  if (!key_small || !key_large) {
    throw new Error("Failed to store image asset sizes for media bookmark.");
  }

  return {
    type: "image",
    width: mediaInfo?.size?.width ?? undefined,
    height: mediaInfo?.size?.height ?? undefined,
    alt: mediaInfo?.altText ?? null,
    source_url: mediaUrl,
    key_small,
    ...(key_medium ? {key_medium} : {}),
    key_large,
  };
}

function buildMediaMetadata(extractedMetadata: ExtractedMediaMetadata) {
  if (!extractedMetadata) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(extractedMetadata).filter(([key]) => key !== "media_extended"),
  );
}

function buildTwitterSizedUrl(url: string, size: "small" | "medium" | "large"): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("pbs.twimg.com")) return null;
    u.searchParams.set("name", size);
    return u.toString();
  } catch {
    return null;
  }
}

async function downloadAndUploadToR2(sourceUrl: string, r2Key: string): Promise<string> {
  const res = await fetch(sourceUrl, {cache: "no-store"});
  if (!res.ok) {
    throw new Error(`Failed to fetch media from "${sourceUrl}": ${res.statusText}`);
  }

  const contentTypeRaw = res.headers.get("content-type") ?? "image/jpeg";
  const contentType = contentTypeRaw.split(";")[0] ?? "image/jpeg";

  await uploadToR2({
    key: r2Key,
    body: Buffer.from(await res.arrayBuffer()),
    contentType,
  });

  return r2Key;
}
