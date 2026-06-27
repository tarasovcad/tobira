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
import {isWebsiteUrl, NonWebsiteUrlError} from "@/lib/fetch/web/website-url";
import {logger, toLogError} from "@/lib/shared/logger";
import {processWebsiteAssets} from "./assets";
import {collectWebsiteAssetFailures} from "./processing-results";

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
    if (error instanceof NonWebsiteUrlError) return;
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

  if (textUpdateError) {
    throw textUpdateError;
  }

  const failures = collectWebsiteAssetFailures(assetResults);
  if (failures.length === 0) return;

  logger.error("Website enrichment failed", {
    bookmarkId: bookmark.id,
    url: normalizedUrl,
    failures: failures.map((failure) => ({
      label: failure.label,
      reason: toLogError(failure.reason),
    })),
  });
  throw new Error(
    `Website enrichment failed for ${failures.map((failure) => failure.label).join(", ")}`,
  );
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
  const metadataResult = extractUrlMetadataFromHtmlPage(page);

  await db
    .update(bookmarks)
    .set({
      title: sql`COALESCE(${bookmarks.title}, ${metadataResult.title ?? null})`,
      description: sql`COALESCE(${bookmarks.description}, ${metadataResult.description ?? null})`,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(bookmarks.id, bookmarkId), isNull(bookmarks.deletedAt)));
}
