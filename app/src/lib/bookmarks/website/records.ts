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
import {buildWebsiteRecordUpsertSql} from "./upsert-sql";

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
  timingsMs,
}: {
  key: string;
  normalizedUrl: string;
  hostname: string;
  title: string | null;
  description: string | null;
  images: WebsiteRecordImages;
  htmlStatus: WebsiteRecordStatus;
  previewStatus: WebsiteRecordStatus;
  timingsMs?: Record<string, number>;
}) {
  const now = new Date();
  const nowIso = now.toISOString();
  const refreshAfterReady = addDays(now, DEFAULT_REFRESH_DAYS).toISOString();
  const refreshAfterFailed = addDays(now, FAILED_REFRESH_DAYS).toISOString();

  // INSERT path (no existing record): compute statuses from the incoming images alone.
  const insertHtmlStatus = pickBestStatus(htmlStatus, images.favicon ?? images.og);
  const insertPreviewStatus = pickBestStatus(previewStatus, images.preview);
  const insertPreviewRefreshStatus =
    previewStatus === "failed" ? previewStatus : insertPreviewStatus;

  const {mergeAsset, htmlStatusSql, previewStatusSql, htmlRefreshAfterSql, previewRefreshAfterSql} =
    buildWebsiteRecordUpsertSql({htmlStatus, previewStatus, refreshAfterReady, refreshAfterFailed});

  const upsertStartedAt = performance.now();
  const [record] = await db
    .insert(websiteRecords)
    .values({
      key,
      normalizedUrl,
      hostname,
      title,
      description,
      images,
      htmlStatus: insertHtmlStatus,
      previewStatus: insertPreviewStatus,
      htmlFetchedAt: nowIso,
      previewFetchedAt: nowIso,
      htmlRefreshAfter: addDays(now, refreshDaysForStatus(insertHtmlStatus)).toISOString(),
      previewRefreshAfter: addDays(
        now,
        refreshDaysForStatus(insertPreviewRefreshStatus),
      ).toISOString(),
      updatedAt: nowIso,
    })
    .onConflictDoUpdate({
      target: websiteRecords.key,
      set: {
        normalizedUrl,
        hostname,
        title,
        description,
        images: sql`jsonb_build_object(
          'favicon', ${mergeAsset("favicon")},
          'og', ${mergeAsset("og")},
          'preview', ${mergeAsset("preview")}
        )`,
        htmlStatus: htmlStatusSql,
        previewStatus: previewStatusSql,
        htmlFetchedAt: nowIso,
        previewFetchedAt: nowIso,
        htmlRefreshAfter: htmlRefreshAfterSql,
        previewRefreshAfter: previewRefreshAfterSql,
        updatedAt: nowIso,
      },
    })
    .returning();
  if (timingsMs) {
    timingsMs["upsertWebsiteRecord"] = elapsedMs(upsertStartedAt);
  }

  return record;
}

export function getWebsiteRecordPreviewStatus(
  assetResults: WebsiteAssetProcessingResult[],
): WebsiteRecordStatus {
  return assetResults.find((assetResult) => assetResult.label === "preview")?.status ?? "failed";
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

function elapsedMs(startedAt: number) {
  return Number((performance.now() - startedAt).toFixed(2));
}
