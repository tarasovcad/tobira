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
import type {WebsiteAssetLabel, WebsiteAssetProcessingResult} from "./processing-results";

export type WebsiteRecord = typeof websiteRecords.$inferSelect;

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

  return {
    key,
    record: record && isWebsiteRecordFresh(record) ? record : null,
  };
}

export function isWebsiteRecordFresh(record: WebsiteRecord, now = new Date()) {
  return isWebsiteRecordHtmlFresh(record, now) && isWebsiteRecordPreviewFresh(record, now);
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
    favicon: buildWebsiteImageAsset(assetResults, "favicon"),
    og: buildWebsiteImageAsset(assetResults, "og"),
    preview: buildWebsiteImageAsset(assetResults, "preview"),
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
  const recordValues = {
    normalizedUrl,
    hostname,
    title,
    description,
    images,
    htmlStatus,
    previewStatus,
    htmlFetchedAt: nowIso,
    previewFetchedAt: nowIso,
    htmlRefreshAfter: addDays(now, refreshDaysForStatus(htmlStatus)).toISOString(),
    previewRefreshAfter: addDays(now, refreshDaysForStatus(previewStatus)).toISOString(),
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

function buildWebsiteImageAsset(
  assetResults: WebsiteAssetProcessingResult[],
  label: WebsiteAssetLabel,
): WebsiteImageAsset {
  const result = assetResults.find((assetResult) => assetResult.label === label);
  if (!result) return {status: "failed"};

  if (result.status !== "ready") {
    return {
      status: result.status,
      ...(result.key !== undefined ? {key: result.key} : {}),
      ...(result.width !== undefined ? {width: result.width} : {}),
      ...(result.height !== undefined ? {height: result.height} : {}),
    };
  }

  if (!result.key) return {status: "failed"};

  return {
    status: "ready",
    key: result.key,
    ...(result.width !== undefined ? {width: result.width} : {}),
    ...(result.height !== undefined ? {height: result.height} : {}),
  };
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
