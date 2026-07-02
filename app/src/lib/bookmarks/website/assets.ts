import type {WebsiteHtmlPage} from "@/lib/bookmarks/metadata";
import {readBufferWithLimit} from "@/lib/fetch/web/bounded-reader";
import {fetchBestFaviconFromHtml} from "@/lib/fetch/web/favicon";
import {
  fetchFaviconFromProviders,
  type DownloadedFaviconAsset,
} from "@/lib/fetch/web/favicon-providers";
import {browserImageFetchHeaders} from "@/lib/fetch/web/http";
import {fetchResolvedOgImageUrlFromHtml} from "@/lib/fetch/web/og";
import {safeWebFetch} from "@/lib/fetch/web/safe-fetch";
import {
  fetchScreenshotViaCloudflare,
  fetchScreenshotViaFirecrawl,
  shouldFallbackToFirecrawlScreenshot,
  type ScreenshotData,
} from "@/lib/fetch/web/screenshot";
import {sanitizeSvgBuffer} from "@/lib/fetch/web/svg";
import {uploadToR2} from "@/lib/storage/r2-storage";
import {logger, toLogError} from "@/lib/shared/logger";
import type {WebsiteAssetLabel, WebsiteAssetProcessingResult} from "./processing-results";

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
  r2Exists,
  timingsMs,
}: {
  normalizedUrl: string;
  page: WebsiteHtmlPage;
  keys: WebsiteImageKeys;
  r2Exists: {favicon: boolean; og: boolean; preview: boolean};
  timingsMs?: Record<string, number>;
}) {
  const fallbackFaviconDomain = new URL(normalizedUrl).hostname;

  const faviconStartedAt = performance.now();
  let faviconDurationMs = 0;
  const faviconPromise = processWebsiteAsset({
    label: "favicon",
    key: keys.favicon,
    alreadyExists: r2Exists.favicon,
    process: async () => {
      const bestIcon = await fetchBestFaviconFromHtml({
        html: page.html,
        baseUrl: page.finalUrl,
        fallbackOriginUrl: normalizedUrl,
      });
      const uploaded = await uploadWebsiteFavicon(
        bestIcon?.url ?? null,
        keys.favicon,
        page.finalUrl,
        fallbackFaviconDomain,
      );
      if (!uploaded) {
        return {status: "missing"};
      }

      return {status: "ready"};
    },
  }).finally(() => {
    faviconDurationMs = elapsedMs(faviconStartedAt);
  });

  const ogStartedAt = performance.now();
  let ogDurationMs = 0;
  const ogPromise = processWebsiteAsset({
    label: "og",
    key: keys.og,
    width: 1200,
    height: 630,
    alreadyExists: r2Exists.og,
    process: async () => {
      const ogImageUrl = fetchResolvedOgImageUrlFromHtml({
        html: page.html,
        baseUrl: page.finalUrl,
        metadataOgImageUrl: page.firecrawlOgImageUrl,
      });
      if (!ogImageUrl) {
        return {status: "missing"};
      }

      await uploadWebsiteOgImage(ogImageUrl, keys.og, page.finalUrl);
      return {status: "ready"};
    },
  }).finally(() => {
    ogDurationMs = elapsedMs(ogStartedAt);
  });

  const previewStartedAt = performance.now();
  let previewDurationMs = 0;
  const previewPromise = processWebsiteAsset({
    label: "preview",
    key: keys.preview,
    width: 1920,
    height: 1080,
    alreadyExists: r2Exists.preview,
    process: async () => {
      const screenshot = await fetchPreviewScreenshot(normalizedUrl, page.websiteProtected);
      if (screenshot.buffer.length === 0) {
        return {status: "missing"};
      }

      await uploadWebsitePreview(screenshot, keys.preview);
      return {status: "ready"};
    },
  }).finally(() => {
    previewDurationMs = elapsedMs(previewStartedAt);
  });

  const [favicon, og, preview] = await Promise.all([faviconPromise, ogPromise, previewPromise]);

  if (timingsMs) {
    timingsMs["1) processWebsiteAssets.favicon"] = faviconDurationMs;
    timingsMs["2) processWebsiteAssets.ogImage"] = ogDurationMs;
    timingsMs["3) processWebsiteAssets.preview"] = previewDurationMs;
  }

  return [favicon, og, preview];
}

type WebsiteAssetProcessResult = {status: "ready"} | {status: "missing"};

async function processWebsiteAsset({
  label,
  key,
  width,
  height,
  alreadyExists,
  process,
}: {
  label: WebsiteAssetLabel;
  key: string;
  width?: number;
  height?: number;
  alreadyExists: boolean;
  process: () => Promise<WebsiteAssetProcessResult>;
}): Promise<WebsiteAssetProcessingResult> {
  try {
    if (alreadyExists) {
      return websiteAssetResult({label, status: "ready", key, width, height, reusedExisting: true});
    }

    const result = await process();
    if (result.status === "ready") {
      return websiteAssetResult({
        label,
        status: "ready",
        key,
        width,
        height,
        reusedExisting: false,
      });
    }

    return {label, status: "missing"};
  } catch (error) {
    logger.warn("Website asset processing failed", {
      label,
      key,
      error: toLogError(error),
    });
    return websiteAssetResult({label, status: "failed", key, width, height, reason: error});
  }
}

function websiteAssetResult({
  label,
  status,
  key,
  width,
  height,
  reusedExisting,
  reason,
}: {
  label: WebsiteAssetLabel;
  status: "ready" | "failed";
  key: string;
  width?: number;
  height?: number;
  reusedExisting?: boolean;
  reason?: unknown;
}): WebsiteAssetProcessingResult {
  return {
    label,
    status,
    key,
    ...(width !== undefined ? {width} : {}),
    ...(height !== undefined ? {height} : {}),
    ...(reusedExisting !== undefined ? {reusedExisting} : {}),
    ...(reason !== undefined ? {reason} : {}),
  };
}

async function uploadWebsiteFavicon(
  iconUrl: string | null,
  objectKey: string,
  refererUrl: string,
  fallbackDomain: string,
) {
  const asset =
    (iconUrl ? await fetchDirectFaviconAsset(iconUrl, refererUrl) : null) ??
    (await fetchFaviconFromProviders(fallbackDomain));
  if (!asset) return false;

  await uploadAsset(objectKey, asset.bytes, asset.contentType);
  return true;
}

async function fetchDirectFaviconAsset(
  iconUrl: string,
  refererUrl: string,
): Promise<DownloadedFaviconAsset | null> {
  try {
    const asset = await fetchRemoteAsset({
      url: iconUrl,
      refererUrl,
      timeoutMs: FAVICON_FETCH_TIMEOUT_MS,
      maxBytes: FAVICON_MAX_BYTES,
      allowedContentTypes: (response) =>
        response.headers.get("content-type")?.includes("svg") || looksLikeSvgUrl(iconUrl)
          ? SVG_CONTENT_TYPES
          : FAVICON_CONTENT_TYPES,
    });
    if (!asset) return null;

    const isSvg = asset.contentType.includes("svg") || looksLikeSvgUrl(iconUrl);
    const bytes = isSvg ? sanitizeSvgBuffer(asset.bytes) : asset.bytes;
    return {bytes, contentType: asset.contentType};
  } catch {
    return null;
  }
}

async function uploadWebsiteOgImage(imageUrl: string, objectKey: string, refererUrl: string) {
  const asset = await fetchRemoteAsset({
    url: imageUrl,
    refererUrl,
    timeoutMs: OG_IMAGE_FETCH_TIMEOUT_MS,
    maxBytes: OG_IMAGE_MAX_BYTES,
    allowedContentTypes: OG_IMAGE_CONTENT_TYPES,
  });
  if (!asset) {
    throw new Error("OG image asset could not be downloaded");
  }

  await uploadAsset(objectKey, asset.bytes, asset.contentType);
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
  refererUrl,
  timeoutMs,
  maxBytes,
  allowedContentTypes,
}: {
  url: string;
  refererUrl?: string;
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
      headers: browserImageFetchHeaders(url, refererUrl),
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

function elapsedMs(startedAt: number) {
  return Number((performance.now() - startedAt).toFixed(2));
}
