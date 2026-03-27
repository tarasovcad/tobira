import type {Bookmark} from "@/components/bookmark/types";
import type {BookmarkTagJoinRow} from "@/lib/bookmark-tags";
import type {SortMode, TypeFilter} from "../_components/AllItemsToolbar";
export type {BookmarkMetadata} from "./bookmark-metadata";

export type SearchParams = {
  tag?: string;
  collection?: string;
  type?: string;
  sort?: string;
};

export type BookmarkRowWithJoins = Bookmark & {
  bookmark_tags?: BookmarkTagJoinRow[] | null;
  bookmark_collections?: {collections: {id: string; name: string}}[] | null;
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

export interface UseBookmarksQueryProps {
  userId: string | null;
  initialBookmarks: Bookmark[];
  initialTags: TagWithCount[];
  totalCount: number;
  sort: SortMode;
  tagFilter: string | null;
  collectionFilter: string | null;
  typeFilter: TypeFilter;
  isServerDataMatching?: boolean;
}
