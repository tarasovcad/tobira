export type FreebirdXPostMediaItem = {
  altText: string | null;
  aspect_ratio?: [number, number];
  duration_millis: number | null;
  id_str: string;
  size: {height: number; width: number} | null;
  thumbnail_url: string | null;
  type: "photo" | "video" | "gif";
  url: string;
};

export type FreebirdXPostCard = {
  url: string;
  name: string;
  image: {
    url: string;
    width: number;
    height: number;
    altText: string | null;
  };
  title: string;
  domain: string;
  description: string;
};

export type FreebirdXPostUrlEntity = {
  display_url: string;
  expanded_url: string;
  indices: [number, number];
  url: string;
};

export type FreebirdXPostUserMentionEntity = {
  id_str?: string;
  indices?: [number, number];
  name?: string;
  screen_name?: string;
};

export type FreebirdXPostEntities = {
  urls: FreebirdXPostUrlEntity[];
  user_mentions: FreebirdXPostUserMentionEntity[];
};

export type FreebirdXArticleImageInfo = {
  __typename?: "ApiImage" | string;
  original_img_height: number;
  original_img_url: string;
  original_img_width: number;
};

export type FreebirdXArticleVideoInfo = {
  __typename: "ApiVideo";
  duration_millis?: number;
  preview_image: FreebirdXArticleImageInfo;
  variants: {
    bit_rate?: number;
    content_type: string;
    url: string;
  }[];
};

export type FreebirdXArticleMediaInfo = FreebirdXArticleImageInfo | FreebirdXArticleVideoInfo;

export type FreebirdXArticleMedia = {
  id: string;
  media_id: string;
  media_info: FreebirdXArticleMediaInfo;
  media_key: string;
};

export function isFreebirdXArticleVideoMedia(
  item: FreebirdXArticleMedia,
): item is FreebirdXArticleMedia & {media_info: FreebirdXArticleVideoInfo} {
  return item.media_info.__typename === "ApiVideo";
}

export function getFreebirdXArticleImageInfo(
  mediaInfo: FreebirdXArticleMediaInfo,
): FreebirdXArticleImageInfo {
  return isFreebirdXArticleVideoInfo(mediaInfo) ? mediaInfo.preview_image : mediaInfo;
}

export function isFreebirdXArticleVideoInfo(
  mediaInfo: FreebirdXArticleMediaInfo,
): mediaInfo is FreebirdXArticleVideoInfo {
  return mediaInfo.__typename === "ApiVideo";
}

export function getFreebirdXArticleMediaSourceUrl(item: FreebirdXArticleMedia): string | null {
  if (isFreebirdXArticleVideoMedia(item)) {
    return pickFreebirdXArticleVideoUrl(item.media_info);
  }

  return getFreebirdXArticleImageInfo(item.media_info).original_img_url ?? null;
}

function pickFreebirdXArticleVideoUrl(mediaInfo: FreebirdXArticleVideoInfo): string | null {
  const mp4Variants = mediaInfo.variants
    .filter(
      (variant): variant is {bit_rate: number; content_type: string; url: string} =>
        variant.content_type === "video/mp4" && typeof variant.bit_rate === "number",
    )
    .sort((left, right) => right.bit_rate - left.bit_rate);

  return (
    mp4Variants[0]?.url ??
    mediaInfo.variants.find((variant) => variant.content_type === "video/mp4")?.url ??
    null
  );
}

export type FreebirdXArticle = {
  content_state?: unknown;
  cover_media?: FreebirdXArticleMedia | null;
  id: string;
  lifecycle_state?: unknown;
  media_entities?: FreebirdXArticleMedia[];
  metadata?: unknown;
  preview_text?: string;
  rest_id: string;
  title?: string;
};

export type FreebirdXPostCommunity = {
  id: string | null;
  isCommunityPost: boolean;
};

export type FreebirdXPostHashtag = {
  indices: [number, number];
  text: string;
};

export type FreebirdXPostSymbolEntity = {
  indices: [number, number];
  text: string;
};

export type FreebirdXPostTranslationEntities = {
  hashtags?: FreebirdXPostHashtag[];
  symbols?: FreebirdXPostSymbolEntity[];
  urls?: FreebirdXPostUrlEntity[];
  user_mentions?: FreebirdXPostUserMentionEntity[];
};

export type FreebirdXPostTranslation = {
  provider?: string;
  source_language: string;
  destination_language: string;
  preview_translation?: string;
  text: string;
  entities?: FreebirdXPostTranslationEntities;
};

export type FreebirdXPost = {
  allSameType: boolean;
  article: FreebirdXArticle | null;
  card?: FreebirdXPostCard | null;
  combinedMediaUrl: string | null;
  community?: FreebirdXPostCommunity | null;
  communityNote: unknown | null;
  conversationID: string;
  date: string;
  date_epoch: number;
  display_text_range?: [number, number];
  entities?: FreebirdXPostEntities;
  fetched_on: number;
  hasMedia: boolean;
  hashtags: FreebirdXPostHashtag[];
  lang: string;
  mediaURLs: string[];
  media_extended: FreebirdXPostMediaItem[];
  pollData: unknown | null;
  possibly_sensitive: boolean | null;
  qrt: FreebirdXPostResponse | null;
  qrtURL: string | null;
  replyingTo: string | null;
  replyingToID: string | null;
  retweet: unknown | null;
  retweetURL: string | null;
  text: string;
  translation: FreebirdXPostTranslation | null;
  tweetID: string;
  tweetURL: string;
};

export type FreebirdXPostMetrics = {
  likes: number;
  replies: number;
  retweets: number;
};

export type FreebirdXPostAffiliatesHighlightedLabel = {
  badge_url: string;
  description: string;
  url: string;
  userLabelDisplayType: string;
  userLabelType: string;
};

export type FreebirdXPostUser = {
  user_name: string;
  user_profile_image_url: string;
  user_screen_name: string;
  is_blue_verified?: boolean;
  verification?: {
    verified_type: string | null;
  };
  affiliates_highlighted_label?: FreebirdXPostAffiliatesHighlightedLabel | null;
};

export type FreebirdXPostResponse = {
  post: FreebirdXPost;
  metrics: FreebirdXPostMetrics;
  user: FreebirdXPostUser;
};

export type FreebirdXPostData = {
  tweet: FreebirdXPostResponse;
  reply_chain?: FreebirdXPostResponse[];
  reply_chain_complete?: boolean;
};

function extractTweetId(url: string): string | null {
  try {
    const u = new URL(url);
    const pathParts = u.pathname.split("/").filter(Boolean);
    const statusIndex = pathParts.indexOf("status");
    if (statusIndex !== -1 && pathParts.length > statusIndex + 1) {
      return pathParts[statusIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchXPostData(url: string): Promise<FreebirdXPostData> {
  const tweetId = extractTweetId(url);
  if (!tweetId) {
    throw new Error("Invalid X/Twitter URL - could not extract tweet ID");
  }

  const apiUrl = `https://freebird-api.com/status/${tweetId}/lang/en/format/simple`;
  const res = await fetch(apiUrl, {cache: "no-store"});

  if (!res.ok) {
    throw new Error(`Freebird API error: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  let data: FreebirdXPostData;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Freebird returned a non-JSON response");
  }

  return data;
}
