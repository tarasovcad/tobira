"use server";

import {Client} from "@upstash/qstash";
import {randomUUID} from "crypto";
import {db} from "@/db";
import {bookmarks, bookmarkCollections} from "@/db/schema";
import {requireAuthenticatedUserId} from "@/lib/auth/session";
import {fetchUrlMetadata, type UrlMetadataResult} from "@/lib/bookmarks/metadata";
import {prepareMediaBookmarkCreation} from "@/features/media/server/prepare";
import {preparePostBookmarkCreation} from "@/lib/bookmarks/post";
import {buildWebsiteImages} from "@/features/media/utils";
import {attachTagsToBookmark} from "@/lib/bookmarks/tags";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import {logger} from "@/lib/shared/logger";
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
  const addWebsiteBookmarkStart = performance.now();
  const timingsMs: Record<string, number> = {};
  const userId = await requireAuthenticatedUserId();

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(input.url);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Invalid url");
  }

  let metadata: UrlMetadataResult;
  try {
    const fetchUrlMetadataStart = performance.now();
    metadata = await fetchUrlMetadata(normalized, input.url);
    timingsMs.fetchUrlMetadata = Number((performance.now() - fetchUrlMetadataStart).toFixed(2));
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to fetch metadata");
  }

  const bookmarkId = randomUUID();
  const buildWebsiteImagesStart = performance.now();
  const images = await buildWebsiteImages(normalized.toString());
  timingsMs.buildWebsiteImages = Number((performance.now() - buildWebsiteImagesStart).toFixed(2));

  const dbInsertStart = performance.now();
  await db.insert(bookmarks).values({
    id: bookmarkId,
    url: normalized.toString(),
    title: metadata.title ?? null,
    userId,
    description: metadata.description ?? null,
    kind: "website",
    images,
  });
  timingsMs.insertBookmark = Number((performance.now() - dbInsertStart).toFixed(2));

  const attachments: Promise<unknown>[] = [];

  if (input.tags && input.tags.length > 0) {
    attachments.push(
      (async () => {
        try {
          await attachTagsToBookmark(bookmarkId, userId, input.tags!);
        } catch (error) {
          console.error("Failed to attach tags to bookmark:", error);
        }
      })(),
    );
  }

  if (input.collectionId) {
    attachments.push(
      (async () => {
        try {
          await db.insert(bookmarkCollections).values({
            bookmarkId,
            collectionId: input.collectionId!,
          });
        } catch (error) {
          console.error("Failed to attach bookmark to collection:", error);
        }
      })(),
    );
  }

  await Promise.all(attachments);

  const qstashPublishStart = performance.now();
  qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-website-bookmark`,
    body: {url: normalized.toString(), id: bookmarkId},
    idempotencyKey: `bookmark-${bookmarkId}`,
    headers: {"x-job-type": "enrich-bookmark", "x-version": "v1"},
    timeout: 30,
  });
  timingsMs.qstashPublishJSON = Number((performance.now() - qstashPublishStart).toFixed(2));
  timingsMs.totalAddWebsiteBookmark = Number(
    (performance.now() - addWebsiteBookmarkStart).toFixed(2),
  );

  logger.info("addWebsiteBookmark timings", {
    bookmarkId,
    url: normalized.toString(),
    timingsMs,
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

  const attachments: Promise<unknown>[] = [];

  if (input.collectionId) {
    attachments.push(
      db
        .insert(bookmarkCollections)
        .values({
          bookmarkId: prepared.bookmarkId,
          collectionId: input.collectionId,
        })
        .onConflictDoNothing(),
    );
  }

  if (input.tags && input.tags.length > 0) {
    attachments.push(attachTagsToBookmark(prepared.bookmarkId, userId, input.tags));
  }

  await Promise.all(attachments);

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
    metadata: prepared.metadata,
  });

  const attachments: Promise<unknown>[] = [];

  if (input.tags && input.tags.length > 0) {
    attachments.push(
      (async () => {
        try {
          await attachTagsToBookmark(prepared.bookmarkId, userId, input.tags!);
        } catch (error) {
          console.error("Failed to attach tags to post bookmark:", error);
        }
      })(),
    );
  }

  if (input.collectionId) {
    attachments.push(
      (async () => {
        try {
          await db.insert(bookmarkCollections).values({
            bookmarkId: prepared.bookmarkId,
            collectionId: input.collectionId!,
          });
        } catch (error) {
          console.error("Failed to attach post bookmark to collection:", error);
        }
      })(),
    );
  }

  await Promise.all(attachments);

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
