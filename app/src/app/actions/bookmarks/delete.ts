"use server";

import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {and, eq, inArray} from "drizzle-orm";

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
