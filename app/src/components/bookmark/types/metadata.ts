export type BookmarkMediaItem = {
  type: "photo" | "video" | "gif";
  url: string;
  thumbnail_url?: string | null;
  source_url?: string;
  source_thumbnail_url?: string | null;
  media_key?: string;
  key?: string;
  key_thumbnail?: string;
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
  media_extended: BookmarkMediaItem[];
  qrt: {
    tweetId: string;
    text: string;
    date: string;
    date_epoch: number;
    user_name: string;
    user_screen_name: string;
    user_profile_image_url: string;
    hasMedia: boolean;
    media_extended: BookmarkMediaItem[];
  } | null;
};

export type BookmarkMetadata = WebsiteOrMediaMetadata | PostBookmarkMetadata;
