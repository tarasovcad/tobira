import {randomUUID} from "crypto";
import {eq} from "drizzle-orm";
import {after} from "next/server";
import {db} from "@/db";
import {bookmarks, type WebsiteImages} from "@/db/schema";
import {buildWebsiteImages} from "@/features/media/utils";
import {trackServerEvent} from "@/lib/analytics/server";
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
  const url = normalizedUrl.toString();
  const bookmarkId = randomUUID();

  const {
    key: websiteRecordKey,
    record: websiteRecord,
    fresh: websiteRecordFresh,
    htmlFresh,
    previewFresh,
  } = await getReusableWebsiteRecord(normalizedUrl);

  const images = await resolveWebsiteBookmarkImages(websiteRecord, url, previewFresh, htmlFresh);

  await db.insert(bookmarks).values(
    buildWebsiteBookmarkValues({
      bookmarkId,
      url,
      userId,
      websiteRecordKey,
      websiteRecord,
      htmlFresh,
      images,
    }),
  );

  await attachBookmarkRelations({
    bookmarkId,
    userId,
    tags,
    collectionId,
    kind: "website",
  });

  if (!websiteRecordFresh) {
    scheduleWebsiteEnrichmentAfterResponse(bookmarkId, url, userId);
  }

  return {id: bookmarkId, url};
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
