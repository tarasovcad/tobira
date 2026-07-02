import {sql} from "drizzle-orm";
import {websiteRecords, type WebsiteRecordStatus} from "@/db/schema";

export function buildWebsiteRecordUpsertSql({
  htmlStatus,
  previewStatus,
  refreshAfterReady,
  refreshAfterFailed,
}: {
  htmlStatus: WebsiteRecordStatus;
  previewStatus: WebsiteRecordStatus;
  refreshAfterReady: string;
  refreshAfterFailed: string;
}) {
  const mergeAsset = (field: "favicon" | "og" | "preview") => {
    const f = sql.raw(`'${field}'`);
    return sql`CASE
    WHEN ${websiteRecords.images}->${f}->>'status' = 'ready'
     AND EXCLUDED.images->${f}->>'status' = 'ready'
      THEN EXCLUDED.images->${f}
    WHEN ${websiteRecords.images}->${f}->>'status' = 'ready'
      THEN ${websiteRecords.images}->${f}
    ELSE COALESCE(EXCLUDED.images->${f}, ${websiteRecords.images}->${f})
  END`;
  };

  const mergedAssetReady = (field: "favicon" | "og" | "preview") => {
    const f = sql.raw(`'${field}'`);
    return sql`(
      ${websiteRecords.images}->${f}->>'status' = 'ready'
      OR EXCLUDED.images->${f}->>'status' = 'ready'
    )`;
  };

  const htmlAssetsReadySql = sql`${mergedAssetReady("favicon")} AND ${mergedAssetReady("og")}`;

  // Implements pickBestHtmlStatus(htmlStatus, mergedImages).
  const htmlStatusSql = sql`CASE
    WHEN ${htmlStatus} = 'ready' THEN 'ready'
    WHEN ${htmlAssetsReadySql} THEN 'ready'
    ELSE ${htmlStatus}
  END`;

  // Implements pickBestStatus(previewStatus, mergedPreview).
  const previewStatusSql = sql`CASE
    WHEN ${previewStatus} = 'ready' THEN 'ready'
    WHEN ${websiteRecords.images}->'preview'->>'status' = 'ready' THEN 'ready'
    WHEN EXCLUDED.images->'preview'->>'status' = 'ready' THEN 'ready'
    ELSE ${previewStatus}
  END`;

  // 90 days when both merged HTML-side assets are ready, 10 days otherwise.
  // ::timestamptz cast is required because Postgres infers CASE branches that hold
  // a $N parameter as type `text`, which it refuses to assign to a timestamptz
  // column without an explicit cast.
  const htmlRefreshAfterSql = sql`CASE
    WHEN ${htmlAssetsReadySql} THEN ${refreshAfterReady}::timestamptz
    ELSE ${refreshAfterFailed}::timestamptz
  END`;

  // previewRefreshStatus = previewStatus === 'failed' ? 'failed' : resolvedPreviewStatus.
  const previewRefreshAfterSql = sql`CASE
    WHEN ${previewStatus} = 'failed' THEN ${refreshAfterFailed}::timestamptz
    WHEN ${previewStatus} = 'ready' THEN ${refreshAfterReady}::timestamptz
    WHEN ${websiteRecords.images}->'preview'->>'status' = 'ready' THEN ${refreshAfterReady}::timestamptz
    WHEN EXCLUDED.images->'preview'->>'status' = 'ready' THEN ${refreshAfterReady}::timestamptz
    ELSE ${refreshAfterFailed}::timestamptz
  END`;

  return {mergeAsset, htmlStatusSql, previewStatusSql, htmlRefreshAfterSql, previewRefreshAfterSql};
}
