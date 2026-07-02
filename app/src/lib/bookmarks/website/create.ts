import {randomUUID} from "crypto";
import {eq} from "drizzle-orm";
import {after} from "next/server";
import {db} from "@/db";
import {bookmarks, type WebsiteImages} from "@/db/schema";
import {buildWebsiteImages} from "@/features/media/utils";
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
  const timingsMs: Record<string, number> = {};
  const url = normalizedUrl.toString();
  const bookmarkId = randomUUID();

  const recordStartedAt = performance.now();
  const {
    key: websiteRecordKey,
    record: websiteRecord,
    fresh: websiteRecordFresh,
    htmlFresh,
    previewFresh,
  } = await getReusableWebsiteRecord(normalizedUrl);
  timingsMs.getReusableWebsiteRecord = elapsedMs(recordStartedAt);

  const imagesStartedAt = performance.now();
  const images = await resolveWebsiteBookmarkImages(websiteRecord, url, previewFresh, htmlFresh);
  timingsMs.buildWebsiteImages = elapsedMs(imagesStartedAt);

  const insertStartedAt = performance.now();
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
  timingsMs.insertBookmark = elapsedMs(insertStartedAt);

  await attachBookmarkRelations({
    bookmarkId,
    userId,
    tags,
    collectionId,
    kind: "website",
  });

  if (!websiteRecordFresh) {
    const scheduleStartedAt = performance.now();
    scheduleWebsiteEnrichmentAfterResponse(bookmarkId, url);
    timingsMs.scheduleWebsiteEnrichment = elapsedMs(scheduleStartedAt);
  }

  timingsMs.totalAddWebsiteBookmark = elapsedMs(startedAt);
  logger.info("addWebsiteBookmark timings", {
    bookmarkId,
    url,
    websiteRecordKey: websiteRecord ? websiteRecordKey : undefined,
    usedWebsiteRecord: !!websiteRecord,
    websiteRecordFresh,
    htmlFresh,
    previewFresh,
    timingsMs,
  });

  return {id: bookmarkId, url};
}

function scheduleWebsiteEnrichmentAfterResponse(bookmarkId: string, url: string) {
  after(async () => {
    const queueStartedAt = performance.now();

    try {
      await enqueueWebsiteEnrichmentOrRollback(bookmarkId, url);
      logger.info("Queued website bookmark enrichment after response", {
        bookmarkId,
        url,
        timingsMs: {
          qstashPublishJSON: elapsedMs(queueStartedAt),
        },
      });
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

async function enqueueWebsiteEnrichmentOrRollback(bookmarkId: string, url: string) {
  try {
    await queueWebsiteBookmarkEnrichment(bookmarkId, {
      deduplicationId: `bookmark-${bookmarkId}`,
      retries: 2,
    });
  } catch (error) {
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

function elapsedMs(startedAt: number) {
  return Number((performance.now() - startedAt).toFixed(2));
}
