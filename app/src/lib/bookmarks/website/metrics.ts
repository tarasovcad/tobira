import {trackServerEvent} from "@/lib/analytics/server";
import type {
  WebsiteAssetProcessingResult,
  WebsiteAssetProcessingStatus,
  WebsitePreviewProvider,
} from "./processing-results";

export type WebsiteBookmarkProcessingMetrics = Partial<{
  url_host: string;
  bookmark_select_db_ms: number;
  website_record_select_db_ms: number;
  db_ms: number;
  html_fetch_ms: number;
  html_extract_ms: number;
  text_metadata_db_ready_ms: number;
  r2_exists_ms: number;
  favicon_ms: number;
  og_ms: number;
  preview_ms: number;
  bookmark_update_db_ms: number;
  website_record_upsert_db_ms: number;
  html_status: WebsiteAssetProcessingStatus;
  favicon_status: WebsiteAssetProcessingStatus;
  og_status: WebsiteAssetProcessingStatus;
  preview_status: WebsiteAssetProcessingStatus;
  preview_provider: WebsitePreviewProvider;
  website_protected: "true" | "false";
}>;

type WebsiteProcessingDurationField = Exclude<
  keyof WebsiteBookmarkProcessingMetrics,
  | "url_host"
  | "html_status"
  | "favicon_status"
  | "og_status"
  | "preview_status"
  | "preview_provider"
  | "website_protected"
>;

export async function measureDuration<T>(
  metrics: WebsiteBookmarkProcessingMetrics,
  field: WebsiteProcessingDurationField,
  operation: () => Promise<T>,
) {
  const startedAt = performance.now();
  try {
    return await operation();
  } finally {
    recordDuration(metrics, field, startedAt);
  }
}

export async function measureDb<T>(
  metrics: WebsiteBookmarkProcessingMetrics,
  field: WebsiteProcessingDurationField,
  operation: () => Promise<T>,
) {
  const startedAt = performance.now();
  try {
    return await operation();
  } finally {
    const durationMs = recordDuration(metrics, field, startedAt);
    metrics.db_ms = (metrics.db_ms ?? 0) + durationMs;
  }
}

export function recordDuration(
  metrics: WebsiteBookmarkProcessingMetrics,
  field: WebsiteProcessingDurationField,
  startedAt: number,
) {
  const durationMs = Math.round(performance.now() - startedAt);
  addDurationMetric(metrics, field, durationMs);
  return durationMs;
}

function addDurationMetric(
  metrics: WebsiteBookmarkProcessingMetrics,
  field: WebsiteProcessingDurationField,
  durationMs: number,
) {
  switch (field) {
    case "bookmark_select_db_ms":
      metrics.bookmark_select_db_ms = (metrics.bookmark_select_db_ms ?? 0) + durationMs;
      return;
    case "website_record_select_db_ms":
      metrics.website_record_select_db_ms = (metrics.website_record_select_db_ms ?? 0) + durationMs;
      return;
    case "db_ms":
      metrics.db_ms = (metrics.db_ms ?? 0) + durationMs;
      return;
    case "html_fetch_ms":
      metrics.html_fetch_ms = (metrics.html_fetch_ms ?? 0) + durationMs;
      return;
    case "html_extract_ms":
      metrics.html_extract_ms = (metrics.html_extract_ms ?? 0) + durationMs;
      return;
    case "text_metadata_db_ready_ms":
      metrics.text_metadata_db_ready_ms = durationMs;
      return;
    case "r2_exists_ms":
      metrics.r2_exists_ms = (metrics.r2_exists_ms ?? 0) + durationMs;
      return;
    case "favicon_ms":
      metrics.favicon_ms = (metrics.favicon_ms ?? 0) + durationMs;
      return;
    case "og_ms":
      metrics.og_ms = (metrics.og_ms ?? 0) + durationMs;
      return;
    case "preview_ms":
      metrics.preview_ms = (metrics.preview_ms ?? 0) + durationMs;
      return;
    case "bookmark_update_db_ms":
      metrics.bookmark_update_db_ms = (metrics.bookmark_update_db_ms ?? 0) + durationMs;
      return;
    case "website_record_upsert_db_ms":
      metrics.website_record_upsert_db_ms = (metrics.website_record_upsert_db_ms ?? 0) + durationMs;
  }
}

export function setAssetMetrics(
  metrics: WebsiteBookmarkProcessingMetrics,
  assetResults: WebsiteAssetProcessingResult[],
) {
  const favicon = assetResults.find((assetResult) => assetResult.label === "favicon");
  if (favicon) {
    metrics.favicon_ms = favicon.durationMs ?? 0;
    metrics.favicon_status = favicon.status;
  }

  const og = assetResults.find((assetResult) => assetResult.label === "og");
  if (og) {
    metrics.og_ms = og.durationMs ?? 0;
    metrics.og_status = og.status;
  }

  const preview = assetResults.find((assetResult) => assetResult.label === "preview");
  if (preview) {
    metrics.preview_ms = preview.durationMs ?? 0;
    metrics.preview_status = preview.status;
    metrics.preview_provider = preview.previewProvider;
  }
}

export async function trackWebsiteProcessingCompleted({
  durationMs,
  qstashVerifyMs,
  metrics,
  success,
  errorCode,
}: {
  durationMs: number;
  qstashVerifyMs: number;
  metrics: WebsiteBookmarkProcessingMetrics;
  success: boolean;
  errorCode: string;
}) {
  await trackServerEvent("bookmark_processing_completed", {
    kind: "website",
    job_type: "process_website_bookmark",
    duration_ms: durationMs,
    success: success ? "true" : "false",
    error_code: errorCode,
    qstash_verify_ms: qstashVerifyMs,
    ...metrics,
  });
}
