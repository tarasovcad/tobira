import {eq, sql} from "drizzle-orm";
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

export async function upsertWebsiteRecordAndUpdateBookmark({
  bookmarkId,
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
  bookmarkId: string;
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
}): Promise<WebsiteRecord> {
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

  const insertHtmlStatus = pickBestHtmlStatus(htmlStatus, images);
  const insertHtmlRefreshStatus = getHtmlAssetPairStatus(images);
  const insertPreviewStatus = pickBestStatus(previewStatus, images.preview);
  const insertPreviewRefreshStatus =
    previewStatus === "failed" ? previewStatus : insertPreviewStatus;

  const {mergeAsset, htmlStatusSql, previewStatusSql, htmlRefreshAfterSql, previewRefreshAfterSql} =
    buildWebsiteRecordUpsertSql({htmlStatus, previewStatus, refreshAfterReady, refreshAfterFailed});

  const defaultBookmarkImagesJson = JSON.stringify(
    buildBookmarkImagesFromWebsiteRecord(images) ?? {},
  );

  const query = sql`
    WITH upserted_record AS (
      INSERT INTO ${websiteRecords} (
        "key", "normalized_url", "hostname", "title", "description", "images",
        "html_status", "preview_status", "html_fetched_at", "preview_fetched_at",
        "html_refresh_after", "preview_refresh_after", "updated_at"
      )
      VALUES (
        ${key}, ${normalizedUrl}, ${hostname}, ${title}, ${description}, ${JSON.stringify(images)}::jsonb,
        ${insertHtmlStatus}, ${insertPreviewStatus}, ${nowIso}::timestamptz, ${nowIso}::timestamptz,
        ${addDays(now, refreshDaysForStatus(insertHtmlRefreshStatus)).toISOString()}::timestamptz,
        ${addDays(now, refreshDaysForStatus(insertPreviewRefreshStatus)).toISOString()}::timestamptz,
        ${nowIso}::timestamptz
      )
      ON CONFLICT ("key") DO UPDATE SET
        "normalized_url" = EXCLUDED."normalized_url",
        "hostname" = EXCLUDED."hostname",
        "title" = EXCLUDED."title",
        "description" = EXCLUDED."description",
        "images" = jsonb_build_object(
          'favicon', ${mergeAsset("favicon")},
          'og', ${mergeAsset("og")},
          'preview', ${mergeAsset("preview")}
        ),
        "html_status" = ${htmlStatusSql},
        "preview_status" = ${previewStatusSql},
        "html_fetched_at" = ${conflictHtmlFetchedAt}::timestamptz,
        "preview_fetched_at" = ${conflictPreviewFetchedAt}::timestamptz,
        "html_refresh_after" = ${htmlRefreshAfterSql},
        "preview_refresh_after" = ${previewRefreshAfterSql},
        "updated_at" = ${nowIso}::timestamptz
      RETURNING *
    ),
    updated_bookmark AS (
      UPDATE ${bookmarks}
      SET
        "website_record_key" = upserted_record.key,
        "title" = COALESCE(${bookmarks.title}, upserted_record.title),
        "description" = COALESCE(${bookmarks.description}, upserted_record.description),
        "images" = CASE
          WHEN ${bookmarks.images}->>'selected' IN ('preview', 'og')
            THEN jsonb_set(upserted_record.images, '{selected}', to_jsonb(${bookmarks.images}->>'selected'), true)
          ELSE ${defaultBookmarkImagesJson}::jsonb
        END,
        "metadata" = jsonb_set(COALESCE(${bookmarks.metadata}, '{}'::jsonb), '{textMetadataStatus}', to_jsonb(upserted_record.html_status::text), true),
        "updated_at" = ${nowIso}::timestamptz
      FROM upserted_record
      WHERE ${bookmarks.id} = ${bookmarkId}
        AND ${bookmarks.kind} = 'website'
        AND ${bookmarks.deletedAt} IS NULL
    )
    SELECT
      key,
      normalized_url AS "normalizedUrl",
      hostname,
      title,
      description,
      images,
      html_status AS "htmlStatus",
      preview_status AS "previewStatus",
      html_fetched_at AS "htmlFetchedAt",
      preview_fetched_at AS "previewFetchedAt",
      html_refresh_after AS "htmlRefreshAfter",
      preview_refresh_after AS "previewRefreshAfter",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM upserted_record;
  `;

  const result = await db.execute<WebsiteRecord>(query);
  const record = result.rows[0];
  if (!record) {
    throw new Error(`Failed to upsert website record and update bookmark ${bookmarkId}`);
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
