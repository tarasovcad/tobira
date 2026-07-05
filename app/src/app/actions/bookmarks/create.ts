"use server";

import {Client} from "@upstash/qstash";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {requireAuthenticatedUserId} from "@/lib/auth/session";
import {prepareMediaBookmark} from "./prepareMediaBookmark";
import {preparePostBookmarkCreation} from "@/lib/bookmarks/post";
import {attachBookmarkRelations} from "@/lib/bookmarks/relations";
import {createWebsiteBookmark} from "@/lib/bookmarks/website/create";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import {assertWebsiteUrl} from "@/lib/fetch/web/website-url";
import {enforceWebsiteBookmarkCreateRateLimit} from "@/lib/rate-limit/website-bookmarks";
import type {BookmarkMediaItem} from "@/components/bookmark/types/metadata";

export type AddWebsiteBookmarkResult = {
  ok: true;
  url: string;
  id: string;
};

export type AddMediaBookmarkResult = {
  ok: true;
  url: string;
  media?: string[];
  mediaItems?: BookmarkMediaItem[];
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
  const userId = await requireAuthenticatedUserId();

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(input.url);
    assertWebsiteUrl(normalized);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Invalid url");
  }

  await enforceWebsiteBookmarkCreateRateLimit(userId);

  const bookmark = await createWebsiteBookmark({
    normalizedUrl: normalized,
    userId,
    tags: input.tags,
    collectionId: input.collectionId,
  });

  return {ok: true, ...bookmark};
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

  const prepared = await prepareMediaBookmark({
    url: input.url,
    selectedMediaUrls: input.selectedMediaUrls,
    userId,
  });

  if (prepared.requiresSelection) {
    return {
      ok: true,
      url: prepared.normalized.toString(),
      media: prepared.mediaUrls,
      mediaItems: prepared.mediaItems,
    };
  }

  await db.insert(bookmarks).values(prepared.bookmarkToInsert);

  await attachBookmarkRelations({
    bookmarkId: prepared.bookmarkId,
    userId,
    tags: input.tags,
    collectionId: input.collectionId,
    kind: "media",
  });

  try {
    await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-media-bookmark`,
      body: {id: prepared.bookmarkId},
      deduplicationId: `media-bookmark-${prepared.bookmarkId}`,
      headers: {"x-job-type": "process-media-bookmark"},
      timeout: 120,
    });
  } catch (error) {
    console.error("Failed to queue media bookmark processing job:", error);
    try {
      await db.delete(bookmarks).where(eq(bookmarks.id, prepared.bookmarkId));
    } catch (cleanupError) {
      console.error("Failed to delete media bookmark after queue failure:", cleanupError);
    }
    throw new Error("Failed to queue media bookmark processing job");
  }

  return {
    ok: true,
    url: prepared.normalized.toString(),
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

  if (input.kind !== "post") {
    throw new Error("Invalid kind");
  }

  const prepared = await preparePostBookmarkCreation({url: input.url, userId});

  await db.insert(bookmarks).values(prepared.bookmarkToInsert);

  await attachBookmarkRelations({
    bookmarkId: prepared.bookmarkId,
    userId,
    tags: input.tags,
    collectionId: input.collectionId,
    kind: "post",
  });

  if (prepared.bookmarkToInsert.images.processing) {
    try {
      await qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-post-media`,
        body: {id: prepared.bookmarkId},
        deduplicationId: `post-media-${prepared.bookmarkId}`,
        headers: {"x-job-type": "process-post-media"},
        timeout: 120,
      });
    } catch (error) {
      console.error("Failed to queue post media processing job:", error);
      try {
        await db.delete(bookmarks).where(eq(bookmarks.id, prepared.bookmarkId));
      } catch (cleanupError) {
        console.error("Failed to delete post bookmark after queue failure:", cleanupError);
      }
      throw new Error("Failed to queue post media processing job");
    }
  }

  return {ok: true, url: prepared.url, id: prepared.bookmarkId};
}
