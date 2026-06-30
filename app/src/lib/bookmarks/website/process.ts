import {and, eq, isNull} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks, type WebsiteRecordStatus} from "@/db/schema";
import {buildWebsiteImageKeys} from "@/features/media/utils";
import {
  extractUrlMetadataFromHtmlPage,
  fetchWebsiteHtmlPage,
  type WebsiteHtmlPage,
} from "@/lib/bookmarks/metadata";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import {isWebsiteUrl} from "@/lib/fetch/web/website-url";
import {logger, toLogError} from "@/lib/shared/logger";
import {processWebsiteAssets} from "./assets";
import {collectWebsiteAssetFailures} from "./processing-results";
import {markWebsiteEnrichmentFailed} from "./status-updates";
import {
  buildWebsiteRecordImagesFromAssetResults,
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
  const bookmark = await getWebsiteBookmarkProcessingInfo(bookmarkId);
  if (!bookmark) return;

  const normalizedUrl = normalizeInputUrl(bookmark.url).toString();
  if (!isWebsiteUrl(normalizedUrl)) return;
  const websiteRecordKey = await getWebsiteRecordKey(normalizedUrl);
  let page: WebsiteHtmlPage;

  try {
    page = await fetchWebsiteHtmlPage(normalizedUrl);
  } catch (error) {
    await markWebsiteEnrichmentFailed(bookmark.id, normalizedUrl, error);
    throw error;
  }

  if (!(await isWebsiteBookmarkActive(bookmark.id))) return;

  const metadataResult = extractUrlMetadataFromHtmlPage(page);
  const htmlStatus: WebsiteRecordStatus =
    metadataResult.title || metadataResult.description ? "ready" : "missing";
  const keys = await buildWebsiteImageKeys(normalizedUrl);
  const assetResults = await processWebsiteAssets({normalizedUrl, page, keys});
  const websiteRecord = await upsertWebsiteRecord({
    key: websiteRecordKey,
    normalizedUrl,
    hostname: new URL(normalizedUrl).hostname,
    title: metadataResult.title ?? null,
    description: metadataResult.description ?? null,
    images: buildWebsiteRecordImagesFromAssetResults(assetResults),
    htmlStatus,
    previewStatus: getWebsiteRecordPreviewStatus(assetResults),
  });

  await updateBookmarkFromWebsiteRecord(bookmark.id, websiteRecord);

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

async function isWebsiteBookmarkActive(bookmarkId: string) {
  const [bookmark] = await db
    .select({id: bookmarks.id})
    .from(bookmarks)
    .where(
      and(eq(bookmarks.id, bookmarkId), eq(bookmarks.kind, "website"), isNull(bookmarks.deletedAt)),
    )
    .limit(1);

  return !!bookmark;
}
