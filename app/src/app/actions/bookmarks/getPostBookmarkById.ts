"use server";

import {and, eq, isNull} from "drizzle-orm";

import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import type {PostBookmark} from "@/components/bookmark/types";
import {requireAuthenticatedUserId} from "@/lib/auth/session";

export async function getPostBookmarkById(bookmarkId: string): Promise<PostBookmark | null> {
  const userId = await requireAuthenticatedUserId();

  const row = await db.query.bookmarks.findFirst({
    where: and(
      eq(bookmarks.id, bookmarkId),
      eq(bookmarks.userId, userId),
      eq(bookmarks.kind, "post"),
      isNull(bookmarks.archivedAt),
      isNull(bookmarks.deletedAt),
    ),
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
  });

  if (!row) {
    return null;
  }

  return {
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
    kind: "post",
    images: (row.images ?? undefined) as PostBookmark["images"],
    metadata: (row.metadata ?? undefined) as PostBookmark["metadata"],
  };
}
