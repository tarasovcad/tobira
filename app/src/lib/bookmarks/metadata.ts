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
  screenshotAccessRestricted?: boolean;
};

export type WebsiteHtmlPage = {
  html: string;
  finalUrl: string;
  screenshotAccessRestricted: boolean;
  firecrawlOgImageUrl?: string;
};

export type DirectUrlMetadataResult =
  | {
      status: "completed";
      title?: string;
      description?: string;
    }
  | {
      status: "deferred";
    };

class NonHtmlUrlError extends Error {
  constructor() {
    super("This URL doesn't point to a webpage");
    this.name = "NonHtmlUrlError";
  }
}

class MetadataEnrichmentRequiredError extends Error {
  constructor() {
    super("Metadata requires background enrichment");
    this.name = "MetadataEnrichmentRequiredError";
  }
}

const WEBSITE_FETCH_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function fetchWebsiteHtmlViaFirecrawl(
  url: string,
  screenshotAccessRestricted: boolean,
): Promise<WebsiteHtmlPage> {
  const firecrawl = await fetchHtmlViaFirecrawl(url);
  const finalUrl = firecrawl.metadata?.sourceURL ?? firecrawl.metadata?.url ?? url;

  return {
    html: firecrawl.rawHtml,
    finalUrl,
    screenshotAccessRestricted,
    firecrawlOgImageUrl: firecrawl.metadata?.ogImage ?? firecrawl.metadata?.["og:image"],
  };
}

export async function fetchWebsiteHtmlPage(
  url: string,
  options: {allowFirecrawl?: boolean} = {},
): Promise<WebsiteHtmlPage> {
  const allowFirecrawl = options.allowFirecrawl ?? true;

  const res = await fetchTextWithTimeout(url, 8000, {
    userAgent: WEBSITE_FETCH_USER_AGENT,
  }).catch((error) => {
    if (!allowFirecrawl) {
      throw new MetadataEnrichmentRequiredError();
    }
    return fetchWebsiteHtmlViaFirecrawl(url, false).catch(() => {
      throw error;
    });
  });

  if (!(res instanceof Response)) return res;

  const contentType = res.headers.get("content-type") ?? "";
  if (!isHtmlContentType(contentType)) {
    throw new NonHtmlUrlError();
  }

  const html = await res.text();
  const finalUrl = res.url || url;
  const challengeDetected = looksLikeChallengeHtml(html);

  if (challengeDetected) {
    if (!allowFirecrawl) {
      throw new MetadataEnrichmentRequiredError();
    }
    return fetchWebsiteHtmlViaFirecrawl(url, true);
  }

  return {
    html,
    finalUrl,
    screenshotAccessRestricted: challengeDetected,
  };
}

export function extractUrlMetadataFromHtmlPage(page: Pick<WebsiteHtmlPage, "html">) {
  return {
    title: extractTitleFromHtml(page.html),
    description: extractDescriptionFromHtml(page.html),
  };
}

export async function fetchDirectUrlMetadata(normalized: URL): Promise<DirectUrlMetadataResult> {
  try {
    const page = await fetchWebsiteHtmlPage(normalized.toString(), {allowFirecrawl: false});
    const metadata = extractUrlMetadataFromHtmlPage(page);
    // console.log(page, "page");
    return {
      status: "completed",
      title: metadata.title,
      description: metadata.description,
    };
  } catch (error) {
    if (error instanceof NonHtmlUrlError) {
      throw error;
    }

    return {
      status: "deferred",
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
  };

  const page = await fetchWebsiteHtmlPage(normalized.toString());
  const metadata = extractUrlMetadataFromHtmlPage(page);

  result.finalUrl = page.finalUrl;
  result.title = metadata.title;
  result.description = metadata.description;
  result.screenshotAccessRestricted = page.screenshotAccessRestricted;

  if (!result.title) {
    result.title = normalized.hostname.replace(/^www\./, "");
  }

  return result;
}
