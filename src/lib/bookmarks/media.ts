import {randomUUID} from "crypto";
import {ALLOWED_MEDIA_DOMAINS} from "@/components/providers/constants";
import {extractXMedia} from "@/lib/fetch/media";
import {buildR2PublicUrl, uploadToR2} from "@/lib/storage/r2-storage";
import {normalizeInputUrl} from "@/lib/fetch/web";

type ExtractedMediaMetadata = Awaited<ReturnType<typeof extractXMedia>>;

type ExtractedMediaItem = {
  url: string;
  thumbnail_url?: string | null;
  size?: {
    width?: number | null;
    height?: number | null;
  } | null;
};

type PreparedMediaBookmark = {
  bookmarkId: string;
  previewImage: string;
  metadata: Record<string, unknown> | null;
};

type PreparedMediaSelection = {
  normalized: URL;
  mediaUrls: string[];
};

export type PrepareMediaBookmarkResult =
  | ({
      requiresSelection: true;
    } & PreparedMediaSelection)
  | ({
      requiresSelection: false;
      bookmarksToInsert: Array<{
        id: string;
        url: string;
        description: string | null;
        userId: string;
        kind: "media";
        previewImage: string;
        metadata: Record<string, unknown> | null;
      }>;
      bookmarkIds: string[];
    } & PreparedMediaSelection);

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

  const isXDomain = ["x.com", "twitter.com", "www.x.com", "www.twitter.com"].includes(hostname);
  if (!isXDomain) {
    throw new Error("Only X (Twitter) URLs are currently supported for media bookmarks.");
  }

  let mediaUrls: string[] = [];
  const extractedMetadata = await extractXMedia(normalized.toString());

  if (extractedMetadata?.hasMedia === false) {
    throw new Error("This post has no media. Please save it as a Website bookmark instead.");
  }

  if (Array.isArray(extractedMetadata?.mediaURLs)) {
    mediaUrls = extractedMetadata.mediaURLs;
  }

  if (!input.selectedMediaUrls && mediaUrls.length > 1) {
    return {
      requiresSelection: true,
      normalized,
      mediaUrls,
    };
  }

  const urlsToCreate = input.selectedMediaUrls?.length ? input.selectedMediaUrls : mediaUrls;
  const preparedBookmarks = await Promise.all(
    urlsToCreate.map((mediaUrl) => prepareSingleMediaBookmark({mediaUrl, extractedMetadata})),
  );

  return {
    requiresSelection: false,
    normalized,
    mediaUrls,
    bookmarkIds: preparedBookmarks.map((bookmark) => bookmark.bookmarkId),
    bookmarksToInsert: preparedBookmarks.map((bookmark) => ({
      id: bookmark.bookmarkId,
      url: normalized.toString(),
      description: extractedMetadata?.text || null,
      userId: input.userId,
      kind: "media",
      previewImage: bookmark.previewImage,
      metadata: bookmark.metadata,
    })),
  };
}

async function prepareSingleMediaBookmark(input: {
  mediaUrl: string;
  extractedMetadata: ExtractedMediaMetadata;
}): Promise<PreparedMediaBookmark> {
  const bookmarkId = randomUUID();
  const previewImage = await processAndUploadMediaImage(input.mediaUrl, bookmarkId);

  let uploadedThumbnailUrl = null;
  let mediaInfo: ExtractedMediaItem | null = null;

  if (input.extractedMetadata?.media_extended) {
    mediaInfo =
      input.extractedMetadata.media_extended.find(
        (item: {url: string}) => item.url === input.mediaUrl,
      ) ?? null;

    if (mediaInfo?.thumbnail_url) {
      uploadedThumbnailUrl = await processAndUploadMediaImage(
        mediaInfo.thumbnail_url,
        bookmarkId,
        "placeholder",
      );
    }
  }

  return {
    bookmarkId,
    previewImage,
    metadata: buildMediaMetadata(input.extractedMetadata, mediaInfo, uploadedThumbnailUrl),
  };
}

function buildMediaMetadata(
  extractedMetadata: ExtractedMediaMetadata,
  mediaInfo: ExtractedMediaItem | null,
  uploadedThumbnailUrl: string | null,
) {
  if (!extractedMetadata) {
    return null;
  }

  const {media_extended: _mediaExtended, ...restMetadata} = extractedMetadata;

  return {
    ...restMetadata,
    width: mediaInfo?.size?.width || null,
    height: mediaInfo?.size?.height || null,
    thumbnail_url: uploadedThumbnailUrl || mediaInfo?.thumbnail_url || null,
  };
}

async function processAndUploadMediaImage(
  mediaUrl: string,
  bookmarkId: string,
  filenamePrefix = "media",
): Promise<string> {
  try {
    const isMp4 = mediaUrl.endsWith(".mp4") || mediaUrl.includes(".mp4?");
    const isMov = mediaUrl.endsWith(".mov") || mediaUrl.includes(".mov?");
    const isVideo = isMp4 || isMov;

    const imageRes = await fetch(mediaUrl);
    if (!imageRes.ok) return mediaUrl;

    const imageBuffer = await imageRes.arrayBuffer();

    let fallbackContentType = "image/jpeg";
    let fallbackExtension = "jpg";

    if (isMp4) {
      fallbackContentType = "video/mp4";
      fallbackExtension = "mp4";
    } else if (isMov) {
      fallbackContentType = "video/quicktime";
      fallbackExtension = "mov";
    }

    const contentType = imageRes.headers.get("content-type") || fallbackContentType;
    let extension = contentType.split("/")[1]?.replace("jpeg", "jpg") || fallbackExtension;

    if (
      isVideo &&
      !extension.includes("mp4") &&
      !extension.includes("quicktime") &&
      !extension.includes("mov")
    ) {
      extension = fallbackExtension;
    }

    const objectKey = `media/${bookmarkId}/${filenamePrefix}.${extension}`;
    await uploadToR2({
      key: objectKey,
      body: Buffer.from(imageBuffer),
      contentType,
    });

    return buildR2PublicUrl(objectKey);
  } catch (error) {
    console.error("Failed to fetch media for storage:", error);
    return mediaUrl;
  }
}
