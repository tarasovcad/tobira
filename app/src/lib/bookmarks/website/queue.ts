import {Client} from "@upstash/qstash";
import {trackServerEvent} from "@/lib/analytics/server";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_URL,
});

type QueueWebsiteBookmarkEnrichmentOptions = {
  deduplicationId?: string;
  retries?: number;
  urlHost: string;
  userId: string;
};

export async function queueWebsiteBookmarkEnrichment(
  bookmarkId: string,
  options: QueueWebsiteBookmarkEnrichmentOptions,
) {
  const publishStartedAt = performance.now();
  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/process-website-bookmark`,
    body: {id: bookmarkId},
    deduplicationId: options.deduplicationId,
    headers: {"x-job-type": "process_website_bookmark", "x-version": "v1"},
    timeout: 120,
    retries: options.retries,
  });
  const qstashPublishMs = Math.round(performance.now() - publishStartedAt);

  void trackServerEvent(
    "bookmark_processing_job_queued",
    {
      kind: "website",
      job_type: "process_website_bookmark",
      url_host: options.urlHost,
      qstash_publish_ms: qstashPublishMs,
    },
    options.userId ? {userId: options.userId} : {},
  );
}
