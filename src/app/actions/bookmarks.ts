"use server";

import {Client} from "@upstash/qstash";
import {randomUUID} from "crypto";
import {db} from "@/db";
import {bookmarks, bookmarkTags, bookmarkCollections, tags} from "@/db/schema";
import {and, eq, inArray, asc, desc, exists, isNull} from "drizzle-orm";
import type {Bookmark} from "@/components/bookmark/types";
import {requireAuthenticatedUserId} from "@/lib/auth-session";
import {fetchUrlMetadata, type UrlMetadataResult} from "@/lib/bookmarks/metadata";
import {prepareMediaBookmarkCreation} from "@/lib/bookmarks/media";
import {attachTagsToBookmark, syncBookmarkTags} from "@/lib/bookmarks/tags";
import {normalizeInputUrl} from "@/lib/web-fetch";

export type {UrlMetadataResult} from "@/lib/bookmarks/metadata";

export type AddWebsiteBookmarkResult = {
  ok: true;
  url: string;
  id: string;
};

export type AddMediaBookmarkResult = {
  ok: true;
  url: string;
  media?: string[];
  ids?: string[];
};

export type UpdateBookmarkData = {
  title?: string;
  description?: string;
  preview_image?: string;
  notes?: string;
  tags?: string[];
};

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_URL,
});

export async function addWebsiteBookmark(input: {
  url: string;
  tags?: string[];
  collectionId?: string;
  kind: "website";
}): Promise<AddWebsiteBookmarkResult> {
  const userId = await requireAuthenticatedUserId();

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(input.url);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Invalid url");
  }

  let metadata: UrlMetadataResult;
  try {
    metadata = await fetchUrlMetadata(normalized, input.url);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to fetch metadata");
  }

  const bookmarkId = randomUUID();

  await db.insert(bookmarks).values({
    id: bookmarkId,
    url: normalized.toString(),
    title: metadata.title ?? null,
    userId,
    description: metadata.description ?? null,
    kind: input.kind ?? "website",
    previewImage: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bookmark-previews/${bookmarkId}/preview.png`,
  });

  if (input.tags && input.tags.length > 0) {
    try {
      await attachTagsToBookmark(bookmarkId, userId, input.tags);
    } catch (error) {
      console.error("Failed to attach tags to bookmark:", error);
    }
  }

  if (input.collectionId) {
    try {
      await db.insert(bookmarkCollections).values({
        bookmarkId,
        collectionId: input.collectionId,
      });
    } catch (error) {
      console.error("Failed to attach bookmark to collection:", error);
    }
  }

  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/enrich-bookmark`,
    body: {url: normalized.toString(), id: bookmarkId},
    idempotencyKey: `bookmark-${bookmarkId}`,
    headers: {"x-job-type": "enrich-bookmark", "x-version": "v1"},
    timeout: 30,
  });

  return {ok: true, url: normalized.toString(), id: bookmarkId};
}

export async function addMediaBookmark(input: {
  url: string;
  tags?: string[];
  collectionId?: string;
  kind: "media";
  selectedMediaUrls?: string[];
}): Promise<AddMediaBookmarkResult> {
  const userId = await requireAuthenticatedUserId();

  if (input.kind !== "media") {
    throw new Error("Invalid kind");
  }

  const prepared = await prepareMediaBookmarkCreation({
    url: input.url,
    selectedMediaUrls: input.selectedMediaUrls,
    userId,
  });

  if (prepared.requiresSelection) {
    return {ok: true, url: input.url, media: prepared.mediaUrls};
  }

  await db.insert(bookmarks).values(prepared.bookmarksToInsert);

  if (input.collectionId) {
    await db
      .insert(bookmarkCollections)
      .values(
        prepared.bookmarkIds.map((bookmarkId) => ({
          bookmarkId,
          collectionId: input.collectionId!,
        })),
      )
      .onConflictDoNothing();
  }

  if (input.tags && input.tags.length > 0) {
    await Promise.all(
      prepared.bookmarkIds.map((bookmarkId) =>
        attachTagsToBookmark(bookmarkId, userId, input.tags!),
      ),
    );
  }

  return {
    ok: true,
    url: input.url,
    media: prepared.mediaUrls,
    ids: prepared.bookmarkIds,
  };
}

export async function updateBookmark(
  bookmarkId: string,
  updates: UpdateBookmarkData,
): Promise<{ok: true}> {
  const userId = await requireAuthenticatedUserId();
  const hasTagUpdate = updates.tags !== undefined;

  const setFields: Record<string, string | null> = {};
  if (updates.title !== undefined) setFields.title = updates.title;
  if (updates.description !== undefined) setFields.description = updates.description;
  if (updates.preview_image !== undefined) setFields.previewImage = updates.preview_image;
  if (updates.notes !== undefined) setFields.notes = updates.notes;

  if (Object.keys(setFields).length === 0 && !hasTagUpdate) return {ok: true};

  if (Object.keys(setFields).length > 0) {
    await db
      .update(bookmarks)
      .set({...setFields, updatedAt: new Date().toISOString()})
      .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));
  }

  if (hasTagUpdate) {
    await syncBookmarkTags(bookmarkId, userId, updates.tags ?? []);
  }

  return {ok: true};
}

export async function deleteBookmarks(bookmarkIds: string | string[]): Promise<{ok: true}> {
  const userId = await requireAuthenticatedUserId();
  const ids = Array.isArray(bookmarkIds) ? bookmarkIds : [bookmarkIds];

  await db
    .update(bookmarks)
    .set({deletedAt: new Date().toISOString()})
    .where(and(eq(bookmarks.userId, userId), inArray(bookmarks.id, ids)));

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

export async function resetBookmark(bookmarkId: string): Promise<{ok: true}> {
  const userId = await requireAuthenticatedUserId();

  const [bookmark] = await db
    .select({id: bookmarks.id, url: bookmarks.url})
    .from(bookmarks)
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));

  if (!bookmark) throw new Error("Bookmark not found");

  const normalized = normalizeInputUrl(bookmark.url);
  const metadata = await fetchUrlMetadata(normalized, bookmark.url);

  await db
    .update(bookmarks)
    .set({
      title: metadata.title ?? null,
      description: metadata.description ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)));

  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/enrich-bookmark`,
    body: {url: normalized.toString(), id: bookmark.id},
    headers: {"x-job-type": "enrich-bookmark", "x-version": "v1"},
    timeout: 30,
  });

  return {ok: true};
}

export async function fetchBookmarksPageAction(params: {
  offset: number;
  limit: number;
  sort: "recent" | "oldest" | "az";
  tagFilter: string | null;
  collectionFilter: string | null;
  typeFilter: "website" | "media";
}) {
  const userId = await requireAuthenticatedUserId();
  const {offset, limit, sort, tagFilter, collectionFilter, typeFilter} = params;

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
          .where(and(eq(bookmarkTags.bookmarkId, bookmarks.id), eq(tags.name, tagFilter))),
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
    preview_image: row.previewImage || "",
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
