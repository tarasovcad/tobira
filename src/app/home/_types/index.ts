import type {BookmarkTagJoinRow} from "@/lib/bookmark-tags";
import type {Bookmark} from "@/components/bookmark/Bookmark";
import type {SortMode, TypeFilter} from "../_components/AllItemsToolbar";

export type BookmarkMetadata = {
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

export type SearchParams = {
  tag?: string;
  tab?: string;
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
};

export interface UseBookmarksQueryProps {
  userId: string | null;
  initialBookmarks: Bookmark[];
  totalCount: number;
  sort: SortMode;
  tagFilter: string | null;
  collectionFilter: string | null;
  typeFilter: TypeFilter;
}
