import type {WebsiteHtmlPage} from "@/lib/bookmarks/metadata";
import {readBufferWithLimit} from "@/lib/fetch/web/bounded-reader";
import {fetchBestFaviconFromHtml} from "@/lib/fetch/web/favicon";
import {fetchResolvedOgImageUrlFromHtml} from "@/lib/fetch/web/og";
import {safeWebFetch} from "@/lib/fetch/web/safe-fetch";
import {
  fetchScreenshotViaCloudflare,
  fetchScreenshotViaFirecrawl,
  shouldFallbackToFirecrawlScreenshot,
  type ScreenshotData,
} from "@/lib/fetch/web/screenshot";
import {sanitizeSvgBuffer} from "@/lib/fetch/web/svg";
import {existsInR2, uploadToR2} from "@/lib/storage/r2-storage";
import {logger, toLogError} from "@/lib/shared/logger";
import {processWebsiteAssetIfMissing} from "./asset-task";

const REMOTE_ASSET_USER_AGENT = "void-enrich-bookmark/1.0";
const FAVICON_MAX_BYTES = 2 * 1024 * 1024;
const FAVICON_FETCH_TIMEOUT_MS = 10_000;
const OG_IMAGE_MAX_BYTES = 15 * 1024 * 1024;
const OG_IMAGE_FETCH_TIMEOUT_MS = 15_000;

const FAVICON_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/gif",
  "image/svg+xml",
];

const SVG_CONTENT_TYPES = ["image/svg+xml", "image/svg", "text/plain"];
const OG_IMAGE_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];

export type WebsiteImageKeys = {
  favicon: string;
  og: string;
  preview: string;
};

export async function processWebsiteAssets({
  normalizedUrl,
  page,
  keys,
}: {
  normalizedUrl: string;
  page: WebsiteHtmlPage;
  keys: WebsiteImageKeys;
}) {
  return Promise.allSettled([
    processWebsiteAssetIfMissing({
      key: keys.favicon,
      exists: existsInR2,
      process: async () => {
        const bestIcon = await fetchBestFaviconFromHtml({
          html: page.html,
          baseUrl: page.finalUrl,
          fallbackOriginUrl: normalizedUrl,
        });
        if (bestIcon?.url) {
          await uploadWebsiteFavicon(bestIcon.url, keys.favicon);
        }
      },
    }),
    processWebsiteAssetIfMissing({
      key: keys.og,
      exists: existsInR2,
      process: async () => {
        const ogImageUrl = fetchResolvedOgImageUrlFromHtml({
          html: page.html,
          baseUrl: page.finalUrl,
          metadataOgImageUrl: page.firecrawlOgImageUrl,
        });
        if (ogImageUrl) {
          await uploadWebsiteOgImage(ogImageUrl, keys.og);
        }
      },
    }),
    processWebsiteAssetIfMissing({
      key: keys.preview,
      exists: existsInR2,
      process: async () => {
        const screenshot = await fetchPreviewScreenshot(normalizedUrl, page.websiteProtected);
        if (screenshot.buffer.length > 0) {
          await uploadWebsitePreview(screenshot, keys.preview);
        }
      },
    }),
  ]);
}

async function uploadWebsiteFavicon(iconUrl: string, objectKey: string) {
  try {
    const asset = await fetchRemoteAsset({
      url: iconUrl,
      timeoutMs: FAVICON_FETCH_TIMEOUT_MS,
      maxBytes: FAVICON_MAX_BYTES,
      allowedContentTypes: (response) =>
        response.headers.get("content-type")?.includes("svg") || looksLikeSvgUrl(iconUrl)
          ? SVG_CONTENT_TYPES
          : FAVICON_CONTENT_TYPES,
    });
    if (!asset) return;

    const isSvg = asset.contentType.includes("svg") || looksLikeSvgUrl(iconUrl);
    const bytes = isSvg ? sanitizeSvgBuffer(asset.bytes) : asset.bytes;
    await uploadAsset(objectKey, bytes, asset.contentType);
  } catch (error) {
    logger.error("Favicon download failed", {url: iconUrl, error: toLogError(error)});
  }
}

async function uploadWebsiteOgImage(imageUrl: string, objectKey: string) {
  try {
    const asset = await fetchRemoteAsset({
      url: imageUrl,
      timeoutMs: OG_IMAGE_FETCH_TIMEOUT_MS,
      maxBytes: OG_IMAGE_MAX_BYTES,
      allowedContentTypes: OG_IMAGE_CONTENT_TYPES,
    });
    if (!asset) return;

    await uploadAsset(objectKey, asset.bytes, asset.contentType);
  } catch (error) {
    logger.error("OG image download failed", {url: imageUrl, error: toLogError(error)});
  }
}

async function uploadWebsitePreview(screenshot: ScreenshotData, objectKey: string) {
  await uploadAsset(objectKey, screenshot.buffer, screenshot.contentType || "image/png");
}

async function fetchPreviewScreenshot(url: string, websiteProtected: boolean) {
  try {
    return await fetchScreenshotViaCloudflare(url);
  } catch (error) {
    if (!shouldFallbackToFirecrawlScreenshot(error, {websiteProtected})) {
      throw error;
    }
    return fetchScreenshotViaFirecrawl(url);
  }
}

async function fetchRemoteAsset({
  url,
  timeoutMs,
  maxBytes,
  allowedContentTypes,
}: {
  url: string;
  timeoutMs: number;
  maxBytes: number;
  allowedContentTypes: string[] | ((response: Response) => string[]);
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await safeWebFetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {"user-agent": REMOTE_ASSET_USER_AGENT},
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const contentTypeRaw = response.headers.get("content-type") ?? "image/png";
    const contentType = contentTypeRaw.split(";")[0] ?? "image/png";
    const resolvedContentTypes =
      typeof allowedContentTypes === "function"
        ? allowedContentTypes(response)
        : allowedContentTypes;
    const bytes = await readBufferWithLimit(response, maxBytes, resolvedContentTypes);
    return {bytes, contentType};
  } finally {
    clearTimeout(timeout);
  }
}

function looksLikeSvgUrl(url: string) {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".svg");
  } catch {
    return url.toLowerCase().endsWith(".svg");
  }
}

async function uploadAsset(key: string, body: Buffer, contentType: string) {
  await uploadToR2({key, body, contentType});
}
