import {buildWebsiteImageKeys} from "@/features/media/utils";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import {logger, toLogError} from "@/lib/shared/logger";
import {getWebsiteBookmarksProcessingInfo, getWebsiteRecordsByKeys} from "./bulk-db";
import {type WebsiteBookmarkProcessingMetrics} from "./metrics";
import {
  processPreparedWebsiteBookmark,
  type PreparedWebsiteBookmarkProcessingInfo,
} from "./process";
import {getWebsiteRecordKey} from "./records";

const BATCH_WEBSITE_PROCESSING_CONCURRENCY = 2;

export type WebsiteBookmarkBatchResult = {
  requested: number;
  found: number;
  succeeded: number;
  failed: number;
  skipped: number;
};

export async function processWebsiteBookmarkBatch(
  bookmarkIds: string[],
): Promise<WebsiteBookmarkBatchResult> {
  const requested = bookmarkIds.length;

  // Step 1: Bulk load all valid bookmark rows in one query.
  const bookmarks = await getWebsiteBookmarksProcessingInfo(bookmarkIds);
  const found = bookmarks.length;

  if (found === 0) {
    logger.info("Website bookmark batch: no valid bookmarks found", {
      requested,
      bookmarkIds,
    });
    return {requested, found: 0, succeeded: 0, failed: 0, skipped: 0};
  }

  // Step 2: Prepare batch data – normalize URLs and compute all keys.
  const keyedBookmarks = await Promise.all(
    bookmarks.map(async (bookmark) => {
      const normalizedUrl = normalizeInputUrl(bookmark.url).toString();
      const [websiteRecordKey, imageKeys] = await Promise.all([
        getWebsiteRecordKey(normalizedUrl),
        buildWebsiteImageKeys(normalizedUrl),
      ]);
      return {bookmark, normalizedUrl, websiteRecordKey, imageKeys};
    }),
  );

  // Step 3: Bulk fetch all existing website records in one query.
  const allKeys = keyedBookmarks.map((item) => item.websiteRecordKey);
  const existingRecords = await getWebsiteRecordsByKeys(allKeys);
  const recordMap = new Map(existingRecords.map((record) => [record.key, record]));

  // Step 4: Build prepared list with existing record from shared map.
  const prepared: PreparedWebsiteBookmarkProcessingInfo[] = keyedBookmarks.map((item) => ({
    id: item.bookmark.id,
    url: item.bookmark.url,
    normalizedUrl: item.normalizedUrl,
    websiteRecordKey: item.websiteRecordKey,
    imageKeys: item.imageKeys,
    existingRecord: recordMap.get(item.websiteRecordKey) ?? null,
  }));

  // Step 5: Process with limited concurrency and per-bookmark error isolation.
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  let index = 0;

  async function processNext(): Promise<void> {
    while (index < prepared.length) {
      const current = prepared[index++]!;
      const itemStartedAt = performance.now();
      const metrics: WebsiteBookmarkProcessingMetrics = {};

      try {
        await processPreparedWebsiteBookmark(current, metrics, itemStartedAt);

        // processPreparedWebsiteBookmark returns early (without throwing) when a bookmark
        // no longer exists after the text-metadata update (deleted between our bulk
        // select and the per-item update). Detect this via url_host being unset – if
        // url_host was never set the item was skipped before any real work.
        if (!metrics.url_host) {
          skipped++;
        } else {
          succeeded++;
        }
      } catch (error) {
        failed++;
        logger.error("Website bookmark batch item failed", {
          bookmarkId: current.id,
          url: current.normalizedUrl,
          error: toLogError(error),
        });
        // Do NOT re-throw: one failed bookmark must not abort the whole batch.
        // Returning 200 prevents QStash from retrying the batch and reprocessing
        // the bookmarks that already succeeded.
      }
    }
  }

  // Run BATCH_WEBSITE_PROCESSING_CONCURRENCY workers concurrently.
  // Each worker pulls the next item from the shared index, so concurrency is
  // naturally limited without needing an external library.
  const workers = Array.from({length: BATCH_WEBSITE_PROCESSING_CONCURRENCY}, () => processNext());
  await Promise.all(workers);

  const result: WebsiteBookmarkBatchResult = {requested, found, succeeded, failed, skipped};

  logger.info("Website bookmark batch completed", result);

  return result;
}
