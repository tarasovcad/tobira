import {randomUUID} from "crypto";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {buildWebsiteImages} from "@/features/media/utils";
import {attachBookmarkRelations} from "@/lib/bookmarks/relations";
import {logger, toLogError} from "@/lib/shared/logger";
import {queueWebsiteBookmarkEnrichment} from "./queue";
import {buildBookmarkImagesFromWebsiteRecord, getReusableWebsiteRecord} from "./records";

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
  const {key: websiteRecordKey, record: websiteRecord} =
    await getReusableWebsiteRecord(normalizedUrl);
  timingsMs.getReusableWebsiteRecord = elapsedMs(recordStartedAt);

  const imagesStartedAt = performance.now();
  const images = websiteRecord
    ? buildBookmarkImagesFromWebsiteRecord(websiteRecord.images)
    : await buildWebsiteImages(url);
  timingsMs.buildWebsiteImages = elapsedMs(imagesStartedAt);

  const usesWebsiteRecord = !!websiteRecord;

  const insertStartedAt = performance.now();
  await db.insert(bookmarks).values({
    id: bookmarkId,
    url,
    userId,
    websiteRecordKey: websiteRecord ? websiteRecordKey : null,
    kind: "website",
    title: websiteRecord?.title,
    description: websiteRecord?.description,
    images,
    metadata: {
      textMetadataStatus: websiteRecord?.htmlStatus ?? "pending",
    },
  });
  timingsMs.insertBookmark = elapsedMs(insertStartedAt);

  await attachBookmarkRelations({
    bookmarkId,
    userId,
    tags,
    collectionId,
    kind: "website",
  });

  if (!usesWebsiteRecord) {
    const queueStartedAt = performance.now();
    try {
      await queueWebsiteBookmarkEnrichment(bookmarkId, {
        deduplicationId: `bookmark-${bookmarkId}`,
        retries: 2,
      });
      timingsMs.qstashPublishJSON = elapsedMs(queueStartedAt);
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

  timingsMs.totalAddWebsiteBookmark = elapsedMs(startedAt);
  logger.info("addWebsiteBookmark timings", {
    bookmarkId,
    url,
    websiteRecordKey: websiteRecord ? websiteRecordKey : undefined,
    usedWebsiteRecord: usesWebsiteRecord,
    timingsMs,
  });

  return {id: bookmarkId, url};
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
