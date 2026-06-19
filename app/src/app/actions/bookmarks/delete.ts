"use server";

import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {and, eq, inArray, isNotNull} from "drizzle-orm";

import {requireAuthenticatedUserId} from "@/lib/auth/session";

export async function deleteBookmarks(bookmarkIds: string | string[]): Promise<{ok: true}> {
  const userId = await requireAuthenticatedUserId();
  const ids = Array.isArray(bookmarkIds) ? bookmarkIds : [bookmarkIds];

  await db
    .update(bookmarks)
    .set({deletedAt: new Date().toISOString()})
    .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.id, ids)));

  return {ok: true};
}

export async function permanentlyDeleteBookmarks(
  bookmarkIds: string | string[],
): Promise<{ok: true}> {
  const userId = await requireAuthenticatedUserId();
  const ids = Array.isArray(bookmarkIds) ? bookmarkIds : [bookmarkIds];

  await db
    .delete(bookmarks)
    .where(
      and(eq(bookmarks.userId, userId), inArray(bookmarks.id, ids), isNotNull(bookmarks.deletedAt)),
    );

  return {ok: true};
}

export async function emptyBin(): Promise<{ok: true; deletedCount: number}> {
  const userId = await requireAuthenticatedUserId();

  const deletedBookmarks = await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.userId, userId), isNotNull(bookmarks.deletedAt)))
    .returning({id: bookmarks.id});

  return {ok: true, deletedCount: deletedBookmarks.length};
}
