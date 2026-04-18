import {randomUUID} from "crypto";
import {fetchXPostData, type VxTwitterPost, type VxTwitterMediaItem} from "@/lib/fetch/post";
import {uploadToR2, buildR2PublicUrl} from "@/lib/storage/r2-storage";
import {normalizeInputUrl} from "@/lib/fetch/web/url";

export type PostBookmarkMediaItem = VxTwitterMediaItem & {
  url_small?: string;
  url_large?: string;
};

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
  media_extended: PostBookmarkMediaItem[];
  qrt: {
    tweetId: string;
    text: string;
    user_name: string;
    user_screen_name: string;
    user_profile_image_url: string;
    hasMedia: boolean;
    media_extended: PostBookmarkMediaItem[];
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

async function downloadAndUploadToR2(sourceUrl: string, r2Key: string): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl, {cache: "no-store"});
    if (!res.ok) return null;
    const contentTypeRaw = res.headers.get("content-type") ?? "image/jpeg";
    const contentType = contentTypeRaw.split(";")[0] ?? "image/jpeg";
    await uploadToR2({key: r2Key, body: Buffer.from(await res.arrayBuffer()), contentType});
    return buildR2PublicUrl(r2Key);
  } catch {
    return null;
  }
}

function buildTwitterSizedUrl(url: string, size: "small" | "large"): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("pbs.twimg.com")) return null;
    u.searchParams.set("name", size);
    return u.toString();
  } catch {
    return null;
  }
}

async function processPostMediaItem(
  item: VxTwitterMediaItem,
  bookmarkId: string,
  index: number,
  prefix: string,
): Promise<PostBookmarkMediaItem> {
  const isVideo = item.type === "video" || item.type === "gif";

  if (isVideo) {
    const [uploadedUrl, uploadedThumb] = await Promise.all([
      downloadAndUploadToR2(item.url, `posts/${bookmarkId}/${prefix}_${index}.mp4`),
      item.thumbnail_url
        ? downloadAndUploadToR2(
            item.thumbnail_url,
            `posts/${bookmarkId}/${prefix}_${index}_thumbnail.jpg`,
          )
        : Promise.resolve(null),
    ]);

    return {
      ...item,
      ...(uploadedUrl ? {url: uploadedUrl} : {}),
      ...(uploadedThumb ? {thumbnail_url: uploadedThumb} : {}),
    };
  }

  const smallSrc = buildTwitterSizedUrl(item.url, "small");
  const largeSrc = buildTwitterSizedUrl(item.url, "large");

  if (!smallSrc || !largeSrc) return item;

  const [url_small, url_large] = await Promise.all([
    downloadAndUploadToR2(smallSrc, `posts/${bookmarkId}/${prefix}_${index}_small.jpg`),
    downloadAndUploadToR2(largeSrc, `posts/${bookmarkId}/${prefix}_${index}_large.jpg`),
  ]);

  return {
    ...item,
    ...(url_small ? {url_small} : {}),
    ...(url_large ? {url_large} : {}),
  };
}

async function uploadThumbnailToR2(thumbnailUrl: string, bookmarkId: string): Promise<string> {
  try {
    const res = await fetch(thumbnailUrl);
    if (!res.ok) return thumbnailUrl;

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const key = `posts/${bookmarkId}/thumbnail.${ext}`;

    await uploadToR2({key, body: Buffer.from(buffer), contentType});

    return buildR2PublicUrl(key);
  } catch {
    return thumbnailUrl;
  }
}

function buildPostMetadata(
  post: VxTwitterPost,
  processedMedia: PostBookmarkMediaItem[],
  processedQrtMedia: PostBookmarkMediaItem[],
): PostBookmarkMetadata {
  const qrt = post.qrt
    ? {
        tweetId: post.qrt.tweetID,
        text: post.qrt.text,
        user_name: post.qrt.user_name,
        user_screen_name: post.qrt.user_screen_name,
        user_profile_image_url: post.qrt.user_profile_image_url,
        hasMedia: post.qrt.hasMedia,
        media_extended: processedQrtMedia,
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
    media_extended: processedMedia,
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

  const [processedMedia, processedQrtMedia] = await Promise.all([
    Promise.all(
      (post.media_extended ?? []).map((item, i) =>
        processPostMediaItem(item, bookmarkId, i, "media"),
      ),
    ),
    post.qrt?.media_extended?.length
      ? Promise.all(
          post.qrt.media_extended.map((item, i) =>
            processPostMediaItem(item, bookmarkId, i, "qrt_media"),
          ),
        )
      : Promise.resolve([] as PostBookmarkMediaItem[]),
  ]);

  const metadata = buildPostMetadata(post, processedMedia, processedQrtMedia);

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
