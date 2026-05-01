import {randomUUID} from "crypto";
import type {MediaMediaItem} from "@/components/bookmark/types/metadata";
import type {ImageItem, MediaImages, VideoItem} from "@/db/schema";
import {ALLOWED_MEDIA_DOMAINS} from "@/features/media/constants";
import {extractXMedia} from "@/features/media/server/fetch";
import {buildMediaAssetKey, buildVideoAssetKey} from "@/features/media/utils";
import {normalizeInputUrl} from "@/lib/fetch/web/url";

type ExtractedMediaMetadata = Awaited<ReturnType<typeof extractXMedia>>;
type VideoMediaInfo = MediaMediaItem & {type: "video" | "gif"};

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

export async function prepareMediaBookmark(input: {
  url: string;
  selectedMediaUrls?: string[];
  userId: string;
}): Promise<PrepareMediaBookmarkResult> {
  const normalized = normalizeInputUrl(input.url);

  // check if the domain is supported for media bookmarks
  assertSupportedMediaBookmark(normalized);

  const extractedMetadata = await extractRequiredMediaMetadata(normalized.toString());
  const mediaUrls = getMediaUrls(extractedMetadata);
  const mediaItems = getMediaItems(extractedMetadata, mediaUrls);

  if (!input.selectedMediaUrls && mediaUrls.length > 1) {
    return {requiresSelection: true, normalized, mediaUrls, mediaItems};
  }

  const selectedMediaUrls = getSelectedMediaUrls(input.selectedMediaUrls, mediaUrls);
  const bookmarkId = randomUUID();

  const bookmarkToInsert = await buildMediaBookmarkInsert({
    bookmarkId,
    normalizedUrl: normalized.toString(),
    userId: input.userId,
    selectedMediaUrls,
    extractedMetadata,
  });

  return {
    requiresSelection: false,
    normalized,
    mediaUrls,
    mediaItems,
    bookmarkId,
    bookmarkToInsert,
  };
}

export async function buildMediaBookmarkInsert(input: {
  bookmarkId: string;
  normalizedUrl: string;
  userId: string;
  selectedMediaUrls: string[];
  extractedMetadata: ExtractedMediaMetadata;
}): Promise<BookmarkToInsert> {
  const items = await Promise.all(
    input.selectedMediaUrls.map((mediaUrl) =>
      buildPendingMediaItem({
        mediaUrl,
        mediaItems: input.extractedMetadata.media_extended,
      }),
    ),
  );

  return {
    id: input.bookmarkId,
    url: input.normalizedUrl,
    description: input.extractedMetadata.text ?? null,
    userId: input.userId,
    kind: "media",
    images: {processing: true, items},
    metadata: buildMediaMetadata(input.extractedMetadata),
  };
}

function assertSupportedMediaBookmark(normalized: URL) {
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
}

async function extractRequiredMediaMetadata(url: string): Promise<ExtractedMediaMetadata> {
  const extractedMetadata = await extractXMedia(url);

  if (!extractedMetadata) {
    throw new Error("Could not fetch post data. Please try again.");
  }

  if (extractedMetadata.hasMedia === false) {
    throw new Error("This post has no media. Please save it as a Website bookmark instead.");
  }

  return extractedMetadata;
}

function getMediaUrls(extractedMetadata: ExtractedMediaMetadata): string[] {
  return Array.isArray(extractedMetadata.mediaURLs) ? extractedMetadata.mediaURLs : [];
}

function getMediaItems(
  extractedMetadata: ExtractedMediaMetadata,
  mediaUrls: string[],
): MediaMediaItem[] {
  if (!Array.isArray(extractedMetadata.media_extended)) {
    return [];
  }

  return extractedMetadata.media_extended.filter(
    (item): item is MediaMediaItem => typeof item?.url === "string" && mediaUrls.includes(item.url),
  );
}

// decides which media URLs will actually be used for bookmark creation, and validates them
function getSelectedMediaUrls(
  selectedMediaUrls: string[] | undefined,
  mediaUrls: string[],
): string[] {
  const requestedUrls = selectedMediaUrls?.length ? selectedMediaUrls : mediaUrls;
  const seen = new Set<string>();
  const urlsToCreate = requestedUrls.filter((url) => {
    if (!mediaUrls.includes(url) || seen.has(url)) {
      return false;
    }

    seen.add(url);
    return true;
  });

  if (urlsToCreate.length === 0) {
    throw new Error("This post has no media. Please save it as a Website bookmark instead.");
  }

  return urlsToCreate;
}

async function buildPendingMediaItem(input: {
  mediaUrl: string;
  mediaItems: MediaMediaItem[] | undefined;
}): Promise<ImageItem | VideoItem> {
  const mediaInfo = input.mediaItems?.find((item) => item.url === input.mediaUrl) ?? null;

  if (isVideoMediaInfo(mediaInfo)) {
    return buildPendingVideoItem(input.mediaUrl, mediaInfo);
  }

  return buildPendingImageItem(input.mediaUrl, mediaInfo);
}

async function buildPendingImageItem(
  sourceUrl: string,
  mediaInfo: MediaMediaItem | null,
): Promise<ImageItem> {
  return {
    type: "image",
    width: mediaInfo?.size?.width ?? undefined,
    height: mediaInfo?.size?.height ?? undefined,
    alt: mediaInfo?.altText ?? null,
    source_url: sourceUrl,
    media_key: await buildMediaAssetKey(sourceUrl),
  };
}

async function buildPendingVideoItem(
  sourceUrl: string,
  mediaInfo: VideoMediaInfo,
): Promise<VideoItem> {
  const videoKey = await buildVideoAssetKey(sourceUrl);
  const thumbnailKey = mediaInfo.thumbnail_url
    ? await buildMediaAssetKey(mediaInfo.thumbnail_url)
    : null;

  return {
    type: mediaInfo.type,
    width: mediaInfo.size?.width ?? undefined,
    height: mediaInfo.size?.height ?? undefined,
    alt: mediaInfo.altText ?? null,
    source_url: sourceUrl,
    source_thumbnail_url: mediaInfo.thumbnail_url ?? null,
    key: videoKey,
    ...(thumbnailKey ? {key_thumbnail: thumbnailKey} : {}),
  };
}

function isVideoMediaInfo(mediaInfo: MediaMediaItem | null): mediaInfo is VideoMediaInfo {
  return mediaInfo?.type === "video" || mediaInfo?.type === "gif";
}

function buildMediaMetadata(extractedMetadata: ExtractedMediaMetadata) {
  return Object.fromEntries(
    Object.entries(extractedMetadata).filter(([key]) => key !== "media_extended"),
  );
}
