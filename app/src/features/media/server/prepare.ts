import {randomUUID} from "crypto";
import {ALLOWED_MEDIA_DOMAINS} from "@/features/media/constants";
import type {MediaImages, PostMediaItem} from "@/db/schema";
import type {MediaMediaItem} from "@/app/home/_types/bookmark-metadata";
import {extractXMedia} from "./fetch";
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

  const requestedUrls = input.selectedMediaUrls?.length ? input.selectedMediaUrls : mediaUrls;
  const urlsToCreate = requestedUrls.filter((url) => mediaUrls.includes(url));

  if (urlsToCreate.length === 0) {
    throw new Error("This post has no media. Please save it as a Website bookmark instead.");
  }

  const bookmarkId = randomUUID();
  const items = urlsToCreate.map((mediaUrl, index) =>
    buildPendingMediaItem({mediaUrl, bookmarkId, index, extractedMetadata}),
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
      images: {processing: true, items},
      metadata: buildMediaMetadata(extractedMetadata),
    },
  };
}

function buildPendingMediaItem(input: {
  mediaUrl: string;
  bookmarkId: string;
  index: number;
  extractedMetadata: ExtractedMediaMetadata;
}): PostMediaItem {
  const mediaInfo: MediaExtendedItem | null =
    input.extractedMetadata?.media_extended?.find(
      (item: MediaExtendedItem) => item.url === input.mediaUrl,
    ) ?? null;

  const type = mediaInfo?.type === "photo" || !mediaInfo?.type ? "image" : mediaInfo.type;
  const baseKey = `posts/${input.bookmarkId}/media_${input.index}`;

  if (type === "video" || type === "gif") {
    return {
      type,
      width: mediaInfo?.size?.width ?? undefined,
      height: mediaInfo?.size?.height ?? undefined,
      alt: mediaInfo?.altText ?? null,
      source_url: input.mediaUrl,
      source_thumbnail_url: mediaInfo?.thumbnail_url ?? null,
      key: `${baseKey}.mp4`,
      ...(mediaInfo?.thumbnail_url ? {key_thumbnail: `${baseKey}_thumbnail.jpg`} : {}),
    };
  }

  return {
    type: "image",
    width: mediaInfo?.size?.width ?? undefined,
    height: mediaInfo?.size?.height ?? undefined,
    alt: mediaInfo?.altText ?? null,
    source_url: input.mediaUrl,
    key_small: `${baseKey}_small.jpg`,
    key_medium: `${baseKey}_medium.jpg`,
    key_large: `${baseKey}_large.jpg`,
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
