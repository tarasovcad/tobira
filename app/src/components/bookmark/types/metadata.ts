import type {FreebirdXPostData} from "@/lib/fetch/post";

export type BookmarkMediaItem = {
  type: "photo" | "video" | "gif";
  url: string;
  thumbnail_url?: string | null;
  source_url?: string;
  source_thumbnail_url?: string | null;
  media_key?: string;
  key?: string;
  key_thumbnail?: string;
  duration_millis?: number | null;
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
  websiteProtected?: boolean;
  textMetadataStatus?: "processing" | "completed" | "failed";
};

export type PostBookmarkMetadata = FreebirdXPostData;

export type BookmarkMetadata = WebsiteOrMediaMetadata | PostBookmarkMetadata;
