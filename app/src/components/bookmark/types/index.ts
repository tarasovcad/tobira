import type {
  PostBookmarkMetadata,
  WebsiteOrMediaMetadata,
} from "@/components/bookmark/types/metadata";
import type {MediaImages, PostImages, WebsiteImages} from "@/db/schema";

type BookmarkBase = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  url: string;
  user_id: string;
  updated_at: string;
  archived_at: string;
  deleted_at: string;
  notes: string;
  tags?: string[];
  collections?: {id: string; name: string}[];
};

export type WebsiteBookmark = BookmarkBase & {
  kind: "website";
  images?: WebsiteImages;
  metadata?: WebsiteOrMediaMetadata;
};

export type MediaBookmark = BookmarkBase & {
  kind: "media";
  images?: MediaImages;
  metadata?: WebsiteOrMediaMetadata;
};

export type PostBookmark = BookmarkBase & {
  kind: "post";
  images?: PostImages;
  metadata?: PostBookmarkMetadata;
};

export type Bookmark = WebsiteBookmark | MediaBookmark | PostBookmark;
