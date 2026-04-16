import {randomUUID} from "crypto";
import {fetchXPostData, type VxTwitterPost, type VxTwitterMediaItem} from "@/lib/fetch/post";
import {uploadToR2, buildR2PublicUrl} from "@/lib/storage/r2-storage";
import {normalizeInputUrl} from "@/lib/fetch/web/url";

export type PostBookmarkMetadata = {
  platform: "x";
  tweetId: string;
  text: string;
  date: string;
  date_epoch: number;
  user_name: string;
  user_screen_name: string;
  user_profile_image_url: string;
  likes: number;
  retweets: number;
  replies: number;
  lang: string;
  hashtags: string[];
  hasMedia: boolean;
  media_extended: VxTwitterMediaItem[];
  qrt: {
    tweetId: string;
    text: string;
    user_name: string;
    user_screen_name: string;
    user_profile_image_url: string;
    hasMedia: boolean;
    media_extended: VxTwitterMediaItem[];
  } | null;
};

export type PreparedPostBookmark = {
  bookmarkId: string;
  url: string;
  userId: string;
  kind: "post";
  previewImage: string;
  metadata: PostBookmarkMetadata;
};

async function uploadThumbnailToR2(thumbnailUrl: string, bookmarkId: string): Promise<string> {
  try {
    const res = await fetch(thumbnailUrl);
    if (!res.ok) return thumbnailUrl;

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const key = `posts/${bookmarkId}/thumbnail.${ext}`;

    await uploadToR2({
      key,
      body: Buffer.from(buffer),
      contentType,
    });

    return buildR2PublicUrl(key);
  } catch {
    return thumbnailUrl;
  }
}

function buildPostMetadata(post: VxTwitterPost): PostBookmarkMetadata {
  const qrt = post.qrt
    ? {
        tweetId: post.qrt.tweetID,
        text: post.qrt.text,
        user_name: post.qrt.user_name,
        user_screen_name: post.qrt.user_screen_name,
        user_profile_image_url: post.qrt.user_profile_image_url,
        hasMedia: post.qrt.hasMedia,
        media_extended: post.qrt.media_extended ?? [],
      }
    : null;

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
    qrt,
  };
}

function pickThumbnailUrl(post: VxTwitterPost): string | null {
  const firstMedia = post.media_extended?.[0];
  if (firstMedia?.thumbnail_url) return firstMedia.thumbnail_url;
  if (firstMedia?.type === "photo" && firstMedia.url) return firstMedia.url;
  return post.user_profile_image_url ?? null;
}

export async function preparePostBookmarkCreation(input: {
  url: string;
  userId: string;
}): Promise<PreparedPostBookmark> {
  const normalized = normalizeInputUrl(input.url);
  const post = await fetchXPostData(normalized.toString());

  const bookmarkId = randomUUID();
  const metadata = buildPostMetadata(post);

  const rawThumbnail = pickThumbnailUrl(post);
  const previewImage = rawThumbnail ? await uploadThumbnailToR2(rawThumbnail, bookmarkId) : "";

  return {
    bookmarkId,
    url: normalized.toString(),
    userId: input.userId,
    kind: "post",
    previewImage,
    metadata,
  };
}
