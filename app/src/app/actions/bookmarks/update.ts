"use server";

import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {and, eq, inArray, isNotNull, sql} from "drizzle-orm";

import {requireAuthenticatedUserId} from "@/lib/auth/session";
import {fetchDirectUrlMetadata} from "@/lib/bookmarks/metadata";
import {syncBookmarkCollection} from "@/lib/bookmarks/collections";
import {syncBookmarkTags} from "@/lib/bookmarks/tags";
import {resolveWebsiteMetadataState} from "@/lib/bookmarks/website/metadata-outcome";
import {queueWebsiteBookmarkEnrichment} from "@/lib/bookmarks/website/queue";
import {normalizeInputUrl} from "@/lib/fetch/web/url";

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

export async function resetBookmark(bookmarkId: string): Promise<{
  ok: true;
  title: string;
  description: string;
  updatedAt: string;
}> {
  const userId = await requireAuthenticatedUserId();

  const [bookmark] = await db
    .select({id: bookmarks.id, url: bookmarks.url, kind: bookmarks.kind})
    .from(bookmarks)
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));

  if (!bookmark) throw new Error("Bookmark not found");
  if (bookmark.kind !== "website") {
    throw new Error("Only website bookmarks can reset website metadata");
  }

  const normalized = normalizeInputUrl(bookmark.url);
  const metadataState = resolveWebsiteMetadataState(await fetchDirectUrlMetadata(normalized));

  const updatedAt = new Date().toISOString();

  await db
    .update(bookmarks)
    .set({
      title: metadataState.title,
      description: metadataState.description,
      metadata: sql`jsonb_set(jsonb_set(COALESCE(metadata, '{}'::jsonb), '{websiteProtected}', to_jsonb(${metadataState.websiteProtected}::boolean), true), '{textMetadataStatus}', to_jsonb(${metadataState.textMetadataStatus}::text), true)`,
      updatedAt,
    })
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));

  if (metadataState.shouldQueueEnrichment) {
    await queueWebsiteBookmarkEnrichment(bookmark.id);
  }

  return {
    ok: true,
    title: metadataState.title ?? "",
    description: metadataState.description ?? "",
    updatedAt,
  };
}
