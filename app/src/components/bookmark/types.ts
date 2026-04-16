import type {BookmarkMetadata} from "@/app/home/_types/bookmark-metadata";

export type Bookmark = {
  id: string;
  kind: "website" | "media" | "post";
  title: string;
  description: string;
  created_at: string;
  url: string;
  user_id: string;
  preview_image: string;
  updated_at: string;
  archived_at: string;
  deleted_at: string;
  notes: string;
  tags?: string[];
  collections?: {id: string; name: string}[];
  metadata?: BookmarkMetadata;
};
