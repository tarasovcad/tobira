"use server";
import type {
  Bookmark,
  MediaBookmark,
  PostBookmark,
  WebsiteBookmark,
} from "@/components/bookmark/types";
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
    eq(bookmarks.kind, typeFilter as Bookmark["kind"]),
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
        return [asc(bookmarks.createdAt), asc(bookmarks.id)];
      case "az":
        return [asc(bookmarks.title), asc(bookmarks.id)];
      default:
        return [desc(bookmarks.createdAt), desc(bookmarks.id)];
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

  const data: Bookmark[] = rows.map((row) => {
    const base = {
      id: row.id,
      title: row.title || "",
      description: row.description || "",
      url: row.url,
      user_id: row.userId,
      created_at: row.createdAt,
      updated_at: row.updatedAt || row.createdAt,
      archived_at: row.archivedAt || "",
      deleted_at: row.deletedAt || "",
      notes: row.notes || "",
      tags: row.bookmarkTags
        .map((bt) => bt.tag.name)
        .sort((a, b) => a.localeCompare(b, undefined, {sensitivity: "base"})),
      collections: row.bookmarkCollections.map((bc) => ({
        id: bc.collection.id,
        name: bc.collection.name,
      })),
    };

    if (row.kind === "website") {
      return {
        ...base,
        kind: "website",
        images: (row.images ?? undefined) as WebsiteBookmark["images"],
        metadata: (row.metadata ?? undefined) as WebsiteBookmark["metadata"],
      };
    }

    if (row.kind === "media") {
      return {
        ...base,
        kind: "media",
        images: (row.images ?? undefined) as MediaBookmark["images"],
        metadata: (row.metadata ?? undefined) as MediaBookmark["metadata"],
      };
    }

    return {
      ...base,
      kind: "post",
      images: (row.images ?? undefined) as PostBookmark["images"],
      metadata: (row.metadata ?? undefined) as PostBookmark["metadata"],
    };
  });

  return {data, count: null};
}
