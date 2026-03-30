import {db} from "@/db";
import {bookmarks, tags, bookmarkTags, bookmarkCollections} from "@/db/schema";
import {and, eq, isNull, desc, asc, count, exists} from "drizzle-orm";
import type {Bookmark} from "@/components/bookmark/types";
import type {TagWithCount} from "../_types";
import {PAGE_SIZE} from "../_constants";

export async function getInitialBookmarks({
  userId,
  tagFilter,
  collectionFilter,
  typeFilter = "website",
  sort = "recent",
}: {
  userId: string;
  tagFilter: string | null;
  collectionFilter: string | null;
  typeFilter?: "website" | "media";
  sort?: "recent" | "oldest" | "az";
}) {
  const startTime = performance.now();

  const baseFilters = [
    eq(bookmarks.userId, userId),
    isNull(bookmarks.archivedAt),
    isNull(bookmarks.deletedAt),
    eq(bookmarks.kind, typeFilter as "website" | "media"),
  ];

  if (tagFilter) {
    baseFilters.push(
      exists(
        db
          .select()
          .from(bookmarkTags)
          .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
          .where(and(eq(bookmarkTags.bookmarkId, bookmarks.id), eq(tags.name, tagFilter))),
      ),
    );
  }

  if (collectionFilter) {
    baseFilters.push(
      exists(
        db
          .select()
          .from(bookmarkCollections)
          .where(
            and(
              eq(bookmarkCollections.bookmarkId, bookmarks.id),
              eq(bookmarkCollections.collectionId, collectionFilter),
            ),
          ),
      ),
    );
  }

  const orderBy = (() => {
    switch (sort) {
      case "oldest":
        return [asc(bookmarks.createdAt)];
      case "az":
        return [asc(bookmarks.title), asc(bookmarks.id)];
      case "recent":
      default:
        return [desc(bookmarks.createdAt)];
    }
  })();

  const bookmarksPromise = db.query.bookmarks.findMany({
    where: and(...baseFilters),
    with: {
      bookmarkTags: {
        with: {
          tag: true,
        },
      },
      bookmarkCollections: {
        with: {
          collection: true,
        },
      },
    },
    limit: PAGE_SIZE,
    offset: 0,
    orderBy,
  });

  const totalCountPromise = db.$count(bookmarks, and(...baseFilters));

  // For Drizzle, we calculate tags with counts using a custom query since the RPC is gone.
  // We use left join with bookmarks filtered in the ON clause to ensure tags with 0 bookmarks are included.
  const tagsWithCountsPromise = db
    .select({
      id: tags.id,
      name: tags.name,
      description: tags.description,
      is_pinned: tags.isPinned,
      created_at: tags.createdAt,
      updated_at: tags.updatedAt,
      count: count(bookmarks.id),
    })
    .from(tags)
    .leftJoin(bookmarkTags, eq(tags.id, bookmarkTags.tagId))
    .leftJoin(
      bookmarks,
      and(
        eq(bookmarkTags.bookmarkId, bookmarks.id),
        eq(bookmarks.userId, tags.userId),
        isNull(bookmarks.archivedAt),
        isNull(bookmarks.deletedAt),
      ),
    )
    .where(eq(tags.userId, userId))
    .groupBy(tags.id)
    .orderBy(desc(tags.isPinned), asc(tags.name));

  const [bookmarkRows, totalCount, tagsData] = await Promise.all([
    bookmarksPromise,
    totalCountPromise,
    tagsWithCountsPromise,
  ]);

  const initialBookmarks: Bookmark[] = bookmarkRows.map((row) => ({
    id: row.id,
    kind: (row.kind as "website" | "media") || "website",
    title: row.title || "",
    description: row.description || "",
    url: row.url,
    user_id: row.userId,
    preview_image: row.previewImage || "",
    created_at: row.createdAt,
    updated_at: row.updatedAt || row.createdAt,
    archived_at: row.archivedAt || "",
    deleted_at: row.deletedAt || "",
    notes: row.notes || "",
    metadata: row.metadata as Bookmark["metadata"],
    tags: row.bookmarkTags
      .map((bt) => bt.tag.name)
      .sort((a, b) => a.localeCompare(b, undefined, {sensitivity: "base"})),
    collections: row.bookmarkCollections.map((bc) => ({
      id: bc.collection.id,
      name: bc.collection.name,
    })),
  }));

  const tagsResult: TagWithCount[] = tagsData.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    is_pinned: !!t.is_pinned,
    created_at: t.created_at,
    updated_at: t.updated_at,
    count: Number(t.count),
  }));

  const endTime = performance.now();
  console.log(`[Performance] getInitialBookmarks: ${(endTime - startTime).toFixed(2)}ms`);

  return {
    initialBookmarks,
    totalCount,
    bookmarksError: null,
    tags: tagsResult,
    tagsError: null,
  };
}
