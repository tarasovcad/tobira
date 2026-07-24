import {Client} from "@upstash/qstash";
import {BULK_WEBSITE_MAX_URLS} from "./normalize-bulk-urls";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_URL,
});

type QueueWebsiteBookmarkEnrichmentOptions = {
  deduplicationId?: string;
  retries?: number;
};

export async function queueWebsiteBookmarkEnrichment(
  bookmarkId: string,
  options: QueueWebsiteBookmarkEnrichmentOptions,
) {
  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-website-bookmark`,
    body: {id: bookmarkId},
    deduplicationId: options.deduplicationId,
    headers: {"x-job-type": "process_website_bookmark", "x-version": "v1"},
    timeout: 120,
    retries: options.retries,
  });
}

type QueueWebsiteBookmarkBatchOptions = {
  deduplicationId?: string;
  retries?: number;
};

export async function queueWebsiteBookmarkBatch(
  bookmarkIds: string[],
  options: QueueWebsiteBookmarkBatchOptions,
) {
  const seen = new Set<string>();
  const uniqueIds: string[] = [];
  for (const id of bookmarkIds) {
    const trimmed = id.trim();
    if (trimmed.length > 0 && !seen.has(trimmed)) {
      seen.add(trimmed);
      uniqueIds.push(trimmed);
    }
  }

  if (uniqueIds.length === 0) {
    throw new Error("Cannot queue empty bookmark batch");
  }

  if (uniqueIds.length > BULK_WEBSITE_MAX_URLS) {
    throw new Error(`Cannot queue batch larger than ${BULK_WEBSITE_MAX_URLS} bookmarks`);
  }

  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-website-bookmark-batch`,
    body: {bookmarkIds: uniqueIds},
    deduplicationId: options.deduplicationId,
    headers: {"x-job-type": "process_website_bookmark_batch", "x-version": "v1"},
    timeout: 300,
    retries: options.retries ?? 2,
  });
}
