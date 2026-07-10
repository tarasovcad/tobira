import {and, eq, isNull} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {buildWebsiteImageKeys} from "@/features/media/utils";
import {
  extractUrlMetadataFromHtmlPage,
  fetchWebsiteHtmlPage,
  type WebsiteHtmlPage,
} from "@/lib/bookmarks/metadata";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import {isWebsiteUrl} from "@/lib/fetch/web/website-url";
import {logger, toLogError} from "@/lib/shared/logger";
import {existsInR2} from "@/lib/storage/r2-storage";
import {processWebsiteAssets} from "./assets";
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
  getWebsiteAssetR2Exists,
  getWebsiteRecordRefreshPlans,
} from "./refresh";
import {
  getWebsiteRecordByKey,
  getWebsiteRecordKey,
  getWebsiteRecordPreviewStatus,
  updateBookmarkFromWebsiteRecord,
  upsertWebsiteRecord,
} from "./records";

type WebsiteBookmarkProcessingInfo = {
  id: string;
  url: string;
};

export async function processWebsiteBookmark(
  bookmarkId: string,
  metrics: WebsiteBookmarkProcessingMetrics = {},
) {
  const bookmark = await measureDb(metrics, "bookmark_select_db_ms", () =>
    getWebsiteBookmarkProcessingInfo(bookmarkId),
  );
  if (!bookmark) return;

  const normalizedUrl = normalizeInputUrl(bookmark.url).toString();
  metrics.url_host = new URL(normalizedUrl).hostname;

  const websiteUrl = isWebsiteUrl(normalizedUrl);
  if (!websiteUrl) return;

  const websiteRecordKey = await getWebsiteRecordKey(normalizedUrl);

  const keysPromise = buildWebsiteImageKeys(normalizedUrl);
  const existingRecordPromise = measureDb(metrics, "website_record_select_db_ms", () =>
    getWebsiteRecordByKey(websiteRecordKey),
  );
  const r2ChecksPromise = keysPromise.then((k) =>
    measureDuration(metrics, "r2_exists_ms", () =>
      Promise.all([
        existsInR2(k.favicon).catch(() => false),
        existsInR2(k.og).catch(() => false),
        existsInR2(k.preview).catch(() => false),
      ]),
    ),
  );

  let page: WebsiteHtmlPage;

  try {
    page = await measureDuration(metrics, "html_fetch_ms", () =>
      fetchWebsiteHtmlPage(normalizedUrl),
    );
    metrics.website_protected = page.websiteProtected ? "true" : "false";
  } catch (error) {
    const keys = await keysPromise;
    metrics.html_status = "failed";
    metrics.favicon_status = "failed";
    metrics.og_status = "failed";
    metrics.preview_status = "failed";
    await measureDb(metrics, "bookmark_update_db_ms", () =>
      markWebsiteEnrichmentFailed(bookmark.id, normalizedUrl, error, keys),
    );
    throw error;
  }

  const htmlExtractStartedAt = performance.now();
  const metadataResult = extractUrlMetadataFromHtmlPage(page);
  recordDuration(metrics, "html_extract_ms", htmlExtractStartedAt);
  const htmlStatus = metadataResult.title || metadataResult.description ? "ready" : "missing";
  metrics.html_status = htmlStatus;

  const bookmarkUpdated = await measureDb(metrics, "bookmark_update_db_ms", () =>
    updateWebsiteTextMetadata(bookmark.id, {
      title: metadataResult.title ?? null,
      description: metadataResult.description ?? null,
      status: htmlStatus,
    }),
  );
  if (!bookmarkUpdated) return;

  const keys = await keysPromise;
  const [existingRecord, [faviconExists, ogExists, previewExists]] = await Promise.all([
    existingRecordPromise,
    r2ChecksPromise,
  ]);
  const refreshPlans = getWebsiteRecordRefreshPlans(existingRecord);

  const assetResults = await processWebsiteAssets({
    normalizedUrl,
    page,
    keys,
    r2Exists: getWebsiteAssetR2Exists(refreshPlans, {
      favicon: faviconExists,
      og: ogExists,
      preview: previewExists,
    }),
  });
  setAssetMetrics(metrics, assetResults);

  const nowIso = new Date().toISOString();
  const {images, htmlRefreshed, previewRefreshed} = buildWebsiteRecordRefreshOutcome({
    assetResults,
    nowIso,
    existingRecord,
  });
  const previewStatus = getWebsiteRecordPreviewStatus(assetResults);

  let websiteRecord;
  try {
    websiteRecord = await measureDb(metrics, "website_record_upsert_db_ms", () =>
      upsertWebsiteRecord({
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
      updateWebsiteImageStatuses(bookmark.id, assetResults).catch(() => {}),
    );
    throw upsertError;
  }

  await measureDb(metrics, "bookmark_update_db_ms", () =>
    updateBookmarkFromWebsiteRecord(bookmark.id, websiteRecord),
  );

  const failures = collectWebsiteAssetFailures(assetResults);
  if (failures.length === 0) return;

  logger.warn("Website enrichment completed with asset failures", {
    bookmarkId: bookmark.id,
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
