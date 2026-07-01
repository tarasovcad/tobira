import {and, eq, isNull, sql} from "drizzle-orm";
import {db} from "@/db";
import {
  bookmarks,
  websiteRecords,
  type WebsiteImageAsset,
  type WebsiteImages,
  type WebsiteRecordImages,
  type WebsiteRecordStatus,
} from "@/db/schema";
import {hashUrlToKey} from "@/lib/utils/hash";
import {toWebsiteImageAsset, type WebsiteAssetProcessingResult} from "./processing-results";

export type WebsiteRecord = typeof websiteRecords.$inferSelect;

type WebsiteRecordFreshness = {
  fresh: boolean;
  htmlFresh: boolean;
  previewFresh: boolean;
};

const DEFAULT_REFRESH_DAYS = 90;
const FAILED_REFRESH_DAYS = 10;

export async function getWebsiteRecordKey(normalizedUrl: URL | string) {
  return hashUrlToKey(normalizedUrl.toString());
}

export async function getReusableWebsiteRecord(normalizedUrl: URL | string) {
  const key = await getWebsiteRecordKey(normalizedUrl);
  const [record] = await db
    .select()
    .from(websiteRecords)
    .where(eq(websiteRecords.key, key))
    .limit(1);

  const freshness = record
    ? getWebsiteRecordFreshness(record)
    : {fresh: false, htmlFresh: false, previewFresh: false};

  return {
    key,
    record: record && (freshness.htmlFresh || freshness.previewFresh) ? record : null,
    ...freshness,
  };
}

export function isWebsiteRecordFresh(record: WebsiteRecord, now = new Date()) {
  return getWebsiteRecordFreshness(record, now).fresh;
}

export function getWebsiteRecordFreshness(
  record: WebsiteRecord,
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

export function isWebsiteRecordHtmlFresh(record: WebsiteRecord, now = new Date()) {
  return isFutureTimestamp(record.htmlRefreshAfter, now);
}

export function isWebsiteRecordPreviewFresh(record: WebsiteRecord, now = new Date()) {
  return isFutureTimestamp(record.previewRefreshAfter, now);
}

export function buildBookmarkImagesFromWebsiteRecord(
  images: WebsiteRecordImages | null | undefined,
): WebsiteImages | undefined {
  if (!images) return undefined;

  return {
    ...images,
    selected: "preview",
  };
}

export function buildWebsiteRecordImagesFromAssetResults(
  assetResults: WebsiteAssetProcessingResult[],
): WebsiteRecordImages {
  return {
    favicon: toWebsiteImageAsset(assetResults, "favicon"),
    og: toWebsiteImageAsset(assetResults, "og"),
    preview: toWebsiteImageAsset(assetResults, "preview"),
  };
}

export async function upsertWebsiteRecord({
  key,
  normalizedUrl,
  hostname,
  title,
  description,
  images,
  htmlStatus,
  previewStatus,
}: {
  key: string;
  normalizedUrl: string;
  hostname: string;
  title: string | null;
  description: string | null;
  images: WebsiteRecordImages;
  htmlStatus: WebsiteRecordStatus;
  previewStatus: WebsiteRecordStatus;
}) {
  const now = new Date();
  const nowIso = now.toISOString();

  const [existingRecord] = await db
    .select({images: websiteRecords.images})
    .from(websiteRecords)
    .where(eq(websiteRecords.key, key))
    .limit(1);

  const existingImages = existingRecord?.images as WebsiteRecordImages | null | undefined;
  const mergedImages = mergeWebsiteRecordImages(existingImages, images);

  const resolvedHtmlStatus = pickBestStatus(htmlStatus, mergedImages.favicon ?? mergedImages.og);
  const resolvedPreviewStatus = pickBestStatus(previewStatus, mergedImages.preview);
  const previewRefreshStatus = previewStatus === "failed" ? previewStatus : resolvedPreviewStatus;

  const recordValues = {
    normalizedUrl,
    hostname,
    title,
    description,
    images: mergedImages,
    htmlStatus: resolvedHtmlStatus,
    previewStatus: resolvedPreviewStatus,
    htmlFetchedAt: nowIso,
    previewFetchedAt: nowIso,
    htmlRefreshAfter: addDays(now, refreshDaysForStatus(resolvedHtmlStatus)).toISOString(),
    previewRefreshAfter: addDays(now, refreshDaysForStatus(previewRefreshStatus)).toISOString(),
    updatedAt: nowIso,
  };

  const [record] = await db
    .insert(websiteRecords)
    .values({key, ...recordValues})
    .onConflictDoUpdate({
      target: websiteRecords.key,
      set: recordValues,
    })
    .returning();

  return record;
}

export function getWebsiteRecordPreviewStatus(
  assetResults: WebsiteAssetProcessingResult[],
): WebsiteRecordStatus {
  return assetResults.find((assetResult) => assetResult.label === "preview")?.status ?? "failed";
}

function mergeWebsiteRecordImages(
  existingImages: WebsiteRecordImages | null | undefined,
  incomingImages: WebsiteRecordImages,
): WebsiteRecordImages {
  if (!existingImages) return incomingImages;

  return {
    favicon: preserveReadyImageAsset(existingImages.favicon, incomingImages.favicon),
    og: preserveReadyImageAsset(existingImages.og, incomingImages.og),
    preview: preserveReadyImageAsset(existingImages.preview, incomingImages.preview),
  };
}

function preserveReadyImageAsset(
  existing: WebsiteImageAsset | undefined,
  incoming: WebsiteImageAsset | undefined,
): WebsiteImageAsset | undefined {
  if (existing?.status === "ready") {
    return incoming?.status === "ready" ? incoming : existing;
  }
  return incoming ?? existing;
}

function pickBestStatus(
  fetchStatus: WebsiteRecordStatus,
  mergedImage: WebsiteImageAsset | undefined,
): WebsiteRecordStatus {
  if (fetchStatus === "ready") return "ready";
  if (mergedImage?.status === "ready") return "ready";
  return fetchStatus;
}

export async function updateBookmarkFromWebsiteRecord(bookmarkId: string, record: WebsiteRecord) {
  const recordImagesJson = JSON.stringify(record.images ?? {});
  const defaultBookmarkImagesJson = JSON.stringify(
    buildBookmarkImagesFromWebsiteRecord(record.images) ?? {},
  );

  await db
    .update(bookmarks)
    .set({
      websiteRecordKey: record.key,
      title: sql`COALESCE(${bookmarks.title}, ${record.title ?? null})`,
      description: sql`COALESCE(${bookmarks.description}, ${record.description ?? null})`,
      images: sql`CASE
        WHEN ${bookmarks.images}->>'selected' IN ('preview', 'og')
          THEN jsonb_set(${recordImagesJson}::jsonb, '{selected}', to_jsonb(${bookmarks.images}->>'selected'), true)
        ELSE ${defaultBookmarkImagesJson}::jsonb
      END`,
      metadata: sql`jsonb_set(COALESCE(${bookmarks.metadata}, '{}'::jsonb), '{textMetadataStatus}', to_jsonb(${record.htmlStatus}::text), true)`,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(bookmarks.id, bookmarkId), eq(bookmarks.kind, "website"), isNull(bookmarks.deletedAt)),
    );
}

function refreshDaysForStatus(status: WebsiteRecordStatus) {
  return status === "failed" ? FAILED_REFRESH_DAYS : DEFAULT_REFRESH_DAYS;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function isFutureTimestamp(value: string, now: Date) {
  const time = Date.parse(value);
  return Number.isFinite(time) && time > now.getTime();
}
