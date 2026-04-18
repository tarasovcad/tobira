"use server";

import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {desc, asc} from "drizzle-orm";
import {getBookmarkFilters} from "./filters";
import type {Bookmark} from "@/components/bookmark/types";
import {PAGE_SIZE} from "@/app/home/_constants";
import type {TypeFilter, SortMode} from "@/app/home/_types";
import {DatabaseError} from "@/lib/shared/errors";
import {logger} from "@/lib/shared/logger";

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
  typeFilter?: TypeFilter;
  sort?: SortMode;
}) {
  const startTime = performance.now();

  const filters = getBookmarkFilters({userId, tagFilter, collectionFilter, typeFilter});

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
    where: filters,
    with: {
      bookmarkTags: {
        limit: 12,
        with: {
          tag: true,
        },
      },
      bookmarkCollections: {
        limit: 12,
        with: {
          collection: true,
        },
      },
    },
    limit: PAGE_SIZE,
    offset: 0,
    orderBy,
  });

  let bookmarkRows: Awaited<typeof bookmarksPromise>;

  try {
    bookmarkRows = await bookmarksPromise;
  } catch (err) {
    logger.error("getInitialBookmarks: database query failed", {
      err: err instanceof Error ? {message: err.message, stack: err.stack} : String(err),
      userId,
      tagFilter,
      collectionFilter,
      typeFilter,
      sort,
    });
    // Re-throw a safe typed error
    throw new DatabaseError("Failed to load your bookmarks. Please try again.");
  }

  const initialBookmarks: Bookmark[] = bookmarkRows.map((row) => ({
    id: row.id,
    kind: (row.kind as TypeFilter) || "website",
    title: row.title || "",
    description: row.description || "",
    url: row.url,
    user_id: row.userId,
    preview_image: row.previewImage || "",
    images: row.images ?? undefined,
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

  const endTime = performance.now();
  // logger.info("getInitialBookmarks: completed", {
  //   durationMs: parseFloat((endTime - startTime).toFixed(2)),
  //   userId,
  //   bookmarkCount: initialBookmarks.length,
  // });

  return {
    initialBookmarks,
    bookmarksError: null,
  };
}
