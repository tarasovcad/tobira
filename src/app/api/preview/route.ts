import {NextRequest, NextResponse} from "next/server";
import {
  extractDescriptionFromHtml,
  extractOgImageUrlFromHtml,
  extractTitleFromHtml,
  fetchBrowserlessRenderedHtml,
  fetchTextWithTimeout,
  isHtmlContentType,
  looksLikeChallengeHtml,
  normalizeInputUrl,
} from "@/lib/fetch/web";

export const runtime = "nodejs";

type PreviewResult = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  screenshotDataUrl?: string;
  screenshotContentType?: string;
  screenshotBytes?: number;
  screenshotError?: string;
};

async function fetchBrowserlessScreenshotDataUrl(url: string) {
  const token = process.env.BROWSERLESS_API_KEY;
  if (!token) {
    throw new Error("Missing BROWSERLESS_TOKEN");
  }

  const response = await fetch(`https://production-sfo.browserless.io/screenshot?token=${token}`, {
    method: "POST",
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      gotoOptions: {waitUntil: "networkidle0", timeout: 15000},
      waitForSelector: {
        selector: "body",
        timeout: 10000,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Browserless screenshot failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`,
    );
  }

  const contentTypeRaw = response.headers.get("content-type") ?? "image/png";
  const contentType = contentTypeRaw.split(";")[0] ?? "image/png";
  const imageBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString("base64");

  return {
    dataUrl: `data:${contentType};base64,${base64}`,
    contentType,
    bytes: imageBuffer.byteLength,
  };
}

export async function GET(request: NextRequest) {
  const inputUrl = request.nextUrl.searchParams.get("url") ?? "";

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(inputUrl);
  } catch (e) {
    return NextResponse.json(
      {error: e instanceof Error ? e.message : "Invalid url"},
      {status: 400},
    );
  }

  const result: PreviewResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
  };

  try {
    const normalizedUrl = normalized.toString();

    // Always attempt both:
    // - HTML fetch for title/description/og:image
    // - Browserless screenshot (returns an image)
    const [res, screenshot] = await Promise.all([
      fetchTextWithTimeout(normalizedUrl, 8000, {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      }),
      fetchBrowserlessScreenshotDataUrl(normalizedUrl).catch((e) => ({
        error: e instanceof Error ? e.message : "Browserless screenshot failed",
      })),
    ]);

    result.finalUrl = res.url;
    if ("error" in screenshot) {
      result.screenshotError = screenshot.error;
    } else {
      result.screenshotDataUrl = screenshot.dataUrl;
      result.screenshotContentType = screenshot.contentType;
      result.screenshotBytes = screenshot.bytes;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const isHtml = isHtmlContentType(contentType);
    if (!isHtml) {
      return NextResponse.json(
        {...result, title: undefined, description: undefined},
        {headers: {"cache-control": "no-store"}},
      );
    }

    let html = await res.text();

    // If the response looks like a Cloudflare/bot challenge, fall back to
    // Browserless rendered HTML for metadata extraction
    if (looksLikeChallengeHtml(html)) {
      try {
        html = await fetchBrowserlessRenderedHtml(normalizedUrl);
      } catch {
        // Browserless fallback failed — continue with whatever we got
      }
    }

    result.title = extractTitleFromHtml(html);
    result.description = extractDescriptionFromHtml(html);

    // Graceful fallback: use hostname as title when extraction failed
    if (!result.title) {
      result.title = normalized.hostname.replace(/^www\./, "");
    }

    const ogImage = extractOgImageUrlFromHtml(html);
    if (ogImage) {
      try {
        // Resolve relative URLs against the final fetched URL.
        result.imageUrl = new URL(ogImage, res.url || normalized.toString()).toString();
      } catch {
        // ignore invalid URLs
      }
    }
  } catch (e) {
    return NextResponse.json(
      {error: e instanceof Error ? e.message : "Request failed"},
      {status: 500},
    );
  }

  return NextResponse.json(result, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
