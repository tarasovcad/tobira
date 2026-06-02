import type {PostBookmark} from "@/components/bookmark/types";
import type {PostImages} from "@/db/schema";
import type {FreebirdXPostMediaItem} from "@/lib/fetch/post";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {isPostImages} from "./bookmark-image-guards";
import type {MediaGalleryEntry} from "./media-grid-render";

type StoredPostMediaItem = PostImages["items"][number];
type StoredPostArticleItem = NonNullable<PostImages["articleItems"]>[number];
type PostMediaGroup = "main" | "qrt";
type PostPreviewVariant = "list" | "menu";

export type PostBookmarkPreviewItem = {
  key: string;
  type: "image" | "video";
  src: string;
  fullSizeSrc?: string;
  poster?: string;
  width: number;
  height: number;
  aspectRatio?: number;
  durationMillis?: number | null;
  alt: string;
};

export type PostBookmarkMediaGalleryEntry = MediaGalleryEntry<
  PostBookmark,
  PostBookmarkPreviewItem
>;

function buildR2SizedImageUrl(key: string, size: "thumb" | "small" | "medium" | "large"): string {
  const url = new URL(buildR2PublicUrl(key));
  url.searchParams.set("size", size);
  url.searchParams.set("format", "webp");
  return url.toString();
}

function buildProcessingImageUrl(sourceUrl: string, size: "thumb" | "small" | "medium" | "large") {
  try {
    const url = new URL(sourceUrl);
    url.searchParams.set("name", size);
    return url.toString();
  } catch {
    return sourceUrl;
  }
}

function rewriteStoredVideoUrl(key: string): string {
  try {
    const url = new URL(buildR2PublicUrl(key));
    url.protocol = "https:";
    url.hostname = "video.tobira.app";
    return url.toString();
  } catch {
    return buildR2PublicUrl(key);
  }
}

function rewriteProcessingVideoUrl(sourceUrl: string): string {
  try {
    const url = new URL(sourceUrl);

    if (url.hostname === "video.twimg.com") {
      url.protocol = "https:";
      url.hostname = "video.tobira.app";
    }

    return url.toString();
  } catch {
    return sourceUrl;
  }
}

function getStoredPostMediaItems(
  images: PostBookmark["images"] | undefined,
  group: PostMediaGroup,
): StoredPostMediaItem[] {
  if (!isPostImages(images)) {
    return [];
  }

  return group === "qrt" ? (images.qrtItems ?? []) : images.items;
}

function isPostMediaProcessing(images: PostBookmark["images"] | undefined) {
  return isPostImages(images) ? images.processing === true : false;
}

function getPreviewSize(variant: PostPreviewVariant) {
  return variant === "menu" ? "small" : "medium";
}

function getMetadataPostMediaItems(
  item: PostBookmark,
  group: PostMediaGroup,
): FreebirdXPostMediaItem[] {
  const post = item.metadata?.tweet.post;
  if (!post) return [];

  return group === "qrt" ? (post.qrt?.post.media_extended ?? []) : post.media_extended;
}

function getMetadataReplyMediaItems(item: PostBookmark, tweetId: string): FreebirdXPostMediaItem[] {
  return (
    item.metadata?.reply_chain?.find((reply) => reply.post.tweetID === tweetId)?.post
      .media_extended ?? []
  );
}

function getMetadataMediaAspectRatio(item?: FreebirdXPostMediaItem) {
  const [width, height] = item?.aspect_ratio ?? [];
  if (!width || !height || width <= 0 || height <= 0) {
    return undefined;
  }

  return width / height;
}

function buildStoredPreviewItem(
  item: StoredPostMediaItem,
  processing: boolean,
  variant: PostPreviewVariant,
  aspectRatio?: number,
  durationMillis?: number | null,
): PostBookmarkPreviewItem {
  const previewSize = getPreviewSize(variant);
  const baseItem = {
    width: item.width ?? 1200,
    height: item.height ?? 1200,
    ...(aspectRatio ? {aspectRatio} : {}),
    ...(durationMillis != null ? {durationMillis} : {}),
    alt: item.alt ?? "",
  };

  if (item.type === "image") {
    return {
      ...baseItem,
      key: item.media_key ?? item.source_url,
      type: "image",
      src:
        processing || !item.media_key
          ? buildProcessingImageUrl(item.source_url, previewSize)
          : buildR2SizedImageUrl(item.media_key, previewSize),
      fullSizeSrc:
        processing || !item.media_key
          ? buildProcessingImageUrl(item.source_url, "large")
          : buildR2SizedImageUrl(item.media_key, "large"),
    };
  }

  const sourcePoster = item.source_thumbnail_url ?? undefined;

  if (variant === "menu") {
    const previewSrc =
      processing || !item.key_thumbnail
        ? sourcePoster
          ? buildProcessingImageUrl(sourcePoster, "small")
          : ""
        : buildR2SizedImageUrl(item.key_thumbnail, "small");

    return {
      ...baseItem,
      key: item.key ?? item.source_url,
      type: "image",
      src: previewSrc,
      fullSizeSrc:
        processing || !item.key_thumbnail
          ? previewSrc
          : buildR2SizedImageUrl(item.key_thumbnail, "large"),
    };
  }

  return {
    ...baseItem,
    key: item.key ?? item.source_url,
    type: "video",
    src:
      processing || !item.key
        ? rewriteProcessingVideoUrl(item.source_url)
        : rewriteStoredVideoUrl(item.key),
    poster:
      processing || !item.key_thumbnail
        ? sourcePoster
          ? buildProcessingImageUrl(sourcePoster, previewSize)
          : undefined
        : buildR2SizedImageUrl(item.key_thumbnail, previewSize),
  };
}

export function getPostBookmarkMediaPreviewItems(
  item: PostBookmark,
  group: PostMediaGroup,
  variant: PostPreviewVariant,
): PostBookmarkPreviewItem[] {
  const storedItems = getStoredPostMediaItems(item.images, group);
  const processing = isPostMediaProcessing(item.images);
  const metadataItems = getMetadataPostMediaItems(item, group);

  return storedItems.map((mediaItem, mediaIndex) =>
    buildStoredPreviewItem(
      mediaItem,
      processing,
      variant,
      getMetadataMediaAspectRatio(metadataItems.at(mediaIndex)),
      metadataItems.at(mediaIndex)?.duration_millis ?? null,
    ),
  );
}

export function getPostBookmarkReplyMediaPreviewItems(
  item: PostBookmark,
  tweetId: string,
  variant: PostPreviewVariant,
): PostBookmarkPreviewItem[] {
  if (!isPostImages(item.images)) {
    return [];
  }

  const reply = item.images.replyItems?.find((replyItem) => replyItem.tweetId === tweetId);
  const processing = isPostMediaProcessing(item.images);
  const metadataItems = getMetadataReplyMediaItems(item, tweetId);

  return (reply?.items ?? []).map((mediaItem, mediaIndex) =>
    buildStoredPreviewItem(
      mediaItem,
      processing,
      variant,
      getMetadataMediaAspectRatio(metadataItems.at(mediaIndex)),
      metadataItems.at(mediaIndex)?.duration_millis ?? null,
    ),
  );
}

export function getPostBookmarkArticleCoverPreviewItem(
  item: PostBookmark,
  variant: PostPreviewVariant,
  articleIndex = 0,
): PostBookmarkPreviewItem | null {
  if (!isPostImages(item.images)) {
    return null;
  }

  const articleItems = item.images.articleItems ?? [];
  let currentCoverIndex = 0;
  const articleItem =
    articleItems.find((mediaItem) => {
      if (mediaItem.articleMediaType !== "cover") {
        return false;
      }

      if (currentCoverIndex === articleIndex) {
        return true;
      }

      currentCoverIndex += 1;
      return false;
    }) ?? (articleIndex === 0 ? (articleItems.find(() => true) ?? null) : null);

  if (!articleItem) {
    return null;
  }

  return buildStoredPreviewItem(
    articleItem satisfies StoredPostArticleItem,
    isPostMediaProcessing(item.images),
    variant,
  );
}

export function buildPostBookmarkMediaGalleryEntries(
  item: PostBookmark,
  group: PostMediaGroup = "main",
  variant: PostPreviewVariant = "list",
): PostBookmarkMediaGalleryEntry[] {
  return getPostBookmarkMediaPreviewItems(item, group, variant).map((previewItem, mediaIndex) => ({
    item,
    bookmarkIndex: 0,
    mediaIndex,
    renderId: `${item.id}:${group}:${mediaIndex}`,
    previewItem,
  }));
}
