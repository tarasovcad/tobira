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

export type FreebirdXArticleMedia = {
  id: string;
  media_id: string;
  media_info: {
    __typename: "ApiImage" | string;
    original_img_height: number;
    original_img_url: string;
    original_img_width: number;
  };
  media_key: string;
};

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

export type FreebirdXPost = {
  allSameType: boolean;
  article: FreebirdXArticle | null;
  card?: FreebirdXPostCard | null;
  combinedMediaUrl: string | null;
  communityNote: unknown | null;
  conversationID: string;
  date: string;
  date_epoch: number;
  display_text_range?: [number, number];
  entities?: FreebirdXPostEntities;
  fetched_on: number;
  hasMedia: boolean;
  hashtags: string[];
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
  translation: string | null;
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

  const apiUrl = `https://freebird-api.com/status/${tweetId}/format/simple`;
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
