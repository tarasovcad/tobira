import type {Bookmark} from "@/components/bookmark/types";

export type TypeFilter = "website" | "media" | "post";
export type SortMode = "recent" | "oldest" | "az";
export type {BookmarkMetadata} from "@/components/bookmark/types/metadata";

export type SearchParams = {
  tag?: string;
  collection?: string;
  type?: TypeFilter;
  sort?: SortMode;
};

export type TagsWithCountsRow = {
  id: string;
  name: string;
  count: number | string | null;
  description: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type TagWithCount = {
  id: string;
  name: string;
  count: number;
  description: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type SidebarTag = Pick<TagWithCount, "id" | "name" | "count" | "is_pinned">;

export interface UseBookmarksQueryProps {
  userId: string | null;
  initialBookmarks: Bookmark[];
  initialActiveTag: TagWithCount | null;
  sort: SortMode;
  tagFilter: string | null;
  collectionFilter: string | null;
  typeFilter: TypeFilter;
  isServerDataMatching?: boolean;
}
