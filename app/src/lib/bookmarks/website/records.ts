import {and, eq, isNull, sql} from "drizzle-orm";
import {db} from "@/db";
import {
  bookmarks,
  websiteRecords,
  type WebsiteImageAsset,
  type WebsiteRecordImages,
  type WebsiteRecordStatus,
} from "@/db/schema";
import {hashUrlToKey} from "@/lib/utils/hash";
import {type WebsiteAssetProcessingResult} from "./processing-results";
import {
  addDays,
  buildBookmarkImagesFromWebsiteRecord,
  getWebsiteRecordFreshness,
  refreshDaysForStatus,
  resolveWebsiteRecordConflictFetchedAt,
} from "./refresh";
import {buildWebsiteRecordUpsertSql} from "./upsert-sql";

export type WebsiteRecord = typeof websiteRecords.$inferSelect;

export {
  buildBookmarkImagesFromWebsiteRecord,
  buildWebsiteRecordImagesFromAssetResults,
  getWebsiteHtmlRefreshPlan,
  getWebsitePreviewRefreshPlan,
  getWebsiteRecordFreshness,
  getWebsiteRecordRefreshPlans,
  isWebsiteRecordFresh,
  isWebsiteRecordHtmlFresh,
  isWebsiteRecordPreviewFresh,
} from "./refresh";

export async function getWebsiteRecordKey(normalizedUrl: URL | string) {
  return hashUrlToKey(normalizedUrl.toString());
}

export async function getWebsiteRecordByKey(key: string): Promise<WebsiteRecord | null> {
  const [record] = await db
    .select()
    .from(websiteRecords)
    .where(eq(websiteRecords.key, key))
    .limit(1);

  return record ?? null;
}

export async function getReusableWebsiteRecord(normalizedUrl: URL | string) {
  const key = await getWebsiteRecordKey(normalizedUrl);
  const record = await getWebsiteRecordByKey(key);

  const freshness = record
    ? getWebsiteRecordFreshness(record)
    : {fresh: false, htmlFresh: false, previewFresh: false};

  return {
    key,
    record: record && (freshness.htmlFresh || freshness.previewFresh) ? record : null,
    ...freshness,
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
  existingRecord,
  htmlRefreshed,
  previewRefreshed,
}: {
  key: string;
  normalizedUrl: string;
  hostname: string;
  title: string | null;
  description: string | null;
  images: WebsiteRecordImages;
  htmlStatus: WebsiteRecordStatus;
  previewStatus: WebsiteRecordStatus;
  existingRecord?: WebsiteRecord | null;
  htmlRefreshed: boolean;
  previewRefreshed: boolean;
}) {
  const now = new Date();
  const nowIso = now.toISOString();
  const refreshAfterReady = addDays(now, refreshDaysForStatus("ready")).toISOString();
  const refreshAfterFailed = addDays(now, refreshDaysForStatus("failed")).toISOString();
  const {htmlFetchedAt: conflictHtmlFetchedAt, previewFetchedAt: conflictPreviewFetchedAt} =
    resolveWebsiteRecordConflictFetchedAt({
      existingRecord,
      nowIso,
      htmlRefreshed,
      previewRefreshed,
    });

  // INSERT path (no existing record): compute statuses from the incoming images alone.
  const insertHtmlStatus = pickBestHtmlStatus(htmlStatus, images);
  const insertHtmlRefreshStatus = getHtmlAssetPairStatus(images);
  const insertPreviewStatus = pickBestStatus(previewStatus, images.preview);
  const insertPreviewRefreshStatus =
    previewStatus === "failed" ? previewStatus : insertPreviewStatus;

  const {mergeAsset, htmlStatusSql, previewStatusSql, htmlRefreshAfterSql, previewRefreshAfterSql} =
    buildWebsiteRecordUpsertSql({htmlStatus, previewStatus, refreshAfterReady, refreshAfterFailed});

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
      htmlRefreshAfter: addDays(now, refreshDaysForStatus(insertHtmlRefreshStatus)).toISOString(),
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
        htmlFetchedAt: conflictHtmlFetchedAt,
        previewFetchedAt: conflictPreviewFetchedAt,
        htmlRefreshAfter: htmlRefreshAfterSql,
        previewRefreshAfter: previewRefreshAfterSql,
        updatedAt: nowIso,
      },
    })
    .returning();

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

function pickBestHtmlStatus(
  fetchStatus: WebsiteRecordStatus,
  images: WebsiteRecordImages,
): WebsiteRecordStatus {
  if (fetchStatus === "ready") return "ready";
  return getHtmlAssetPairStatus(images) === "ready" ? "ready" : fetchStatus;
}

function getHtmlAssetPairStatus(images: WebsiteRecordImages): WebsiteRecordStatus {
  return images.favicon?.status === "ready" && images.og?.status === "ready" ? "ready" : "missing";
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
