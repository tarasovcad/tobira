"use server";
import type {Bookmark} from "@/components/bookmark/types";
import {bookmarks, bookmarkTags, bookmarkCollections, tags} from "@/db/schema";
import {and, eq, asc, desc, exists, isNull} from "drizzle-orm";
import {db} from "@/db";

export default async function fetchBookmarksPageAction(params: {
  userId: string;
  offset: number;
  limit: number;
  sort: "recent" | "oldest" | "az";
  tagFilter: string | null;
  collectionFilter: string | null;
  typeFilter: "website" | "media" | "post";
}) {
  const {userId, offset, limit, sort, tagFilter, collectionFilter, typeFilter} = params;

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
          .where(and(eq(bookmarkTags.bookmarkId, bookmarks.id), eq(tags.id, tagFilter))),
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
      default:
        return [desc(bookmarks.createdAt)];
    }
  })();

  const rows = await db.query.bookmarks.findMany({
    where: and(...baseFilters),
    with: {
      bookmarkTags: {with: {tag: true}},
      bookmarkCollections: {with: {collection: true}},
    },
    limit,
    offset,
    orderBy,
  });

  const data: Bookmark[] = rows.map((row) => ({
    id: row.id,
    kind: (row.kind as "website" | "media") || "website",
    title: row.title || "",
    description: row.description || "",
    url: row.url,
    user_id: row.userId,
    images: (row.images ?? undefined) as Bookmark["images"],
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

  return {data, count: null};
}
