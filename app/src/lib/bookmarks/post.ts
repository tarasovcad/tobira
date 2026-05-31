import {randomUUID} from "crypto";
import {
  fetchXPostData,
  type FreebirdXPostData,
  type FreebirdXPostMediaItem,
} from "@/lib/fetch/post";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import type {ImageItem, PostImages, VideoItem} from "@/db/schema";
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
  const [items, qrtItems, replyItems] = await Promise.all([
    buildPostMediaItems(post.media_extended),
    buildPostMediaItems(post.qrt?.post.media_extended),
    buildReplyMediaItems(replies),
  ]);

  return {
    processing:
      items.length > 0 || qrtItems.length > 0 || replyItems.some((reply) => reply.items.length > 0),
    items,
    ...(qrtItems.length > 0 ? {qrtItems} : {}),
    ...(replyItems.length > 0 ? {replyItems} : {}),
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
  return Promise.all((items ?? []).map(buildPostMediaItem));
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
