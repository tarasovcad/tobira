export type MediaMediaItem = {
  type: "photo" | "video" | "gif";
  url: string;
  url_small?: string;
  url_large?: string;
  thumbnail_url?: string | null;
  duration_millis?: number;
  size?: {width: number; height: number} | null;
  altText?: string | null;
};

export type WebsiteOrMediaMetadata = {
  date?: string;
  text?: string;
  width?: number;
  height?: number;
  hasMedia?: boolean;
  mediaURLs?: string[];
  user_name?: string;
  thumbnail_url?: string;
  user_screen_name?: string;
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
  media_extended: MediaMediaItem[];
  qrt: {
    tweetId: string;
    text: string;
    user_name: string;
    user_screen_name: string;
    user_profile_image_url: string;
    hasMedia: boolean;
    media_extended: MediaMediaItem[];
  } | null;
};

export type BookmarkMetadata = WebsiteOrMediaMetadata | PostBookmarkMetadata;
