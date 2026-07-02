import {and, eq, isNull, sql} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks, type WebsiteImages} from "@/db/schema";
import {logger, toLogError} from "@/lib/shared/logger";
import {toWebsiteImageAsset, type WebsiteAssetProcessingResult} from "./processing-results";

export async function updateWebsiteTextMetadataStatus(
  bookmarkId: string,
  status: "ready" | "missing" | "failed",
) {
  await db
    .update(bookmarks)
    .set({
      metadata: sql`jsonb_set(COALESCE(${bookmarks.metadata}, '{}'::jsonb), '{textMetadataStatus}', to_jsonb(${status}::text), true)`,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(bookmarks.id, bookmarkId), eq(bookmarks.kind, "website"), isNull(bookmarks.deletedAt)),
    );
}

export async function updateWebsiteTextMetadata(
  bookmarkId: string,
  {
    title,
    description,
    status,
  }: {
    title: string | null;
    description: string | null;
    status: "ready" | "missing";
  },
): Promise<boolean> {
  const result = await db
    .update(bookmarks)
    .set({
      title: sql`COALESCE(${bookmarks.title}, ${title})`,
      description: sql`COALESCE(${bookmarks.description}, ${description})`,
      metadata: sql`jsonb_set(COALESCE(${bookmarks.metadata}, '{}'::jsonb), '{textMetadataStatus}', to_jsonb(${status}::text), true)`,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(bookmarks.id, bookmarkId), eq(bookmarks.kind, "website"), isNull(bookmarks.deletedAt)),
    )
    .returning({id: bookmarks.id});

  return result.length > 0;
}

export async function markWebsiteEnrichmentFailed(
  bookmarkId: string,
  normalizedUrl: string,
  reason: unknown,
  keys: {favicon: string; og: string; preview: string},
) {
  try {
    await updateWebsiteTextMetadataStatus(bookmarkId, "failed");
    await updateWebsiteImageStatuses(bookmarkId, buildFailedWebsiteAssetResults(keys, reason));
  } catch (error) {
    logger.error("Failed to mark website enrichment as failed", {
      bookmarkId,
      url: normalizedUrl,
      originalError: toLogError(reason),
      error: toLogError(error),
    });
  }
}

export async function updateWebsiteImageStatuses(
  bookmarkId: string,
  assetResults: WebsiteAssetProcessingResult[],
) {
  await db
    .update(bookmarks)
    .set({
      images: buildWebsiteImagesFromAssetResults(assetResults),
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(bookmarks.id, bookmarkId), eq(bookmarks.kind, "website"), isNull(bookmarks.deletedAt)),
    );
}

function buildFailedWebsiteAssetResults(
  keys: {favicon: string; og: string; preview: string},
  reason: unknown,
): WebsiteAssetProcessingResult[] {
  return [
    {label: "favicon", status: "failed", reason, key: keys.favicon},
    {label: "og", status: "failed", reason, key: keys.og, width: 1200, height: 630},
    {label: "preview", status: "failed", reason, key: keys.preview, width: 1920, height: 1080},
  ];
}

function buildWebsiteImagesFromAssetResults(
  assetResults: WebsiteAssetProcessingResult[],
): WebsiteImages {
  return {
    favicon: toWebsiteImageAsset(assetResults, "favicon"),
    og: toWebsiteImageAsset(assetResults, "og"),
    preview: toWebsiteImageAsset(assetResults, "preview"),
    selected: "preview",
  };
}
