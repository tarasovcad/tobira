import {
  extractDescriptionFromHtml,
  extractTitleFromHtml,
  isHtmlContentType,
  looksLikeChallengeHtml,
} from "@/lib/fetch/web/html";
import {fetchTextWithTimeout} from "@/lib/fetch/web/http";
import {fetchHtmlViaFirecrawl} from "@/lib/fetch/web/screenshot";

export type UrlMetadataResult = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  title?: string;
  description?: string;
};

export async function fetchUrlMetadata(
  normalized: URL,
  inputUrl: string,
): Promise<UrlMetadataResult> {
  const result: UrlMetadataResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
  };

  const res = await fetchTextWithTimeout(normalized.toString(), 8000, {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  result.finalUrl = res.url;

  const contentType = res.headers.get("content-type") ?? "";
  if (!isHtmlContentType(contentType)) {
    return result;
  }

  let html = await res.text();
  let usedFirecrawl = false;

  if (looksLikeChallengeHtml(html)) {
    try {
      html = (await fetchHtmlViaFirecrawl(normalized.toString())).rawHtml;
      usedFirecrawl = true;
    } catch {
      // Firecrawl fallback failed; continue with the original HTML.
    }
  }

  result.title = extractTitleFromHtml(html);
  result.description = extractDescriptionFromHtml(html);

  if (!usedFirecrawl && looksLikeChallengeHtml(html)) {
    result.title = undefined;
    result.description = undefined;
  }

  if (!result.title) {
    result.title = normalized.hostname.replace(/^www\./, "");
  }

  return result;
}
