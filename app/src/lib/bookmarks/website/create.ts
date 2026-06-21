import {randomUUID} from "crypto";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {buildWebsiteImages} from "@/features/media/utils";
import {fetchDirectUrlMetadata} from "@/lib/bookmarks/metadata";
import {attachBookmarkRelations} from "@/lib/bookmarks/relations";
import {logger, toLogError} from "@/lib/shared/logger";
import {resolveWebsiteMetadataState} from "./metadata-outcome";
import {queueWebsiteBookmarkEnrichment} from "./queue";

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

  const metadataStartedAt = performance.now();
  const outcome = await fetchDirectUrlMetadata(normalizedUrl);
  const metadataState = resolveWebsiteMetadataState(outcome);
  timingsMs.fetchDirectUrlMetadata = elapsedMs(metadataStartedAt);

  const bookmarkId = randomUUID();
  const imagesStartedAt = performance.now();
  const images = await buildWebsiteImages(url);
  timingsMs.buildWebsiteImages = elapsedMs(imagesStartedAt);

  const insertStartedAt = performance.now();
  await db.insert(bookmarks).values({
    id: bookmarkId,
    url,
    title: metadataState.title,
    userId,
    description: metadataState.description,
    kind: "website",
    images,
    metadata: metadataState.metadata,
  });
  timingsMs.insertBookmark = elapsedMs(insertStartedAt);

  await attachBookmarkRelations({
    bookmarkId,
    userId,
    tags,
    collectionId,
    kind: "website",
  });

  if (metadataState.shouldQueueEnrichment) {
    const queueStartedAt = performance.now();
    try {
      await queueWebsiteBookmarkEnrichment(bookmarkId, {
        idempotencyKey: `bookmark-${bookmarkId}`,
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
  logger.info("addWebsiteBookmark timings", {bookmarkId, url, timingsMs});

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
