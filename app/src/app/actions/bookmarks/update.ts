"use server";

import {Client} from "@upstash/qstash";
import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {and, eq, inArray, sql} from "drizzle-orm";

import {requireAuthenticatedUserId} from "@/lib/auth/session";
import {fetchUrlMetadata} from "@/lib/bookmarks/metadata";
import {syncBookmarkCollection} from "@/lib/bookmarks/collections";
import {syncBookmarkTags} from "@/lib/bookmarks/tags";
import {normalizeInputUrl} from "@/lib/fetch/web/url";

export type UpdateBookmarkData = {
  title?: string;
  description?: string;
  selected_image?: "preview" | "og";
  notes?: string;
  tags?: string[];
  collectionId?: string | null;
};

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_URL,
});

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

export async function resetBookmark(bookmarkId: string): Promise<{
  ok: true;
  title: string;
  description: string;
  updatedAt: string;
}> {
  const userId = await requireAuthenticatedUserId();

  const [bookmark] = await db
    .select({id: bookmarks.id, url: bookmarks.url})
    .from(bookmarks)
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));

  if (!bookmark) throw new Error("Bookmark not found");

  const normalized = normalizeInputUrl(bookmark.url);
  const metadata = await fetchUrlMetadata(normalized, bookmark.url);

  const updatedAt = new Date().toISOString();

  await db
    .update(bookmarks)
    .set({
      title: metadata.title ?? null,
      description: metadata.description ?? null,
      updatedAt,
    })
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));

  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/enrich-bookmark`,
    body: {url: normalized.toString(), id: bookmark.id},
    headers: {"x-job-type": "enrich-bookmark", "x-version": "v1"},
    timeout: 30,
  });

  return {
    ok: true,
    title: metadata.title ?? "",
    description: metadata.description ?? "",
    updatedAt,
  };
}
