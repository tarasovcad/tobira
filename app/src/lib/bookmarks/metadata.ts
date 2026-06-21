import {
  extractDescriptionFromHtml,
  extractTitleFromHtml,
  isHtmlContentType,
  looksLikeChallengeHtml,
} from "@/lib/fetch/web/html";
import {fetchHtmlViaFirecrawl} from "@/lib/fetch/web/screenshot";
import {readTextWithLimit} from "@/lib/fetch/web/bounded-reader";
import {assertWebsiteUrl, NonWebsiteUrlError} from "@/lib/fetch/web/website-url";
import type {WebsiteMetadataOutcome} from "@/lib/bookmarks/website/metadata-outcome";
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

class MetadataEnrichmentRequiredError extends Error {
  constructor(readonly websiteProtected: boolean) {
    super("Metadata requires background enrichment");
    this.name = "MetadataEnrichmentRequiredError";
  }
}

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

export async function fetchWebsiteHtmlPage(
  url: string,
  options: {allowFirecrawl?: boolean; skipDirectFetch?: boolean} = {},
): Promise<WebsiteHtmlPage> {
  const allowFirecrawl = options.allowFirecrawl ?? true;
  assertWebsiteUrl(url);

  if (options.skipDirectFetch) {
    if (!allowFirecrawl) {
      throw new MetadataEnrichmentRequiredError(true);
    }
    return fetchWebsiteHtmlViaFirecrawl(url, true);
  }

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
      if (!allowFirecrawl) {
        throw new MetadataEnrichmentRequiredError(false);
      }
      throw new Error(`Website request failed: ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    html = isHtmlContentType(contentType) ? await readTextWithLimit(res, HTML_MAX_BYTES) : "";
  } catch (error) {
    if (!allowFirecrawl) {
      throw new MetadataEnrichmentRequiredError(false);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isHtml = isHtmlContentType(contentType);
  const finalUrl = res.url || url;
  assertWebsiteUrl(finalUrl);
  const challengeDetected = isHtml && looksLikeChallengeHtml(html);

  if (challengeDetected) {
    if (!allowFirecrawl) {
      throw new MetadataEnrichmentRequiredError(true);
    }
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

export function extractUrlMetadataFromHtmlPage(page: Pick<WebsiteHtmlPage, "html">) {
  return {
    title: extractTitleFromHtml(page.html),
    description: extractDescriptionFromHtml(page.html),
  };
}

export async function fetchDirectUrlMetadata(normalized: URL): Promise<WebsiteMetadataOutcome> {
  try {
    const page = await fetchWebsiteHtmlPage(normalized.toString(), {allowFirecrawl: false});
    const metadata = extractUrlMetadataFromHtmlPage(page);
    return {
      status: "completed",
      title: metadata.title,
      description: metadata.description,
      websiteProtected: false,
    };
  } catch (error) {
    if (error instanceof NonWebsiteUrlError) {
      throw error;
    }

    if (error instanceof MetadataEnrichmentRequiredError && error.websiteProtected) {
      return {
        status: "protected",
        websiteProtected: true,
      };
    }

    return {
      status: "unreachable",
      websiteProtected: false,
    };
  }
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
