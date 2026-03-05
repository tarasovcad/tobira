import type {BookmarkTagJoinRow} from "@/lib/bookmark-tags";
import type {Bookmark} from "@/components/bookmark/Bookmark";

export type SearchParams = {
  tag?: string;
  tab?: string;
  collection?: string;
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
