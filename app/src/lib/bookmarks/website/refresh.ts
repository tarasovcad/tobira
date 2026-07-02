import type {
  WebsiteImageAsset,
  WebsiteImages,
  WebsiteRecordImages,
  WebsiteRecordStatus,
} from "@/db/schema";
import {
  toWebsiteImageAsset,
  type WebsiteAssetLabel,
  type WebsiteAssetProcessingResult,
} from "./processing-results";

export const DEFAULT_REFRESH_DAYS = 90;
export const FAILED_REFRESH_DAYS = 10;

export type WebsiteRecordFreshness = {
  fresh: boolean;
  htmlFresh: boolean;
  previewFresh: boolean;
};

export type WebsiteRecordRefreshSource = {
  htmlRefreshAfter: string;
  previewRefreshAfter: string;
  htmlFetchedAt: string;
  previewFetchedAt: string;
  images?: WebsiteRecordImages | null;
};

export type WebsiteHtmlRefreshPlan = {
  shouldRefresh: boolean;
};

export type WebsitePreviewRefreshPlan = {
  shouldRefresh: boolean;
};

export type WebsiteRecordRefreshPlans = {
  html: WebsiteHtmlRefreshPlan;
  preview: WebsitePreviewRefreshPlan;
};

export type WebsiteAssetR2Exists = {
  favicon: boolean;
  og: boolean;
  preview: boolean;
};

export type WebsiteRecordRefreshOutcome = {
  images: WebsiteRecordImages;
  htmlRefreshed: boolean;
  previewRefreshed: boolean;
};

const HTML_ASSET_LABELS = ["favicon", "og"] as const;

function isFutureTimestamp(value: string, now: Date) {
  const time = Date.parse(value);
  return Number.isFinite(time) && time > now.getTime();
}

export function isWebsiteRecordHtmlFresh(record: WebsiteRecordRefreshSource, now = new Date()) {
  return isFutureTimestamp(record.htmlRefreshAfter, now);
}

export function isWebsiteRecordPreviewFresh(record: WebsiteRecordRefreshSource, now = new Date()) {
  return isFutureTimestamp(record.previewRefreshAfter, now);
}

export function getWebsiteRecordFreshness(
  record: WebsiteRecordRefreshSource,
  now = new Date(),
): WebsiteRecordFreshness {
  const htmlFresh = isWebsiteRecordHtmlFresh(record, now);
  const previewFresh = isWebsiteRecordPreviewFresh(record, now);

  return {
    fresh: htmlFresh && previewFresh,
    htmlFresh,
    previewFresh,
  };
}

export function isWebsiteRecordFresh(record: WebsiteRecordRefreshSource, now = new Date()) {
  return getWebsiteRecordFreshness(record, now).fresh;
}

export function getWebsiteHtmlRefreshPlan(
  record: WebsiteRecordRefreshSource | null,
): WebsiteHtmlRefreshPlan {
  return {
    shouldRefresh: !record || !isWebsiteRecordHtmlFresh(record),
  };
}

export function getWebsitePreviewRefreshPlan(
  record: WebsiteRecordRefreshSource | null,
): WebsitePreviewRefreshPlan {
  return {
    shouldRefresh: !record || !isWebsiteRecordPreviewFresh(record),
  };
}

export function getWebsiteRecordRefreshPlans(
  record: WebsiteRecordRefreshSource | null,
): WebsiteRecordRefreshPlans {
  return {
    html: getWebsiteHtmlRefreshPlan(record),
    preview: getWebsitePreviewRefreshPlan(record),
  };
}

export function getWebsiteAssetR2Exists(
  plans: WebsiteRecordRefreshPlans,
  r2Exists: WebsiteAssetR2Exists,
): WebsiteAssetR2Exists {
  return {
    favicon: plans.html.shouldRefresh ? false : r2Exists.favicon,
    og: plans.html.shouldRefresh ? false : r2Exists.og,
    preview: plans.preview.shouldRefresh ? false : r2Exists.preview,
  };
}

export function wasWebsiteAssetRefreshed(
  assetResults: WebsiteAssetProcessingResult[],
  label: WebsiteAssetLabel,
): boolean {
  const result = findWebsiteAssetResult(assetResults, label);
  return result?.status === "ready" && result.reusedExisting !== true;
}

export function wasWebsiteHtmlSideRefreshed(assetResults: WebsiteAssetProcessingResult[]) {
  return HTML_ASSET_LABELS.some((label) => wasWebsiteAssetRefreshed(assetResults, label));
}

function findWebsiteAssetResult(
  assetResults: WebsiteAssetProcessingResult[],
  label: WebsiteAssetLabel,
) {
  return assetResults.find((assetResult) => assetResult.label === label);
}

function getExistingAssetFetchedAt(
  existingRecord: WebsiteRecordRefreshSource | null | undefined,
  label: WebsiteAssetLabel,
) {
  if (label === "preview") {
    return {
      assetFetchedAt: existingRecord?.images?.preview?.fetchedAt,
      recordFetchedAt: existingRecord?.previewFetchedAt,
    };
  }

  const assetFetchedAt =
    label === "favicon"
      ? existingRecord?.images?.favicon?.fetchedAt
      : existingRecord?.images?.og?.fetchedAt;

  return {
    assetFetchedAt,
    recordFetchedAt: existingRecord?.htmlFetchedAt,
  };
}

function resolveReadyAssetFetchedAt({
  assetResult,
  nowIso,
  existingFetchedAt,
}: {
  assetResult: WebsiteAssetProcessingResult | undefined;
  nowIso: string;
  existingFetchedAt: {
    assetFetchedAt?: string;
    recordFetchedAt?: string;
  };
}): string | undefined {
  if (assetResult?.status !== "ready") return undefined;
  if (assetResult.reusedExisting) {
    return existingFetchedAt.assetFetchedAt ?? existingFetchedAt.recordFetchedAt ?? undefined;
  }

  return nowIso;
}

function buildWebsiteRecordImageAsset({
  assetResults,
  label,
  nowIso,
  existingRecord,
}: {
  assetResults: WebsiteAssetProcessingResult[];
  label: WebsiteAssetLabel;
  nowIso: string;
  existingRecord?: WebsiteRecordRefreshSource | null;
}) {
  const assetResult = findWebsiteAssetResult(assetResults, label);
  const fetchedAt = resolveReadyAssetFetchedAt({
    assetResult,
    nowIso,
    existingFetchedAt: getExistingAssetFetchedAt(existingRecord, label),
  });

  return toWebsiteImageAsset(assetResults, label, fetchedAt);
}

export function buildWebsiteRecordImagesFromAssetResults({
  assetResults,
  nowIso,
  existingRecord,
}: {
  assetResults: WebsiteAssetProcessingResult[];
  nowIso: string;
  existingRecord?: WebsiteRecordRefreshSource | null;
}): WebsiteRecordImages {
  return {
    favicon: buildWebsiteRecordImageAsset({assetResults, label: "favicon", nowIso, existingRecord}),
    og: buildWebsiteRecordImageAsset({assetResults, label: "og", nowIso, existingRecord}),
    preview: buildWebsiteRecordImageAsset({assetResults, label: "preview", nowIso, existingRecord}),
  };
}

export function buildWebsiteRecordRefreshOutcome({
  assetResults,
  nowIso,
  existingRecord,
}: {
  assetResults: WebsiteAssetProcessingResult[];
  nowIso: string;
  existingRecord?: WebsiteRecordRefreshSource | null;
}): WebsiteRecordRefreshOutcome {
  return {
    images: buildWebsiteRecordImagesFromAssetResults({assetResults, nowIso, existingRecord}),
    htmlRefreshed: wasWebsiteHtmlSideRefreshed(assetResults),
    previewRefreshed: wasWebsiteAssetRefreshed(assetResults, "preview"),
  };
}

export function buildBookmarkImagesFromWebsiteRecord(
  images: WebsiteRecordImages | null | undefined,
  options?: {previewFresh?: boolean; htmlFresh?: boolean},
): WebsiteImages | undefined {
  if (!images) return undefined;

  const previewFresh = options?.previewFresh ?? true;
  const htmlFresh = options?.htmlFresh ?? true;

  return {
    ...images,
    favicon: markWebsiteAssetPendingWhenStale(images.favicon, htmlFresh),
    og: markWebsiteAssetPendingWhenStale(images.og, htmlFresh),
    preview: markWebsiteAssetPendingWhenStale(images.preview, previewFresh),
    selected: "preview",
  };
}

function markWebsiteAssetPendingWhenStale(
  asset: WebsiteImageAsset | undefined,
  fresh: boolean,
): WebsiteImageAsset | undefined {
  return asset && !fresh ? {...asset, status: "pending"} : asset;
}

export function resolveWebsiteRecordConflictFetchedAt({
  existingRecord,
  nowIso,
  htmlRefreshed,
  previewRefreshed,
}: {
  existingRecord?: WebsiteRecordRefreshSource | null;
  nowIso: string;
  htmlRefreshed: boolean;
  previewRefreshed: boolean;
}) {
  return {
    htmlFetchedAt: existingRecord && !htmlRefreshed ? existingRecord.htmlFetchedAt : nowIso,
    previewFetchedAt:
      existingRecord && !previewRefreshed ? existingRecord.previewFetchedAt : nowIso,
  };
}

export function refreshDaysForStatus(status: WebsiteRecordStatus) {
  return status === "failed" ? FAILED_REFRESH_DAYS : DEFAULT_REFRESH_DAYS;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
