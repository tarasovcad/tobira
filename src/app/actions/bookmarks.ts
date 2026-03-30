"use server";

import {auth} from "@/lib/auth";
import {
  extractDescriptionFromHtml,
  extractTitleFromHtml,
  fetchBrowserlessRenderedHtml,
  fetchTextWithTimeout,
  isHtmlContentType,
  looksLikeChallengeHtml,
  normalizeInputUrl,
} from "@/lib/web-fetch";
import {ALLOWED_MEDIA_DOMAINS} from "@/components/providers/constants";
import {extractXMedia} from "@/lib/media-fetch";
import {headers} from "next/headers";
import {Client} from "@upstash/qstash";
import {randomUUID} from "crypto";
import {createClient as createSupabaseClient, type SupabaseClient} from "@supabase/supabase-js";
import {db} from "@/db";
import {bookmarks, bookmarkTags, bookmarkCollections, tags} from "@/db/schema";
import {and, eq, inArray, notInArray, asc, desc, exists, isNull} from "drizzle-orm";
import type {Bookmark} from "@/components/bookmark/types";
import {normalizeTagNames} from "@/lib/utils";

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

export type UrlMetadataResult = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  title?: string;
  description?: string;
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

export async function fetchUrlMetadata(
  normalized: URL,
  inputUrl: string,
): Promise<UrlMetadataResult> {
  const result: UrlMetadataResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
  };

  // --- Fast path: simple fetch (works for ~95% of sites) ---
  const res = await fetchTextWithTimeout(normalized.toString(), 8000, {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  result.finalUrl = res.url;

  const contentType = res.headers.get("content-type") ?? "";
  if (!isHtmlContentType(contentType)) {
    return result;
  }

  let html = await res.text();
  let usedBrowserless = false;

  // --- Fallback: if the HTML looks like a Cloudflare/bot challenge page,
  //     use Browserless to get the real rendered HTML ---
  if (looksLikeChallengeHtml(html)) {
    try {
      html = await fetchBrowserlessRenderedHtml(normalized.toString());
      usedBrowserless = true;
    } catch {
      // Browserless fallback failed — continue with whatever we got
    }
  }

  result.title = extractTitleFromHtml(html);
  result.description = extractDescriptionFromHtml(html);

  // If title/description are still empty after Browserless, and it still
  // looks like a challenge page, treat as unavailable (don't store garbage)
  if (!usedBrowserless && looksLikeChallengeHtml(html)) {
    result.title = undefined;
    result.description = undefined;
  }

  // Graceful fallback: use the hostname as title when extraction failed
  if (!result.title) {
    result.title = normalized.hostname.replace(/^www\./, "");
  }

  return result;
}

/**
 * Attach tags to a bookmark using upsert logic (replaces the attach_tags_to_bookmark RPC).
 * Tags are created if they don't exist, then linked to the bookmark.
 */
async function attachTagsToBookmark(bookmarkId: string, userId: string, rawTagNames: string[]) {
  if (!bookmarkId || !userId) {
    throw new Error("bookmarkId and userId are required");
  }

  const cleanedTagNames = normalizeTagNames(rawTagNames);
  if (cleanedTagNames.length === 0) return;

  // Upsert tags and RETURN the IDs
  // We use DO UPDATE so that we always get the ID back, even if it already existed.
  const upsertedTags = await db
    .insert(tags)
    .values(cleanedTagNames.map((name) => ({name, userId})))
    .onConflictDoUpdate({
      target: [tags.userId, tags.name],
      set: {updatedAt: new Date().toISOString()},
    })
    .returning({id: tags.id});

  // Link to bookmark using the IDs directly from the upsert
  if (upsertedTags.length > 0) {
    await db
      .insert(bookmarkTags)
      .values(upsertedTags.map((t) => ({bookmarkId, tagId: t.id})))
      .onConflictDoNothing();
  }
}

/**
 * Sync bookmark tags — replaces the sync_bookmark_tags RPC.
 * Removes tags not in the new list, adds tags not yet attached.
 */
async function syncBookmarkTags(bookmarkId: string, userId: string, rawTagNames: string[]) {
  if (!bookmarkId || !userId) {
    throw new Error("invalid input");
  }

  // Ensure bookmark belongs to user and is not deleted
  const [bookmarkExists] = await db
    .select({id: bookmarks.id})
    .from(bookmarks)
    .where(
      and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId), isNull(bookmarks.deletedAt)),
    );

  if (!bookmarkExists) {
    throw new Error("bookmark not found");
  }

  const cleanedTagNames = normalizeTagNames(rawTagNames);

  if (cleanedTagNames.length === 0) {
    // Remove all existing tag links
    await db.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, bookmarkId));
    return;
  }

  // Ensure tags exist (using DO NOTHING to avoid unnecessary updated_at churn)
  await db
    .insert(tags)
    .values(cleanedTagNames.map((name) => ({name, userId})))
    .onConflictDoNothing();

  // Fetch the actual IDs for our desired tags
  const desiredTags = await db
    .select({id: tags.id})
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.name, cleanedTagNames)));

  const desiredTagIds = desiredTags.map((t) => t.id);

  if (desiredTagIds.length === 0) return; // Should not happen safely

  // Attach missing joins
  await db
    .insert(bookmarkTags)
    .values(desiredTagIds.map((tagId) => ({bookmarkId, tagId})))
    .onConflictDoNothing();

  // Remove joins that are no longer desired
  await db
    .delete(bookmarkTags)
    .where(
      and(eq(bookmarkTags.bookmarkId, bookmarkId), notInArray(bookmarkTags.tagId, desiredTagIds)),
    );
}

export async function addWebsiteBookmark(input: {
  url: string;
  tags?: string[];
  collectionId?: string;
  kind: "website";
}): Promise<AddWebsiteBookmarkResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(input.url);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Invalid url");
  }

  let metadata: UrlMetadataResult;
  try {
    metadata = await fetchUrlMetadata(normalized, input.url);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Failed to fetch metadata");
  }

  const bookmarkId = randomUUID();

  await db.insert(bookmarks).values({
    id: bookmarkId,
    url: normalized.toString(),
    title: metadata.title ?? null,
    userId: session.user.id,
    description: metadata.description ?? null,
    kind: input.kind ?? "website",
    previewImage: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bookmark-previews/${bookmarkId}/preview.png`,
  });

  // Attach tags (bookmark creation should still succeed if tagging fails)
  if (input.tags && input.tags.length > 0) {
    try {
      await attachTagsToBookmark(bookmarkId, session.user.id, input.tags);
    } catch (e) {
      console.error("Failed to attach tags to bookmark:", e);
    }
  }

  // Attach to collection if provided
  if (input.collectionId) {
    try {
      await db.insert(bookmarkCollections).values({
        bookmarkId,
        collectionId: input.collectionId,
      });
    } catch (e) {
      console.error("Failed to attach bookmark to collection:", e);
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

async function processAndUploadMediaImage(
  mediaUrl: string,
  bookmarkId: string,
  serviceRoleSupabase: SupabaseClient,
  filenamePrefix: string = "media",
): Promise<string> {
  try {
    const isMp4 = mediaUrl.endsWith(".mp4") || mediaUrl.includes(".mp4?");
    const isMov = mediaUrl.endsWith(".mov") || mediaUrl.includes(".mov?");
    const isVideo = isMp4 || isMov;

    const imageRes = await fetch(mediaUrl);
    if (!imageRes.ok) return mediaUrl;

    const imageBuffer = await imageRes.arrayBuffer();

    let fallbackContentType = "image/jpeg";
    let fallbackExtension = "jpg";

    if (isMp4) {
      fallbackContentType = "video/mp4";
      fallbackExtension = "mp4";
    } else if (isMov) {
      fallbackContentType = "video/quicktime";
      fallbackExtension = "mov";
    }

    const contentType = imageRes.headers.get("content-type") || fallbackContentType;
    let extension = contentType.split("/")[1]?.replace("jpeg", "jpg") || fallbackExtension;

    if (
      isVideo &&
      !extension.includes("mp4") &&
      !extension.includes("quicktime") &&
      !extension.includes("mov")
    ) {
      extension = fallbackExtension;
    }

    const filePath = `${bookmarkId}/${filenamePrefix}.${extension}`;

    const {error: uploadError} = await serviceRoleSupabase.storage
      .from("bookmark-media")
      .upload(filePath, imageBuffer, {contentType, upsert: true});

    if (uploadError) {
      console.error("Failed to upload to Supabase storage:", uploadError);
      return mediaUrl;
    }

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bookmark-media/${filePath}`;
  } catch (err) {
    console.error("Failed to fetch media for storage:", err);
    return mediaUrl;
  }
}

export async function addMediaBookmark(input: {
  url: string;
  tags?: string[];
  collectionId?: string;
  kind: "media";
  selectedMediaUrls?: string[];
}): Promise<AddMediaBookmarkResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");
  if (input.kind !== "media") throw new Error("Invalid kind");

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(input.url);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Invalid url");
  }

  const hostname = normalized.hostname;
  const isAllowedDomain = ALLOWED_MEDIA_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );

  if (!isAllowedDomain) throw new Error("Domain not supported for media bookmarks");

  const isXDomain = ["x.com", "twitter.com", "www.x.com", "www.twitter.com"].includes(hostname);
  if (!isXDomain)
    throw new Error("Only X (Twitter) URLs are currently supported for media bookmarks.");

  let mediaUrls: string[] = [];
  const extractedMetadata = await extractXMedia(normalized.toString());

  if (extractedMetadata?.hasMedia === false) {
    throw new Error("This post has no media. Please save it as a Website bookmark instead.");
  }

  if (Array.isArray(extractedMetadata?.mediaURLs)) {
    mediaUrls = extractedMetadata.mediaURLs;
  }

  if (!input.selectedMediaUrls && mediaUrls.length > 1) {
    return {ok: true, url: input.url, media: mediaUrls};
  }

  const urlsToCreate = input.selectedMediaUrls?.length ? input.selectedMediaUrls : mediaUrls;

  const serviceRoleSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const processedItems = await Promise.all(
    urlsToCreate.map(async (mediaUrl) => {
      const bookmarkId = randomUUID();
      const previewImage = await processAndUploadMediaImage(
        mediaUrl,
        bookmarkId,
        serviceRoleSupabase,
      );

      let uploadedThumbnailUrl = null;
      let mediaInfo = null;

      if (extractedMetadata?.media_extended) {
        mediaInfo = extractedMetadata.media_extended.find((m: {url: string}) => m.url === mediaUrl);
        if (mediaInfo?.thumbnail_url) {
          uploadedThumbnailUrl = await processAndUploadMediaImage(
            mediaInfo.thumbnail_url,
            bookmarkId,
            serviceRoleSupabase,
            "placeholder",
          );
        }
      }

      return {bookmarkId, previewImage, mediaUrl, mediaInfo, uploadedThumbnailUrl};
    }),
  );

  const bookmarksToInsert = processedItems.map(
    ({bookmarkId, previewImage, mediaInfo, uploadedThumbnailUrl}) => {
      let metadataToSave = null;

      if (extractedMetadata) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {media_extended: _media_extended, ...restMetadata} = extractedMetadata;
        metadataToSave = {
          ...restMetadata,
          width: mediaInfo?.size?.width || null,
          height: mediaInfo?.size?.height || null,
          thumbnail_url: uploadedThumbnailUrl || mediaInfo?.thumbnail_url || null,
        };
      }

      return {
        id: bookmarkId,
        url: normalized.toString(),
        description: extractedMetadata?.text || null,
        userId: session.user.id,
        kind: "media" as const,
        previewImage,
        metadata: metadataToSave,
      };
    },
  );

  await db.insert(bookmarks).values(bookmarksToInsert);

  if (input.collectionId) {
    await db
      .insert(bookmarkCollections)
      .values(
        processedItems.map(({bookmarkId}) => ({bookmarkId, collectionId: input.collectionId!})),
      )
      .onConflictDoNothing();
  }

  if (input.tags && input.tags.length > 0) {
    await Promise.all(
      processedItems.map(({bookmarkId}) =>
        attachTagsToBookmark(bookmarkId, session.user.id, input.tags!),
      ),
    );
  }

  return {
    ok: true,
    url: input.url,
    media: mediaUrls,
    ids: processedItems.map((p) => p.bookmarkId),
  };
}

export async function updateBookmark(
  bookmarkId: string,
  updates: UpdateBookmarkData,
): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

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
      .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, session.user.id)));
  }

  if (hasTagUpdate) {
    await syncBookmarkTags(bookmarkId, session.user.id, updates.tags ?? []);
  }

  return {ok: true};
}

export async function deleteBookmarks(bookmarkIds: string | string[]): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const ids = Array.isArray(bookmarkIds) ? bookmarkIds : [bookmarkIds];

  await db
    .update(bookmarks)
    .set({deletedAt: new Date().toISOString()})
    .where(and(eq(bookmarks.userId, session.user.id), inArray(bookmarks.id, ids)));

  return {ok: true};
}

export async function archiveBookmarks(bookmarkIds: string | string[]): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const ids = Array.isArray(bookmarkIds) ? bookmarkIds : [bookmarkIds];
  const now = new Date().toISOString();

  await db
    .update(bookmarks)
    .set({archivedAt: now, updatedAt: now})
    .where(and(eq(bookmarks.userId, session.user.id), inArray(bookmarks.id, ids)));

  return {ok: true};
}

export async function resetBookmark(bookmarkId: string): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const [bookmark] = await db
    .select({id: bookmarks.id, url: bookmarks.url})
    .from(bookmarks)
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, session.user.id)));

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
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, session.user.id)));

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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const userId = session.user.id;
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
