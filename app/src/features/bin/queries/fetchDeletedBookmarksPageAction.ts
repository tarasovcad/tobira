"use server";

import type {
  Bookmark,
  MediaBookmark,
  PostBookmark,
  WebsiteBookmark,
} from "@/components/bookmark/types";
import {bookmarks} from "@/db/schema";
import {db} from "@/db";
import {getCurrentUserId} from "@/lib/auth/session";
import {UnauthorizedError} from "@/lib/shared/errors";
import {and, asc, desc, eq, isNotNull} from "drizzle-orm";
import type {SortMode, TypeFilter} from "@/features/home/types";

export default async function fetchDeletedBookmarksPageAction(params: {
  userId?: string;
  offset: number;
  limit: number;
  sort: SortMode;
  typeFilter: TypeFilter;
}) {
  const currentUserId = await getCurrentUserId();
  const {offset, limit, sort, typeFilter, userId} = params;

  if (!currentUserId) {
    return {data: [] as Bookmark[]};
  }

  if (userId && userId !== currentUserId) {
    throw new UnauthorizedError();
  }

  const orderBy = (() => {
    switch (sort) {
      case "oldest":
        return [asc(bookmarks.deletedAt), asc(bookmarks.id)];
      case "az":
        return [asc(bookmarks.title), asc(bookmarks.id)];
      default:
        return [desc(bookmarks.deletedAt), desc(bookmarks.id)];
    }
  })();

  const rows = await db.query.bookmarks.findMany({
    where: and(
      eq(bookmarks.userId, currentUserId),
      isNotNull(bookmarks.deletedAt),
      eq(bookmarks.kind, typeFilter),
    ),
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

  return {data};
}
