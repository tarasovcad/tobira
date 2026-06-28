import {
  extractDescriptionFromHtml,
  extractTitleFromHtml,
  isHtmlContentType,
  looksLikeChallengeHtml,
} from "@/lib/fetch/web/html";
import {fetchHtmlViaFirecrawl} from "@/lib/fetch/web/screenshot";
import {readTextWithLimit} from "@/lib/fetch/web/bounded-reader";
import {assertWebsiteUrl, NonWebsiteUrlError} from "@/lib/fetch/web/website-url";
import {assertPublicFetchUrl, safeWebFetch} from "@/lib/fetch/web/safe-fetch";

export type UrlMetadataResult = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  title?: string;
  description?: string;
  websiteProtected: boolean;
};

export type WebsiteHtmlPage = {
  html: string;
  finalUrl: string;
  websiteProtected: boolean;
  firecrawlOgImageUrl?: string;
};

const WEBSITE_FETCH_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const WEBSITE_FETCH_TIMEOUT_MS = 8000;
const HTML_MAX_BYTES = 5 * 1024 * 1024;

async function fetchWebsiteHtmlViaFirecrawl(
  url: string,
  websiteProtected: boolean,
): Promise<WebsiteHtmlPage> {
  const firecrawl = await fetchHtmlViaFirecrawl(url);
  const finalUrl = firecrawl.metadata?.sourceURL ?? firecrawl.metadata?.url ?? url;
  await assertPublicFetchUrl(finalUrl);

  return {
    html: firecrawl.rawHtml,
    finalUrl,
    websiteProtected,
    firecrawlOgImageUrl: firecrawl.metadata?.ogImage ?? firecrawl.metadata?.["og:image"],
  };
}

export async function fetchWebsiteHtmlPage(url: string): Promise<WebsiteHtmlPage> {
  assertWebsiteUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBSITE_FETCH_TIMEOUT_MS);
  let res: Response;
  let html: string;

  try {
    res = await safeWebFetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": WEBSITE_FETCH_USER_AGENT,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      await res.body?.cancel().catch(() => {});
      if (shouldFetchViaFirecrawlAfterHttpStatus(res.status)) {
        return fetchWebsiteHtmlViaFirecrawl(url, true);
      }
      throw new Error(`Website request failed: ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    html = isHtmlContentType(contentType) ? await readTextWithLimit(res, HTML_MAX_BYTES) : "";
  } finally {
    clearTimeout(timeout);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isHtml = isHtmlContentType(contentType);
  const finalUrl = res.url || url;
  assertWebsiteUrl(finalUrl);
  const challengeDetected = isHtml && looksLikeChallengeHtml(html);

  if (challengeDetected) {
    return fetchWebsiteHtmlViaFirecrawl(url, true);
  }

  if (!isHtml) {
    throw new NonWebsiteUrlError();
  }

  return {
    html,
    finalUrl,
    websiteProtected: false,
  };
}

function shouldFetchViaFirecrawlAfterHttpStatus(status: number) {
  return status === 401 || status === 403 || status === 429;
}

export function extractUrlMetadataFromHtmlPage(page: Pick<WebsiteHtmlPage, "html">) {
  return {
    title: extractTitleFromHtml(page.html),
    description: extractDescriptionFromHtml(page.html),
  };
}

export async function fetchUrlMetadata(
  normalized: URL,
  inputUrl: string,
): Promise<UrlMetadataResult> {
  const result: UrlMetadataResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
    websiteProtected: false,
  };

  const page = await fetchWebsiteHtmlPage(normalized.toString());
  const metadata = extractUrlMetadataFromHtmlPage(page);

  result.finalUrl = page.finalUrl;
  result.title = metadata.title;
  result.description = metadata.description;
  result.websiteProtected = page.websiteProtected;

  if (!result.title) {
    result.title = normalized.hostname.replace(/^www\./, "");
  }

  return result;
}
