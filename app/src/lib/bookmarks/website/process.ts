import {and, eq, isNull, sql} from "drizzle-orm";
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
import {processWebsiteAssets} from "./assets";
import {collectWebsiteAssetFailures} from "./processing-results";
import {
  markWebsiteEnrichmentFailed,
  updateWebsiteImageStatuses,
  updateWebsiteTextMetadataStatus,
} from "./status-updates";

type WebsiteBookmarkProcessingInfo = {
  id: string;
  url: string;
};

export async function processWebsiteBookmark(bookmarkId: string) {
  const bookmark = await getWebsiteBookmarkProcessingInfo(bookmarkId);
  if (!bookmark) return;

  const normalizedUrl = normalizeInputUrl(bookmark.url).toString();
  if (!isWebsiteUrl(normalizedUrl)) return;
  let page: WebsiteHtmlPage;

  try {
    page = await fetchWebsiteHtmlPage(normalizedUrl);
  } catch (error) {
    await markWebsiteEnrichmentFailed(bookmark.id, normalizedUrl, error);
    throw error;
  }

  if (!(await isWebsiteBookmarkActive(bookmark.id))) return;

  const textUpdatePromise = updateWebsiteTextMetadata(bookmark.id, page);
  const keys = await buildWebsiteImageKeys(normalizedUrl);
  const assetResultsPromise = processWebsiteAssets({normalizedUrl, page, keys});

  const textUpdateError = await textUpdatePromise.then(
    () => null,
    (error: unknown) => error,
  );
  const assetResults = await assetResultsPromise;
  await updateWebsiteImageStatuses(bookmark.id, assetResults);

  if (textUpdateError) {
    throw textUpdateError;
  }

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

async function updateWebsiteTextMetadata(bookmarkId: string, page: WebsiteHtmlPage) {
  try {
    const metadataResult = extractUrlMetadataFromHtmlPage(page);
    const textMetadataStatus =
      metadataResult.title || metadataResult.description ? "ready" : "missing";

    await db
      .update(bookmarks)
      .set({
        title: sql`COALESCE(${bookmarks.title}, ${metadataResult.title ?? null})`,
        description: sql`COALESCE(${bookmarks.description}, ${metadataResult.description ?? null})`,
        metadata: sql`jsonb_set(COALESCE(${bookmarks.metadata}, '{}'::jsonb), '{textMetadataStatus}', to_jsonb(${textMetadataStatus}::text), true)`,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(bookmarks.id, bookmarkId),
          eq(bookmarks.kind, "website"),
          isNull(bookmarks.deletedAt),
        ),
      );
  } catch (error) {
    try {
      await updateWebsiteTextMetadataStatus(bookmarkId, "failed");
    } catch (statusError) {
      logger.error("Failed to update website text metadata status", {
        bookmarkId,
        error: toLogError(statusError),
      });
    }
    throw error;
  }
}
