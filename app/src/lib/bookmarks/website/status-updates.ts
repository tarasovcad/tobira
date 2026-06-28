import {and, eq, isNull, sql} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks, type WebsiteImageAsset, type WebsiteImages} from "@/db/schema";
import {buildWebsiteImageKeys} from "@/features/media/utils";
import {logger, toLogError} from "@/lib/shared/logger";
import type {WebsiteAssetLabel, WebsiteAssetProcessingResult} from "./processing-results";

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

export async function markWebsiteEnrichmentFailed(
  bookmarkId: string,
  normalizedUrl: string,
  reason: unknown,
) {
  try {
    await updateWebsiteTextMetadataStatus(bookmarkId, "failed");
    await updateWebsiteImageStatuses(
      bookmarkId,
      await buildFailedWebsiteAssetResults(normalizedUrl, reason),
    );
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

async function buildFailedWebsiteAssetResults(
  normalizedUrl: string,
  reason: unknown,
): Promise<WebsiteAssetProcessingResult[]> {
  const keys = await buildWebsiteImageKeys(normalizedUrl);

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
    favicon: buildWebsiteImageAsset(assetResults, "favicon"),
    og: buildWebsiteImageAsset(assetResults, "og"),
    preview: buildWebsiteImageAsset(assetResults, "preview"),
    selected: "preview",
  };
}

function buildWebsiteImageAsset(
  assetResults: WebsiteAssetProcessingResult[],
  label: WebsiteAssetLabel,
): WebsiteImageAsset {
  const result = assetResults.find((assetResult) => assetResult.label === label);
  if (!result) return {status: "failed"};

  if (result.status !== "ready") {
    return {
      status: result.status,
      ...(result.key !== undefined ? {key: result.key} : {}),
      ...(result.width !== undefined ? {width: result.width} : {}),
      ...(result.height !== undefined ? {height: result.height} : {}),
    };
  }

  if (!result.key) return {status: "failed"};

  return {
    status: "ready",
    key: result.key,
    ...(result.width !== undefined ? {width: result.width} : {}),
    ...(result.height !== undefined ? {height: result.height} : {}),
  };
}
