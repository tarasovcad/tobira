import {Client} from "@upstash/qstash";

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
  options: QueueWebsiteBookmarkEnrichmentOptions = {},
) {
  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-website-bookmark`,
    body: {id: bookmarkId},
    deduplicationId: options.deduplicationId,
    headers: {"x-job-type": "enrich-bookmark", "x-version": "v1"},
    timeout: 120,
    retries: options.retries,
  });
}
