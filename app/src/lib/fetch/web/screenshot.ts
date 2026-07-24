import {readBufferWithLimit, readTextWithLimit} from "./bounded-reader";
import {browserImageFetchHeaders} from "./http";
import {safeWebFetch} from "./safe-fetch";

const SCREENSHOT_MAX_BYTES = 25 * 1024 * 1024;
const FIRECRAWL_HTML_RESPONSE_MAX_BYTES = 6 * 1024 * 1024;
const FIRECRAWL_SCREENSHOT_RESPONSE_MAX_BYTES = 1024 * 1024;

export type ScreenshotData = {
  buffer: Buffer;
  contentType: string;
};

export class CloudflareScreenshotError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CloudflareScreenshotError";
  }
}

type FirecrawlScrapeMetadata = {
  ogImage?: string;
  sourceURL?: string;
  url?: string;
  ["og:image"]?: string;
};

type FirecrawlScrapeResponse = {
  success?: boolean;
  data?: {
    rawHtml?: string;
    screenshot?: string;
    metadata?: FirecrawlScrapeMetadata;
  };
};

type FirecrawlHtmlData = {
  rawHtml: string;
  metadata?: FirecrawlScrapeMetadata;
};

export async function fetchHtmlViaFirecrawl(url: string): Promise<FirecrawlHtmlData> {
  const token = process.env.FIRECRAWL_API_KEY;
  if (!token) throw new Error("Missing FIRECRAWL_API_KEY");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        onlyMainContent: false,
        maxAge: 172800000,
        parsers: [],
        formats: ["rawHtml"],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Firecrawl HTML request failed: ${response.status} ${response.statusText}`);
    }

    const payload = JSON.parse(
      await readTextWithLimit(response, FIRECRAWL_HTML_RESPONSE_MAX_BYTES),
    ) as FirecrawlScrapeResponse;
    const rawHtml = payload.data?.rawHtml;
    if (!payload.success || typeof rawHtml !== "string" || !rawHtml) {
      throw new Error("Firecrawl HTML response did not include HTML content");
    }

    return {
      rawHtml,
      metadata: payload.data?.metadata,
    };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchScreenshotViaFirecrawl(url: string): Promise<ScreenshotData> {
  const token = process.env.FIRECRAWL_API_KEY;
  if (!token) throw new Error("Missing FIRECRAWL_API_KEY");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        parsers: [],
        formats: [
          {
            type: "screenshot",
            fullPage: false,
            viewport: {width: 1920, height: 1080},
          },
        ],
        maxAge: 0,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Firecrawl screenshot request failed: ${response.status} ${response.statusText}`,
      );
    }

    const payload = JSON.parse(
      await readTextWithLimit(response, FIRECRAWL_SCREENSHOT_RESPONSE_MAX_BYTES),
    ) as FirecrawlScrapeResponse;
    const screenshotUrl = payload.data?.screenshot;
    if (!payload.success || typeof screenshotUrl !== "string" || !screenshotUrl) {
      throw new Error("Firecrawl screenshot response did not include a screenshot URL");
    }

    const imageResponse = await safeWebFetch(screenshotUrl, {
      method: "GET",
      cache: "no-store",
      headers: browserImageFetchHeaders(screenshotUrl),
      signal: controller.signal,
    });

    if (!imageResponse.ok) {
      throw new Error(
        `Firecrawl screenshot download failed: ${imageResponse.status} ${imageResponse.statusText}`,
      );
    }

    const contentTypeRaw = imageResponse.headers.get("content-type") ?? "image/png";
    const contentType = contentTypeRaw.split(";")[0] ?? "image/png";
    const buffer = await readBufferWithLimit(imageResponse, SCREENSHOT_MAX_BYTES, [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/avif",
    ]);
    return {
      buffer,
      contentType,
    };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchScreenshotViaCloudflare(url: string): Promise<ScreenshotData> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

  if (!accountId || !apiToken) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN");
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 40_000);

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/screenshot`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          bestAttempt: true,
          gotoOptions: {waitUntil: "networkidle2", timeout: 10_000},
          viewport: {width: 1920, height: 1080, deviceScaleFactor: 2},
          screenshotOptions: {type: "png", fullPage: false},
          waitForTimeout: 1000,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new CloudflareScreenshotError(
        `Cloudflare screenshot request failed: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    const contentTypeRaw = response.headers.get("content-type") ?? "image/png";
    const contentType = contentTypeRaw.split(";")[0] ?? "image/png";
    const buffer = await readBufferWithLimit(response, SCREENSHOT_MAX_BYTES, [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/avif",
    ]);
    return {
      buffer,
      contentType,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new CloudflareScreenshotError("Cloudflare screenshot request timed out");
    }
    throw error;
  } finally {
    clearTimeout(t);
  }
}

export function shouldFallbackToFirecrawlScreenshot(
  error: unknown,
  options: {websiteProtected: boolean},
) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  if (
    message.includes("missing cloudflare_account_id") ||
    message.includes("missing cloudflare_api_token") ||
    message.includes("timed out") ||
    message.includes("timeout")
  ) {
    return false;
  }

  if (error instanceof CloudflareScreenshotError) {
    if (error.status === 401 || error.status === 429) return false;
    if (error.status === 403) return options.websiteProtected;
    if (error.status && error.status >= 500) return false;
    if (error.status) return true;
  }

  return /access denied|blocked|bot|captcha|challenge|forbidden/.test(message);
}
