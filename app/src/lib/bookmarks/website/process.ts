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

export async function processWebsiteBookmark(bookmarkId: string) {
  const startedAt = performance.now();
  const timingsMs: Record<string, number> = {};
  let normalizedUrl: string | undefined;
  let websiteRecordKey: string | undefined;
  let status = "completed";
  let previewRefreshForced = false;
  let htmlRefreshForced = false;

  try {
    const bookmarkStartedAt = performance.now();
    const bookmark = await getWebsiteBookmarkProcessingInfo(bookmarkId);
    timingsMs.getWebsiteBookmarkProcessingInfo = elapsedMs(bookmarkStartedAt);
    if (!bookmark) {
      status = "bookmark_missing";
      return;
    }

    normalizedUrl = normalizeInputUrl(bookmark.url).toString();

    const websiteUrl = isWebsiteUrl(normalizedUrl);
    if (!websiteUrl) {
      status = "non_website_url";
      return;
    }

    websiteRecordKey = await getWebsiteRecordKey(normalizedUrl);

    const keysPromise = buildWebsiteImageKeys(normalizedUrl);
    const existingRecordPromise = getWebsiteRecordByKey(websiteRecordKey);
    const r2ChecksPromise = keysPromise.then((k) =>
      Promise.all([
        existsInR2(k.favicon).catch(() => false),
        existsInR2(k.og).catch(() => false),
        existsInR2(k.preview).catch(() => false),
      ]),
    );

    let page: WebsiteHtmlPage;

    const fetchStartedAt = performance.now();
    try {
      page = await fetchWebsiteHtmlPage(normalizedUrl);
      timingsMs.fetchWebsiteHtmlPage = elapsedMs(fetchStartedAt);
    } catch (error) {
      timingsMs.fetchWebsiteHtmlPage = elapsedMs(fetchStartedAt);
      const markFailedStartedAt = performance.now();
      const keys = await keysPromise;
      await markWebsiteEnrichmentFailed(bookmark.id, normalizedUrl, error, keys);
      timingsMs.markWebsiteEnrichmentFailed = elapsedMs(markFailedStartedAt);
      throw error;
    }

    const metadataResult = extractUrlMetadataFromHtmlPage(page);
    const htmlStatus = metadataResult.title || metadataResult.description ? "ready" : "missing";

    const updateTextStartedAt = performance.now();
    const bookmarkUpdated = await updateWebsiteTextMetadata(bookmark.id, {
      title: metadataResult.title ?? null,
      description: metadataResult.description ?? null,
      status: htmlStatus,
    });
    timingsMs.updateWebsiteTextMetadata = elapsedMs(updateTextStartedAt);
    if (!bookmarkUpdated) {
      status = "bookmark_inactive";
      return;
    }

    const r2WaitStartedAt = performance.now();
    const keys = await keysPromise;
    const [existingRecord, [faviconExists, ogExists, previewExists]] = await Promise.all([
      existingRecordPromise,
      r2ChecksPromise,
    ]);
    const refreshPlans = getWebsiteRecordRefreshPlans(existingRecord);
    previewRefreshForced = refreshPlans.preview.shouldRefresh;
    htmlRefreshForced = refreshPlans.html.shouldRefresh;
    timingsMs.r2ExistenceChecks = elapsedMs(r2WaitStartedAt);

    const assetResults = await processWebsiteAssets({
      normalizedUrl,
      page,
      keys,
      r2Exists: getWebsiteAssetR2Exists(refreshPlans, {
        favicon: faviconExists,
        og: ogExists,
        preview: previewExists,
      }),
      timingsMs,
    });

    const nowIso = new Date().toISOString();
    const {images, htmlRefreshed, previewRefreshed} = buildWebsiteRecordRefreshOutcome({
      assetResults,
      nowIso,
      existingRecord,
    });
    const previewStatus = getWebsiteRecordPreviewStatus(assetResults);

    let websiteRecord;
    try {
      websiteRecord = await upsertWebsiteRecord({
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
        timingsMs,
      });
    } catch (upsertError) {
      await updateWebsiteImageStatuses(bookmark.id, assetResults).catch(() => {});
      throw upsertError;
    }

    const updateBookmarkStartedAt = performance.now();
    await updateBookmarkFromWebsiteRecord(bookmark.id, websiteRecord);
    timingsMs.updateBookmarkFromWebsiteRecord = elapsedMs(updateBookmarkStartedAt);

    const failures = collectWebsiteAssetFailures(assetResults);
    if (failures.length === 0) return;

    status = "completed_with_asset_failures";
    logger.warn("Website enrichment completed with asset failures", {
      bookmarkId: bookmark.id,
      url: normalizedUrl,
      failures: failures.map((failure) => ({
        label: failure.label,
        reason: toLogError(failure.reason),
      })),
    });
  } catch (error) {
    status = "failed";
    throw error;
  } finally {
    timingsMs.totalProcessWebsiteBookmark = elapsedMs(startedAt);
    console.log("processWebsiteBookmark timings", {
      bookmarkId,
      url: normalizedUrl,
      websiteRecordKey,
      previewRefreshForced,
      htmlRefreshForced,
      status,
      timingsMs,
    });
  }
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

function elapsedMs(startedAt: number) {
  return Number((performance.now() - startedAt).toFixed(2));
}
