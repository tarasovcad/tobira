"use server";

import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {and, eq, inArray, isNotNull, sql} from "drizzle-orm";

import {requireAuthenticatedUserId} from "@/lib/auth/session";
import {syncBookmarkCollection} from "@/lib/bookmarks/collections";
import {syncBookmarkTags} from "@/lib/bookmarks/tags";

export type UpdateBookmarkData = {
  title?: string;
  description?: string;
  selected_image?: "preview" | "og";
  notes?: string;
  tags?: string[];
  collectionId?: string | null;
};

export async function updateBookmark(
  bookmarkId: string,
  updates: UpdateBookmarkData,
): Promise<{ok: true}> {
  const userId = await requireAuthenticatedUserId();
  const hasTagUpdate = updates.tags !== undefined;
  const hasCollectionUpdate = updates.collectionId !== undefined;
  const hasSelectedImageUpdate = updates.selected_image !== undefined;

  const setValues: Record<string, unknown> = {};
  if (updates.title !== undefined) setValues.title = updates.title;
  if (updates.description !== undefined) setValues.description = updates.description;
  if (updates.notes !== undefined) setValues.notes = updates.notes;
  if (hasSelectedImageUpdate) {
    setValues.images = sql`jsonb_set(COALESCE(images, '{}'::jsonb), '{selected}', to_jsonb(${updates.selected_image}::text))`;
  }

  if (Object.keys(setValues).length === 0 && !hasTagUpdate && !hasCollectionUpdate) {
    return {ok: true};
  }

  if (Object.keys(setValues).length > 0 || hasTagUpdate || hasCollectionUpdate) {
    await db
      .update(bookmarks)
      .set({...setValues, updatedAt: new Date().toISOString()})
      .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));
  }

  if (hasTagUpdate) {
    await syncBookmarkTags(bookmarkId, userId, updates.tags ?? []);
  }

  if (hasCollectionUpdate) {
    await syncBookmarkCollection(bookmarkId, userId, updates.collectionId ?? null);
  }

  return {ok: true};
}

export async function archiveBookmarks(bookmarkIds: string | string[]): Promise<{ok: true}> {
  const userId = await requireAuthenticatedUserId();
  const ids = Array.isArray(bookmarkIds) ? bookmarkIds : [bookmarkIds];
  const now = new Date().toISOString();

  await db
    .update(bookmarks)
    .set({archivedAt: now, updatedAt: now})
    .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.id, ids)));

  return {ok: true};
}

export async function restoreBookmarks(bookmarkIds: string | string[]): Promise<{ok: true}> {
  const userId = await requireAuthenticatedUserId();
  const ids = Array.isArray(bookmarkIds) ? bookmarkIds : [bookmarkIds];
  const now = new Date().toISOString();

  await db
    .update(bookmarks)
    .set({deletedAt: null, updatedAt: now})
    .where(
      and(eq(bookmarks.userId, userId), inArray(bookmarks.id, ids), isNotNull(bookmarks.deletedAt)),
    );

  return {ok: true};
}
