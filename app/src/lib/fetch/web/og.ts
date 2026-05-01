import {fetchTextWithTimeout} from "./http";
import {extractOgImageUrlFromHtml, isHtmlContentType, looksLikeChallengeHtml} from "./html";
import {fetchHtmlViaFirecrawl} from "./screenshot";

export async function fetchResolvedOgImageUrl(url: string) {
  const res = await fetchTextWithTimeout(url, 8000, {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const contentType = res.headers.get("content-type") ?? "";
  if (!isHtmlContentType(contentType)) return undefined;

  let html = await res.text();
  let baseUrl = res.url || url;

  if (looksLikeChallengeHtml(html)) {
    try {
      const firecrawl = await fetchHtmlViaFirecrawl(url);
      html = firecrawl.rawHtml;
      baseUrl = firecrawl.metadata?.sourceURL ?? firecrawl.metadata?.url ?? baseUrl;

      const firecrawlOg = firecrawl.metadata?.ogImage ?? firecrawl.metadata?.["og:image"];
      if (firecrawlOg) {
        return new URL(firecrawlOg, baseUrl).toString();
      }
    } catch {
      return undefined;
    }
  }

  const og = extractOgImageUrlFromHtml(html);
  if (!og) return undefined;
  try {
    return new URL(og, baseUrl).toString();
  } catch {
    return undefined;
  }
}
