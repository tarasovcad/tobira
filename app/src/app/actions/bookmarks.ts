"use server";

import {Client} from "@upstash/qstash";
import {randomUUID} from "crypto";
import {db} from "@/db";
import {bookmarks, bookmarkTags, bookmarkCollections, tags} from "@/db/schema";
import {and, eq, inArray, asc, desc, exists, isNull, sql} from "drizzle-orm";
import type {Bookmark} from "@/components/bookmark/types";
import {requireAuthenticatedUserId} from "@/lib/auth/session";
import {fetchUrlMetadata, type UrlMetadataResult} from "@/lib/bookmarks/metadata";
import {prepareMediaBookmarkCreation} from "@/features/media/server/prepare";
import {preparePostBookmarkCreation} from "@/lib/bookmarks/post";
import {buildWebsiteImages} from "@/features/media/utils";
import {syncBookmarkCollection} from "@/lib/bookmarks/collections";
import {attachTagsToBookmark, syncBookmarkTags} from "@/lib/bookmarks/tags";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import type {MediaMediaItem} from "@/app/home/_types/bookmark-metadata";

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
  mediaItems?: MediaMediaItem[];
  ids?: string[];
};

export type AddPostBookmarkResult = {
  ok: true;
  url: string;
  id: string;
};

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
  const images = buildWebsiteImages(bookmarkId);

  await db.insert(bookmarks).values({
    id: bookmarkId,
    url: normalized.toString(),
    title: metadata.title ?? null,
    userId,
    description: metadata.description ?? null,
    kind: input.kind ?? "website",
    images,
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
    return {ok: true, url: input.url, media: prepared.mediaUrls, mediaItems: prepared.mediaItems};
  }

  await db.insert(bookmarks).values(prepared.bookmarkToInsert);

  if (input.collectionId) {
    await db
      .insert(bookmarkCollections)
      .values({
        bookmarkId: prepared.bookmarkId,
        collectionId: input.collectionId,
      })
      .onConflictDoNothing();
  }

  if (input.tags && input.tags.length > 0) {
    await attachTagsToBookmark(prepared.bookmarkId, userId, input.tags);
  }

  try {
    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-media-bookmark`,
      body: {id: prepared.bookmarkId},
      idempotencyKey: `media-bookmark-${prepared.bookmarkId}`,
      headers: {"x-job-type": "process-media-bookmark"},
      timeout: 120,
    });
  } catch (error) {
    console.error("Failed to queue media bookmark processing job:", error);
  }

  return {
    ok: true,
    url: input.url,
    media: prepared.mediaUrls,
    mediaItems: prepared.mediaItems,
    ids: [prepared.bookmarkId],
  };
}

export async function addPostBookmark(input: {
  url: string;
  tags?: string[];
  collectionId?: string;
  kind: "post";
}): Promise<AddPostBookmarkResult> {
  const userId = await requireAuthenticatedUserId();

  const prepared = await preparePostBookmarkCreation({url: input.url, userId});

  await db.insert(bookmarks).values({
    id: prepared.bookmarkId,
    url: prepared.url,
    title: null,
    description: null,
    userId,
    kind: "post",
    previewImage: prepared.previewImage,
    metadata: prepared.metadata,
  });

  if (input.tags && input.tags.length > 0) {
    try {
      await attachTagsToBookmark(prepared.bookmarkId, userId, input.tags);
    } catch (error) {
      console.error("Failed to attach tags to post bookmark:", error);
    }
  }

  if (input.collectionId) {
    try {
      await db.insert(bookmarkCollections).values({
        bookmarkId: prepared.bookmarkId,
        collectionId: input.collectionId,
      });
    } catch (error) {
      console.error("Failed to attach post bookmark to collection:", error);
    }
  }

  try {
    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-post-media`,
      body: {id: prepared.bookmarkId},
      idempotencyKey: `post-media-${prepared.bookmarkId}`,
      headers: {"x-job-type": "process-post-media"},
      timeout: 120,
    });
  } catch (error) {
    console.error("Failed to queue post media processing job:", error);
  }

  return {ok: true, url: prepared.url, id: prepared.bookmarkId};
}

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

  if (Object.keys(setValues).length === 0 && !hasTagUpdate && !hasCollectionUpdate)
    return {ok: true};

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

export async function fetchBookmarksPageAction(params: {
  offset: number;
  limit: number;
  sort: "recent" | "oldest" | "az";
  tagFilter: string | null;
  collectionFilter: string | null;
  typeFilter: "website" | "media" | "post";
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
    images: (row.images ?? undefined) as Bookmark["images"],
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
