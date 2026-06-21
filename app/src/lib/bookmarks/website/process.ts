import {eq, sql} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {buildWebsiteImageKeys} from "@/features/media/utils";
import {
  extractUrlMetadataFromHtmlPage,
  fetchWebsiteHtmlPage,
  type WebsiteHtmlPage,
} from "@/lib/bookmarks/metadata";
import {isRecord} from "@/lib/fetch/web/http";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import {logger, toLogError} from "@/lib/shared/logger";
import {processWebsiteAssets} from "./assets";
import {collectWebsiteAssetFailures} from "./processing-results";

type WebsiteBookmarkProcessingInfo = {
  id: string;
  url: string;
  metadata: unknown;
};

export async function processWebsiteBookmark(bookmarkId: string) {
  const bookmark = await getWebsiteBookmarkProcessingInfo(bookmarkId);
  if (!bookmark) return;

  const normalizedUrl = normalizeInputUrl(bookmark.url).toString();
  let page: WebsiteHtmlPage;

  try {
    page = await fetchWebsiteHtmlPage(normalizedUrl, {
      skipDirectFetch: hasWebsiteProtected(bookmark.metadata),
    });
  } catch (error) {
    await markWebsiteProcessingFailed(bookmark.id);
    throw error;
  }

  const textUpdatePromise = updateWebsiteTextMetadata(bookmark.id, page);
  const keys = await buildWebsiteImageKeys(normalizedUrl);
  const assetResultsPromise = processWebsiteAssets({normalizedUrl, page, keys});

  const textUpdateError = await textUpdatePromise.then(
    () => null,
    (error: unknown) => error,
  );
  const assetResults = await assetResultsPromise;

  if (textUpdateError) {
    await markWebsiteProcessingFailed(bookmark.id);
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
      metadata: bookmarks.metadata,
    })
    .from(bookmarks)
    .where(eq(bookmarks.id, bookmarkId))
    .limit(1);

  if (!bookmark || bookmark.kind !== "website") return null;
  return {id: bookmark.id, url: bookmark.url, metadata: bookmark.metadata};
}

function hasWebsiteProtected(metadata: unknown) {
  return isRecord(metadata) && metadata.websiteProtected === true;
}

async function updateWebsiteTextMetadata(bookmarkId: string, page: WebsiteHtmlPage) {
  const metadataResult = extractUrlMetadataFromHtmlPage(page);
  let metadata = sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{textMetadataStatus}', '"completed"'::jsonb, true)`;

  if (page.websiteProtected) {
    metadata = sql`jsonb_set(${metadata}, '{websiteProtected}', 'true'::jsonb, true)`;
  }

  await db
    .update(bookmarks)
    .set({
      title: metadataResult.title ?? null,
      description: metadataResult.description ?? null,
      metadata,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(bookmarks.id, bookmarkId));
}

async function markWebsiteProcessingFailed(bookmarkId: string) {
  await db
    .update(bookmarks)
    .set({
      metadata: sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{textMetadataStatus}', '"failed"'::jsonb, true)`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(bookmarks.id, bookmarkId));
}
