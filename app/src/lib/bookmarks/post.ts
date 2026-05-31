import {randomUUID} from "crypto";
import {
  fetchXPostData,
  type FreebirdXArticle,
  type FreebirdXArticleMedia,
  type FreebirdXPost,
  type FreebirdXPostData,
  type FreebirdXPostMediaItem,
} from "@/lib/fetch/post";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import type {ArticleImageItem, ImageItem, PostImages, VideoItem} from "@/db/schema";
import {buildMediaAssetKey, buildVideoAssetKey} from "@/features/media/utils";

type PostMediaItem = ImageItem | VideoItem;
type VideoPostMediaItem = FreebirdXPostMediaItem & {type: "video" | "gif"};

type BookmarkToInsert = {
  id: string;
  url: string;
  title: null;
  description: null;
  userId: string;
  kind: "post";
  images: PostImages;
  metadata: FreebirdXPostData;
};

export type PreparedPostBookmark = {
  bookmarkId: string;
  url: string;
  bookmarkToInsert: BookmarkToInsert;
};

export async function preparePostBookmarkCreation(input: {
  url: string;
  userId: string;
}): Promise<PreparedPostBookmark> {
  const normalized = normalizeInputUrl(input.url);
  const normalizedUrl = normalized.toString();
  const postResponse = await fetchXPostData(normalizedUrl);

  const bookmarkId = randomUUID();
  const images = await buildPostImages(postResponse);
  const bookmarkToInsert = {
    id: bookmarkId,
    url: normalizedUrl,
    title: null,
    description: null,
    userId: input.userId,
    kind: "post",
    images,
    metadata: postResponse,
  } satisfies BookmarkToInsert;

  return {
    bookmarkId,
    url: normalizedUrl,
    bookmarkToInsert,
  };
}

async function buildPostImages(postData: FreebirdXPostData): Promise<PostImages> {
  const post = postData.tweet.post;
  const replies = postData.reply_chain ?? [];
  const [items, qrtItems, replyItems, articleItems] = await Promise.all([
    buildPostMediaItems(post.media_extended),
    buildPostMediaItems(post.qrt?.post.media_extended),
    buildReplyMediaItems(replies),
    buildArticleItems(post, replies),
  ]);

  return {
    processing:
      items.length > 0 ||
      qrtItems.length > 0 ||
      replyItems.some((reply) => reply.items.length > 0) ||
      articleItems.length > 0,
    items,
    ...(qrtItems.length > 0 ? {qrtItems} : {}),
    ...(replyItems.length > 0 ? {replyItems} : {}),
    ...(articleItems.length > 0 ? {articleItems} : {}),
  };
}

async function buildReplyMediaItems(replies: FreebirdXPostData["reply_chain"]) {
  const replyItems = await Promise.all(
    (replies ?? []).map(async (reply) => ({
      tweetId: reply.post.tweetID,
      items: await buildPostMediaItems(reply.post.media_extended),
    })),
  );

  return replyItems.filter((reply) => reply.items.length > 0);
}

function buildPostMediaItems(items: FreebirdXPostMediaItem[] | null | undefined) {
  const seenUrls = new Set<string>();
  const uniqueItems = (items ?? []).filter((item) => {
    if (seenUrls.has(item.url)) {
      return false;
    }

    seenUrls.add(item.url);
    return true;
  });

  return Promise.all(uniqueItems.map(buildPostMediaItem));
}

async function buildArticleItems(post: FreebirdXPost, replies: FreebirdXPostData["reply_chain"]) {
  const articleInputs = [
    ...buildArticleItemInputs(post),
    ...buildArticleItemInputs(post.qrt?.post),
    ...(replies ?? []).flatMap((reply) => buildArticleItemInputs(reply.post)),
  ];

  return Promise.all(articleInputs.map(buildArticleImageItem));
}

function buildArticleItemInputs(post: FreebirdXPost | null | undefined) {
  const article = post?.article;
  if (!post || !article) {
    return [];
  }

  const media = [
    ...(article.cover_media ? [{item: article.cover_media, mediaType: "cover" as const}] : []),
    ...(article.media_entities ?? []).map((item, index) => ({
      item,
      mediaType: "media_entity" as const,
      index,
    })),
  ];
  const seenUrls = new Set<string>();

  return media
    .filter(({item}) => {
      const url = item.media_info?.original_img_url;
      if (!url || seenUrls.has(url)) {
        return false;
      }

      seenUrls.add(url);
      return true;
    })
    .map((mediaItem) => ({
      article,
      item: mediaItem.item,
      mediaType: mediaItem.mediaType,
      index: "index" in mediaItem ? mediaItem.index : 0,
    }));
}

async function buildArticleImageItem(input: {
  article: FreebirdXArticle;
  item: FreebirdXArticleMedia;
  mediaType: ArticleImageItem["articleMediaType"];
  index: number;
}): Promise<ArticleImageItem> {
  const sourceUrl = input.item.media_info.original_img_url;

  return {
    type: "image",
    width: input.item.media_info.original_img_width,
    height: input.item.media_info.original_img_height,
    alt: null,
    source_url: sourceUrl,
    media_key: await buildMediaAssetKey(sourceUrl),
    articleMediaType: input.mediaType,
    articleMediaIndex: input.index,
  };
}

function buildPostMediaItem(item: FreebirdXPostMediaItem): Promise<PostMediaItem> {
  return isVideoPostMediaItem(item) ? buildVideoItem(item) : buildImageItem(item);
}

async function buildImageItem(item: FreebirdXPostMediaItem): Promise<ImageItem> {
  return {
    ...getMediaDimensions(item),
    type: "image",
    alt: item.altText ?? null,
    source_url: item.url,
    media_key: await buildMediaAssetKey(item.url),
  };
}

async function buildVideoItem(item: VideoPostMediaItem): Promise<VideoItem> {
  const [videoKey, thumbnailKey] = await Promise.all([
    buildVideoAssetKey(item.url),
    item.thumbnail_url ? buildMediaAssetKey(item.thumbnail_url) : Promise.resolve(null),
  ]);

  return {
    ...getMediaDimensions(item),
    type: item.type,
    alt: item.altText ?? null,
    source_url: item.url,
    source_thumbnail_url: item.thumbnail_url ?? null,
    key: videoKey,
    ...(thumbnailKey ? {key_thumbnail: thumbnailKey} : {}),
  };
}

function getMediaDimensions(item: FreebirdXPostMediaItem) {
  return {
    width: item.size?.width ?? undefined,
    height: item.size?.height ?? undefined,
  };
}

function isVideoPostMediaItem(item: FreebirdXPostMediaItem): item is VideoPostMediaItem {
  return item.type === "video" || item.type === "gif";
}
