import {and, eq, isNull} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks, type WebsiteImageAsset} from "@/db/schema";
import {buildWebsiteImageKeys} from "@/features/media/utils";
import {
  extractUrlMetadataFromHtmlPage,
  fetchWebsiteHtmlPage,
  type WebsiteHtmlPage,
} from "@/lib/bookmarks/metadata";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import {isWebsiteUrl} from "@/lib/fetch/web/website-url";
import {logger, toLogError} from "@/lib/shared/logger";
import {processWebsiteAssets, type WebsiteImageKeys} from "./assets";
import {collectWebsiteAssetFailures} from "./processing-results";
import {
  measureDb,
  measureDuration,
  recordDuration,
  setAssetMetrics,
  type WebsiteBookmarkProcessingMetrics,
} from "./metrics";
import {
  markWebsiteEnrichmentFailed,
  updateWebsiteImageStatuses,
  updateWebsiteTextMetadata,
} from "./status-updates";
import {
  buildWebsiteRecordRefreshOutcome,
  getWebsiteRecordRefreshPlans,
  type WebsiteRecordRefreshPlans,
} from "./refresh";
import {
  getWebsiteRecordByKey,
  getWebsiteRecordKey,
  getWebsiteRecordPreviewStatus,
  type WebsiteRecord,
  upsertWebsiteRecordAndUpdateBookmark,
} from "./records";

type WebsiteBookmarkProcessingInfo = {
  id: string;
  url: string;
};

export type PreparedWebsiteBookmarkProcessingInfo = {
  id: string;
  url: string;
  normalizedUrl: string;
  websiteRecordKey: string;
  imageKeys: WebsiteImageKeys;
  existingRecord: WebsiteRecord | null;
};

export async function processWebsiteBookmark(
  bookmarkId: string,
  metrics: WebsiteBookmarkProcessingMetrics,
  jobStartedAt: number,
) {
  const bookmark = await measureDb(metrics, "bookmark_select_db_ms", () =>
    getWebsiteBookmarkProcessingInfo(bookmarkId),
  );
  if (!bookmark) return;

  const normalizedUrl = normalizeInputUrl(bookmark.url).toString();
  const websiteRecordKey = await getWebsiteRecordKey(normalizedUrl);

  const keysPromise = buildWebsiteImageKeys(normalizedUrl);
  const existingRecordPromise = measureDb(metrics, "website_record_select_db_ms", () =>
    getWebsiteRecordByKey(websiteRecordKey),
  );

  const [imageKeys, existingRecord] = await Promise.all([keysPromise, existingRecordPromise]);

  const prepared: PreparedWebsiteBookmarkProcessingInfo = {
    id: bookmark.id,
    url: bookmark.url,
    normalizedUrl,
    websiteRecordKey,
    imageKeys,
    existingRecord,
  };

  await processPreparedWebsiteBookmark(prepared, metrics, jobStartedAt);
}

export async function processPreparedWebsiteBookmark(
  prepared: PreparedWebsiteBookmarkProcessingInfo,
  metrics: WebsiteBookmarkProcessingMetrics,
  jobStartedAt: number,
) {
  const {id, normalizedUrl, websiteRecordKey, imageKeys: keys, existingRecord} = prepared;

  metrics.url_host = new URL(normalizedUrl).hostname;

  const websiteUrl = isWebsiteUrl(normalizedUrl);
  if (!websiteUrl) return;

  let page: WebsiteHtmlPage;

  try {
    page = await measureDuration(metrics, "html_fetch_ms", () =>
      fetchWebsiteHtmlPage(normalizedUrl),
    );
    metrics.website_protected = page.websiteProtected ? "true" : "false";
  } catch (error) {
    metrics.html_status = "failed";
    metrics.favicon_status = "failed";
    metrics.og_status = "failed";
    metrics.preview_status = "failed";
    await measureDb(metrics, "bookmark_update_db_ms", () =>
      markWebsiteEnrichmentFailed(id, normalizedUrl, error, keys),
    );
    throw error;
  }

  const htmlExtractStartedAt = performance.now();
  const metadataResult = extractUrlMetadataFromHtmlPage(page);
  recordDuration(metrics, "html_extract_ms", htmlExtractStartedAt);
  const htmlStatus = metadataResult.title || metadataResult.description ? "ready" : "missing";
  metrics.html_status = htmlStatus;

  const bookmarkUpdated = await measureDb(metrics, "bookmark_update_db_ms", () =>
    updateWebsiteTextMetadata(id, {
      title: metadataResult.title ?? null,
      description: metadataResult.description ?? null,
      status: htmlStatus,
    }),
  );
  if (!bookmarkUpdated) return;
  metrics.text_metadata_db_ready_ms = Math.round(performance.now() - jobStartedAt);

  const refreshPlans = getWebsiteRecordRefreshPlans(existingRecord);

  const assetResults = await processWebsiteAssets({
    normalizedUrl,
    page,
    keys,
    alreadyExists: getReusableWebsiteAssets(existingRecord, refreshPlans, keys),
  });
  setAssetMetrics(metrics, assetResults);

  const nowIso = new Date().toISOString();
  const {images, htmlRefreshed, previewRefreshed} = buildWebsiteRecordRefreshOutcome({
    assetResults,
    nowIso,
    existingRecord,
  });
  const previewStatus = getWebsiteRecordPreviewStatus(assetResults);

  try {
    await measureDb(metrics, "website_record_upsert_db_ms", () =>
      upsertWebsiteRecordAndUpdateBookmark({
        bookmarkId: id,
        key: websiteRecordKey,
        normalizedUrl,
        hostname: new URL(normalizedUrl).hostname,
        title: metadataResult.title ?? null,
        description: metadataResult.description ?? null,
        images,
        htmlStatus,
        previewStatus,
        existingRecord,
        htmlRefreshed,
        previewRefreshed,
      }),
    );
  } catch (upsertError) {
    await measureDb(metrics, "bookmark_update_db_ms", () =>
      updateWebsiteImageStatuses(id, assetResults).catch(() => {}),
    );
    throw upsertError;
  }

  const failures = collectWebsiteAssetFailures(assetResults);
  if (failures.length === 0) return;

  logger.warn("Website enrichment completed with asset failures", {
    bookmarkId: id,
    url: normalizedUrl,
    failures: failures.map((failure) => ({
      label: failure.label,
      reason: toLogError(failure.reason),
    })),
  });
}

async function getWebsiteBookmarkProcessingInfo(
  bookmarkId: string,
): Promise<WebsiteBookmarkProcessingInfo | null> {
  const [bookmark] = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      kind: bookmarks.kind,
    })
    .from(bookmarks)
    .where(
      and(eq(bookmarks.id, bookmarkId), eq(bookmarks.kind, "website"), isNull(bookmarks.deletedAt)),
    )
    .limit(1);

  if (!bookmark) return null;
  return {id: bookmark.id, url: bookmark.url};
}

function getReusableWebsiteAssets(
  existingRecord: WebsiteRecord | null,
  refreshPlans: WebsiteRecordRefreshPlans,
  keys: WebsiteImageKeys,
) {
  return {
    favicon:
      !refreshPlans.html.shouldRefresh &&
      isReusableWebsiteAsset(existingRecord?.images?.favicon, keys.favicon),
    og:
      !refreshPlans.html.shouldRefresh &&
      isReusableWebsiteAsset(existingRecord?.images?.og, keys.og),
    preview:
      !refreshPlans.preview.shouldRefresh &&
      isReusableWebsiteAsset(existingRecord?.images?.preview, keys.preview),
  };
}

function isReusableWebsiteAsset(asset: WebsiteImageAsset | undefined, expectedKey: string) {
  return asset?.status === "ready" && asset.key === expectedKey;
}
