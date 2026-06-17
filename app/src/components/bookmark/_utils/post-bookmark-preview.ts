import type {PostBookmark} from "@/components/bookmark/types";
import type {ArticleImageItem, PostImages} from "@/db/schema";
import {
  getFreebirdXArticleImageInfo,
  getFreebirdXArticleMediaSourceUrl,
  isFreebirdXArticleVideoMedia,
  type FreebirdXArticle,
  type FreebirdXArticleMedia,
  type FreebirdXPostCard,
  type FreebirdXPostMediaItem,
} from "@/lib/fetch/post";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {isPostImages} from "./bookmark-image-guards";
import type {MediaGalleryEntry} from "./media-grid-render";

type StoredPostMediaItem = PostImages["items"][number];
type StoredPostArticleItem = NonNullable<PostImages["articleItems"]>[number];
type StoredPostCardItem = NonNullable<PostImages["cardItems"]>[number];
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

export type PostBookmarkArticlePreviewItem = PostBookmarkPreviewItem & {
  articleMediaIndex: number;
  articleMediaType: ArticleImageItem["articleMediaType"];
  mediaId: string;
  sourceUrl: string;
};

export type PostBookmarkMediaGalleryEntry = MediaGalleryEntry<
  PostBookmark,
  PostBookmarkPreviewItem
>;

function buildR2SizedImageUrl(
  key: string,
  size: "thumb" | "small" | "medium" | "large" | "orig",
): string {
  const url = new URL(buildR2PublicUrl(key));
  url.searchParams.set("size", size);
  url.searchParams.set("format", "webp");
  return url.toString();
}

function buildProcessingImageUrl(
  sourceUrl: string,
  size: "thumb" | "small" | "medium" | "large" | "orig",
) {
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
          ? buildProcessingImageUrl(item.source_url, "orig")
          : buildR2SizedImageUrl(item.media_key, "orig"),
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
          : buildR2SizedImageUrl(item.key_thumbnail, "orig"),
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

function buildArticleMetadataPreviewItem(input: ArticleMediaInput): PostBookmarkPreviewItem {
  if (isFreebirdXArticleVideoMedia(input.item)) {
    const mediaInfo = input.item.media_info;
    const sourceUrl = getFreebirdXArticleMediaSourceUrl(input.item);
    const previewImage = mediaInfo.preview_image;

    return {
      alt: "",
      fullSizeSrc: sourceUrl ?? previewImage.original_img_url,
      height: previewImage.original_img_height,
      key:
        input.item.media_key || input.item.media_id || sourceUrl || previewImage.original_img_url,
      poster: previewImage.original_img_url,
      src: sourceUrl ?? previewImage.original_img_url,
      type: "video",
      width: previewImage.original_img_width,
      ...(mediaInfo.duration_millis != null ? {durationMillis: mediaInfo.duration_millis} : {}),
    };
  }

  const imageInfo = getFreebirdXArticleImageInfo(input.item.media_info);

  return {
    alt: "",
    fullSizeSrc: imageInfo.original_img_url,
    height: imageInfo.original_img_height,
    key: input.item.media_key || input.item.media_id || imageInfo.original_img_url,
    src: imageInfo.original_img_url,
    type: "image",
    width: imageInfo.original_img_width,
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

function buildExternalCardPreviewItem(card: FreebirdXPostCard): PostBookmarkPreviewItem | null {
  if (!card.image.url) {
    return null;
  }

  return {
    key: card.image.url,
    type: "image",
    src: card.image.url,
    fullSizeSrc: card.image.url,
    width: card.image.width,
    height: card.image.height,
    alt: card.image.altText ?? card.title,
  };
}

export function getPostBookmarkCardPreviewItem(
  item: PostBookmark,
  tweetId: string,
  card: FreebirdXPostCard,
  variant: PostPreviewVariant,
): PostBookmarkPreviewItem | null {
  const storedItems: StoredPostCardItem[] = isPostImages(item.images)
    ? (item.images.cardItems ?? [])
    : [];
  const storedItem = storedItems.find(
    (mediaItem) => mediaItem.tweetId === tweetId && mediaItem.source_url === card.image.url,
  );

  if (storedItem) {
    return buildStoredPreviewItem(storedItem, isPostMediaProcessing(item.images), variant);
  }

  return buildExternalCardPreviewItem(card);
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

type ArticleMediaInput = {
  index: number;
  item: FreebirdXArticleMedia;
  mediaType: ArticleImageItem["articleMediaType"];
};

function getArticleMediaInputs(article: FreebirdXArticle): ArticleMediaInput[] {
  return [
    ...(article.cover_media ? [{item: article.cover_media, mediaType: "cover" as const}] : []),
    ...(article.media_entities ?? []).map((item, index) => ({
      index,
      item,
      mediaType: "media_entity" as const,
    })),
  ].map((input) => ({
    ...input,
    index: "index" in input ? input.index : 0,
  }));
}

export function getPostBookmarkArticleMediaPreviewItems(
  item: PostBookmark,
  article: FreebirdXArticle,
  variant: PostPreviewVariant,
): PostBookmarkArticlePreviewItem[] {
  const storedItems = isPostImages(item.images) ? (item.images.articleItems ?? []) : [];
  const processing = isPostMediaProcessing(item.images);

  return getArticleMediaInputs(article).map((articleMediaItem) => {
    const sourceUrl = getFreebirdXArticleMediaSourceUrl(articleMediaItem.item);
    const storedItem = storedItems.find(
      (stored) =>
        stored.articleMediaType === articleMediaItem.mediaType &&
        stored.articleMediaIndex === articleMediaItem.index &&
        (sourceUrl ? stored.source_url === sourceUrl : true),
    );
    const previewItem = storedItem
      ? buildStoredPreviewItem(storedItem, processing, variant)
      : buildArticleMetadataPreviewItem(articleMediaItem);

    return {
      ...previewItem,
      articleMediaIndex: articleMediaItem.index,
      articleMediaType: articleMediaItem.mediaType,
      mediaId: articleMediaItem.item.media_id,
      sourceUrl: sourceUrl ?? previewItem.src,
    };
  });
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

export function buildPostBookmarkReplyMediaGalleryEntries(
  item: PostBookmark,
  tweetId: string,
  variant: PostPreviewVariant = "list",
): PostBookmarkMediaGalleryEntry[] {
  return getPostBookmarkReplyMediaPreviewItems(item, tweetId, variant).map(
    (previewItem, mediaIndex) => ({
      item,
      bookmarkIndex: 0,
      mediaIndex,
      renderId: `${item.id}:reply:${tweetId}:${mediaIndex}`,
      previewItem,
    }),
  );
}
