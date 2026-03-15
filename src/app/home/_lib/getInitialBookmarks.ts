import {tagNamesFromJoin} from "@/lib/bookmark-tags";
import type {Bookmark} from "@/components/bookmark/Bookmark";
import type {BookmarkRowWithJoins, TagsWithCountsRow} from "../_types";
import {PAGE_SIZE} from "../_constants";
import type {SupabaseClient} from "@supabase/supabase-js";

export type TagWithCount = {id: string; name: string; count: number};

export async function getInitialBookmarks({
  userId,
  tagFilter,
  collectionFilter,
  typeFilter = "website",
  sort = "recent",
  supabase,
}: {
  userId: string;
  tagFilter: string | null;
  collectionFilter: string | null;
  typeFilter?: "website" | "media";
  sort?: "recent" | "oldest" | "az";
  supabase: SupabaseClient;
}) {
  // When filtering by tag or collection we use an inner join so only matching bookmarks are returned.
  const tagSelect = tagFilter
    ? "bookmark_tags!inner(tags!inner(name))"
    : "bookmark_tags(tags(name))";
  const collectionSelect = collectionFilter
    ? "bookmark_collections!inner(collections(id, name))"
    : "bookmark_collections(collections(id, name))";
  const bookmarksSelect = `*, ${tagSelect}, ${collectionSelect}`;

  let bookmarksQuery = supabase
    .from("bookmarks")
    .select(bookmarksSelect as "*", {count: "exact"})
    .eq("user_id", userId)
    .is("archived_at", null)
    .is("deleted_at", null)
    .eq("kind", typeFilter);

  if (tagFilter) {
    bookmarksQuery = bookmarksQuery.eq("bookmark_tags.tags.name", tagFilter);
  }

  if (collectionFilter) {
    bookmarksQuery = bookmarksQuery.eq("bookmark_collections.collection_id", collectionFilter);
  }

  switch (sort) {
    case "oldest":
      bookmarksQuery = bookmarksQuery.order("created_at", {ascending: true});
      break;
    case "az":
      bookmarksQuery = bookmarksQuery
        .order("title", {ascending: true})
        .order("id", {ascending: true});
      break;
    case "recent":
    default:
      bookmarksQuery = bookmarksQuery.order("created_at", {ascending: false});
      break;
  }

  const bookmarksPromise = bookmarksQuery.range(0, PAGE_SIZE - 1);

  const tagsPromise = supabase.rpc("get_tags_with_counts", {p_user_id: userId});

  const [
    {data: bookmarkRows, count: totalCount, error: bookmarksError},
    {data: tagsData, error: tagsError},
  ] = await Promise.all([bookmarksPromise, tagsPromise]);

  const rows = (bookmarkRows ?? []) as BookmarkRowWithJoins[];

  const initialBookmarks: Bookmark[] = rows.map(
    ({bookmark_tags, bookmark_collections, ...row}) => ({
      ...(row as Bookmark),
      tags: tagNamesFromJoin(bookmark_tags),
      collections: bookmark_collections?.map((bc) => bc.collections) ?? [],
    }),
  );

  const tags: TagWithCount[] = ((tagsData ?? []) as TagsWithCountsRow[]).map((t) => ({
    id: t.id,
    name: t.name,
    count: typeof t.count === "string" ? Number(t.count) : (t.count ?? 0),
  }));

  return {
    initialBookmarks,
    totalCount,
    bookmarksError,
    tags,
    tagsError,
  };
}
