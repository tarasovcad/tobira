import {randomUUID} from "crypto";
import {fetchXPostData, type VxTwitterPost, type VxTwitterMediaItem} from "@/lib/fetch/post";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import type {PostBookmarkMetadata} from "@/components/bookmark/types/metadata";
import type {ImageItem, PostImages, VideoItem} from "@/db/schema";
import {buildMediaAssetKey, buildVideoAssetKey} from "@/features/media/utils";

type PostMediaItem = ImageItem | VideoItem;
type VideoPostMediaItem = VxTwitterMediaItem & {type: "video" | "gif"};

export type PreparedPostBookmark = {
  bookmarkId: string;
  url: string;
  userId: string;
  kind: "post";
  images: PostImages;
  metadata: PostBookmarkMetadata;
};

export async function preparePostBookmarkCreation(input: {
  url: string;
  userId: string;
}): Promise<PreparedPostBookmark> {
  const normalized = normalizeInputUrl(input.url);
  const normalizedUrl = normalized.toString();
  const post = await fetchXPostData(normalizedUrl);

  const bookmarkId = randomUUID();
  const images = await buildPostImages(post);
  const metadata = buildPostMetadata(post);

  return {
    bookmarkId,
    url: normalizedUrl,
    userId: input.userId,
    kind: "post",
    images,
    metadata,
  };
}

async function buildPostImages(post: VxTwitterPost): Promise<PostImages> {
  const [items, qrtItems] = await Promise.all([
    buildPostMediaItems(post.media_extended),
    buildPostMediaItems(post.qrt?.media_extended),
  ]);

  return {
    processing: items.length > 0 || qrtItems.length > 0,
    items,
    ...(qrtItems.length > 0 ? {qrtItems} : {}),
  };
}

function buildPostMediaItems(items: VxTwitterMediaItem[] | null | undefined) {
  return Promise.all((items ?? []).map(buildPostMediaItem));
}

function buildPostMediaItem(item: VxTwitterMediaItem): Promise<PostMediaItem> {
  return isVideoPostMediaItem(item) ? buildVideoItem(item) : buildImageItem(item);
}

async function buildImageItem(item: VxTwitterMediaItem): Promise<ImageItem> {
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

function getMediaDimensions(item: VxTwitterMediaItem) {
  return {
    width: item.size?.width ?? undefined,
    height: item.size?.height ?? undefined,
  };
}

function isVideoPostMediaItem(item: VxTwitterMediaItem): item is VideoPostMediaItem {
  return item.type === "video" || item.type === "gif";
}

function buildPostMetadata(post: VxTwitterPost): PostBookmarkMetadata {
  return {
    platform: "x",
    tweetId: post.tweetID,
    text: post.text,
    date: post.date,
    date_epoch: post.date_epoch,
    user_name: post.user_name,
    user_screen_name: post.user_screen_name,
    user_profile_image_url: post.user_profile_image_url,
    likes: post.likes,
    retweets: post.retweets,
    replies: post.replies,
    lang: post.lang,
    hashtags: post.hashtags ?? [],
    hasMedia: post.hasMedia,
    media_extended: post.media_extended ?? [],
    qrt: post.qrt ? buildQuotedPostMetadata(post.qrt) : null,
  };
}

function buildQuotedPostMetadata(post: VxTwitterPost): NonNullable<PostBookmarkMetadata["qrt"]> {
  return {
    tweetId: post.tweetID,
    text: post.text,
    user_name: post.user_name,
    user_screen_name: post.user_screen_name,
    user_profile_image_url: post.user_profile_image_url,
    hasMedia: post.hasMedia,
    media_extended: post.media_extended ?? [],
  };
}
