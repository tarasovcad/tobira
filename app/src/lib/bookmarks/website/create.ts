import {randomUUID} from "crypto";
import {eq} from "drizzle-orm";
import {after} from "next/server";
import {db} from "@/db";
import {bookmarks, type WebsiteImages} from "@/db/schema";
import {buildWebsiteImages} from "@/features/media/utils";
import {trackServerEvent} from "@/lib/analytics/server";
import type {
  WebsiteBookmarkCreateCacheStatus,
  WebsiteBookmarkCreateQueueDecision,
} from "@/lib/analytics/events";
import {attachBookmarkRelations} from "@/lib/bookmarks/relations";
import {logger, toLogError} from "@/lib/shared/logger";
import {queueWebsiteBookmarkEnrichment} from "./queue";
import {buildBookmarkImagesFromWebsiteRecord} from "./refresh";
import {getReusableWebsiteRecord, type WebsiteRecord} from "./records";

export type CreateWebsiteBookmarkInput = {
  normalizedUrl: URL;
  userId: string;
  tags?: string[];
  collectionId?: string;
};

export async function createWebsiteBookmark({
  normalizedUrl,
  userId,
  tags,
  collectionId,
}: CreateWebsiteBookmarkInput) {
  const startedAt = performance.now();
  const url = normalizedUrl.toString();
  const urlHost = normalizedUrl.hostname;
  const bookmarkId = randomUUID();
  let cacheLookupMs: number | undefined;
  let bookmarkInsertDbMs: number | undefined;
  let relationsDbMs: number | undefined;
  let cacheStatus: WebsiteBookmarkCreateCacheStatus = "unknown";
  let queueDecision: WebsiteBookmarkCreateQueueDecision = "not_reached";

  try {
    const {
      key: websiteRecordKey,
      record: websiteRecord,
      fresh: websiteRecordFresh,
      htmlFresh,
      previewFresh,
    } = await measureWebsiteBookmarkCreateDuration(
      (durationMs) => {
        cacheLookupMs = durationMs;
      },
      () => getReusableWebsiteRecord(normalizedUrl),
    );

    cacheStatus = getWebsiteBookmarkCreateCacheStatus(websiteRecord, websiteRecordFresh);

    const images = await resolveWebsiteBookmarkImages(websiteRecord, url, previewFresh, htmlFresh);

    await measureWebsiteBookmarkCreateDuration(
      (durationMs) => {
        bookmarkInsertDbMs = durationMs;
      },
      () =>
        db.insert(bookmarks).values(
          buildWebsiteBookmarkValues({
            bookmarkId,
            url,
            userId,
            websiteRecordKey,
            websiteRecord,
            htmlFresh,
            images,
          }),
        ),
    );

    await measureWebsiteBookmarkCreateDuration(
      (durationMs) => {
        relationsDbMs = durationMs;
      },
      () =>
        attachBookmarkRelations({
          bookmarkId,
          userId,
          tags,
          collectionId,
          kind: "website",
        }),
    );

    if (!websiteRecordFresh) {
      queueDecision = "scheduled_after_response";
      scheduleWebsiteEnrichmentAfterResponse(bookmarkId, url, userId);
    } else {
      queueDecision = "skipped_fresh_cache";
    }

    scheduleWebsiteBookmarkCreateCompletedEvent({
      startedAt,
      urlHost,
      userId,
      success: true,
      errorCode: "none",
      cacheLookupMs,
      bookmarkInsertDbMs,
      relationsDbMs,
      cacheStatus,
      queueDecision,
    });

    return {id: bookmarkId, url};
  } catch (error) {
    scheduleWebsiteBookmarkCreateCompletedEvent({
      startedAt,
      urlHost,
      userId,
      success: false,
      errorCode: "unknown",
      cacheLookupMs,
      bookmarkInsertDbMs,
      relationsDbMs,
      cacheStatus,
      queueDecision,
    });
    throw error;
  }
}

async function measureWebsiteBookmarkCreateDuration<T>(
  setDuration: (durationMs: number) => void,
  operation: () => T | Promise<T>,
) {
  const startedAt = performance.now();
  try {
    return await operation();
  } finally {
    setDuration(Math.round(performance.now() - startedAt));
  }
}

function getWebsiteBookmarkCreateCacheStatus(
  websiteRecord: WebsiteRecord | null,
  websiteRecordFresh: boolean,
): WebsiteBookmarkCreateCacheStatus {
  if (websiteRecordFresh) return "fresh";
  return websiteRecord ? "partial" : "miss_or_stale";
}

function scheduleWebsiteBookmarkCreateCompletedEvent({
  startedAt,
  urlHost,
  userId,
  success,
  errorCode,
  cacheLookupMs,
  bookmarkInsertDbMs,
  relationsDbMs,
  cacheStatus,
  queueDecision,
}: {
  startedAt: number;
  urlHost: string;
  userId: string;
  success: boolean;
  errorCode: string;
  cacheLookupMs?: number;
  bookmarkInsertDbMs?: number;
  relationsDbMs?: number;
  cacheStatus: WebsiteBookmarkCreateCacheStatus;
  queueDecision: WebsiteBookmarkCreateQueueDecision;
}) {
  const durationMs = Math.round(performance.now() - startedAt);

  after(() => {
    void trackServerEvent(
      "website_bookmark_create_completed",
      {
        kind: "website",
        success: success ? "true" : "false",
        error_code: errorCode,
        url_host: urlHost,
        duration_ms: durationMs,
        cache_lookup_ms: cacheLookupMs,
        bookmark_insert_db_ms: bookmarkInsertDbMs,
        relations_db_ms: relationsDbMs,
        cache_status: cacheStatus,
        queue_decision: queueDecision,
      },
      {userId},
    );
  });
}

function scheduleWebsiteEnrichmentAfterResponse(bookmarkId: string, url: string, userId: string) {
  after(async () => {
    try {
      await enqueueWebsiteEnrichmentOrRollback(bookmarkId, url, userId);
    } catch {
      // enqueueWebsiteEnrichmentOrRollback logs the queue failure and deletes the bookmark.
    }
  });
}

async function resolveWebsiteBookmarkImages(
  websiteRecord: WebsiteRecord | null,
  url: string,
  previewFresh: boolean,
  htmlFresh: boolean,
): Promise<WebsiteImages | undefined> {
  return websiteRecord
    ? buildBookmarkImagesFromWebsiteRecord(websiteRecord.images, {previewFresh, htmlFresh})
    : await buildWebsiteImages(url);
}

function buildWebsiteBookmarkValues({
  bookmarkId,
  url,
  userId,
  websiteRecordKey,
  websiteRecord,
  htmlFresh,
  images,
}: {
  bookmarkId: string;
  url: string;
  userId: string;
  websiteRecordKey: string;
  websiteRecord: WebsiteRecord | null;
  htmlFresh: boolean;
  images: WebsiteImages | undefined;
}) {
  return {
    id: bookmarkId,
    url,
    userId,
    websiteRecordKey: websiteRecord ? websiteRecordKey : null,
    kind: "website" as const,
    title: htmlFresh ? websiteRecord?.title : undefined,
    description: htmlFresh ? websiteRecord?.description : undefined,
    images,
    metadata: {
      textMetadataStatus: htmlFresh ? (websiteRecord?.htmlStatus ?? "pending") : "pending",
    },
  };
}

async function enqueueWebsiteEnrichmentOrRollback(bookmarkId: string, url: string, userId: string) {
  const queueStartedAt = performance.now();
  try {
    await queueWebsiteBookmarkEnrichment(bookmarkId, {
      deduplicationId: `bookmark-${bookmarkId}`,
      retries: 2,
      urlHost: new URL(url).hostname,
      userId,
    });
  } catch (error) {
    await trackServerEvent(
      "bookmark_processing_job_queue_failed",
      {
        kind: "website",
        job_type: "process_website_bookmark",
        url_host: new URL(url).hostname,
        qstash_publish_ms: Math.round(performance.now() - queueStartedAt),
        error_code: "qstash_publish_failed",
      },
      {userId},
    );
    logger.error("Failed to queue website bookmark processing job", {
      bookmarkId,
      url,
      error: toLogError(error),
    });
    await deleteBookmarkAfterQueueFailure(bookmarkId);
    throw new Error("Failed to queue website bookmark processing job");
  }
}

async function deleteBookmarkAfterQueueFailure(bookmarkId: string) {
  try {
    await db.delete(bookmarks).where(eq(bookmarks.id, bookmarkId));
  } catch (error) {
    logger.error("Failed to delete website bookmark after queue failure", {
      bookmarkId,
      error: toLogError(error),
    });
  }
}
