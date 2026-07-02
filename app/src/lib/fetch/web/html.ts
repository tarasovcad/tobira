export function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function isHtmlContentType(contentType: string) {
  const normalized = contentType.trim().toLowerCase();
  return normalized.includes("text/html") || normalized.includes("application/xhtml");
}

export function decodeHtmlEntitiesMinimal(s: string) {
  // Minimal decoding for common entities found in <title>/<meta>.
  return s
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll(/\s+/g, " ")
    .trim();
}

export function extractMetaContentFromHtml(html: string, key: {name?: string; property?: string}) {
  const keyName = key.name?.toLowerCase();
  const keyProp = key.property?.toLowerCase();

  // Very small/naive HTML parsing via regex (good enough for "simple").
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const nameMatch = /\bname\s*=\s*(".*?"|'.*?'|[^\s>]+)/i.exec(tag);
    const propMatch = /\bproperty\s*=\s*(".*?"|'.*?'|[^\s>]+)/i.exec(tag);
    const contentMatch = /\bcontent\s*=\s*(".*?"|'.*?'|[^\s>]+)/i.exec(tag);

    if (!contentMatch) continue;
    const content = stripWrappingQuotes(contentMatch[1] ?? "");

    if (keyName && nameMatch) {
      const name = stripWrappingQuotes(nameMatch[1] ?? "").toLowerCase();
      if (name === keyName) return decodeHtmlEntitiesMinimal(content);
    }
    if (keyProp && propMatch) {
      const prop = stripWrappingQuotes(propMatch[1] ?? "").toLowerCase();
      if (prop === keyProp) return decodeHtmlEntitiesMinimal(content);
    }
  }

  return undefined;
}

export function extractTitleFromHtml(html: string): string | undefined {
  // Prefer OG title when present, then fallback to <title>.
  const ogTitle = extractMetaContentFromHtml(html, {property: "og:title"});
  if (ogTitle && ogTitle.trim()) return ogTitle.trim();

  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = m ? decodeHtmlEntitiesMinimal(m[1] ?? "") : "";
  const cleaned = title.trim();
  return cleaned || undefined;
}

export function extractDescriptionFromHtml(html: string): string | undefined {
  // Prefer OG description, then standard meta description.
  const og = extractMetaContentFromHtml(html, {property: "og:description"});
  const description = og ?? extractMetaContentFromHtml(html, {name: "description"}) ?? "";
  const cleaned = description.trim();
  return cleaned || undefined;
}

const DOCUMENT_COOKIE_WRITE_REGEX = /\bdocument\s*\.\s*cookie\s*=/i;
const LOCATION_METHOD_NAVIGATION_REGEX = /\blocation\s*\.\s*(?:reload|replace|assign)\s*\(/i;
const LOCATION_HREF_NAVIGATION_REGEX = /\blocation\s*\.\s*href\s*=/i;
const META_REFRESH_REGEX = /<meta\b[^>]*\bhttp-equiv\s*=\s*["']?refresh["']?[^>]*>/i;
const ROBOTS_NOINDEX_REGEX =
  /<meta\b(?=[^>]*\bname\s*=\s*["']?robots["']?)(?=[^>]*\bcontent\s*=\s*["']?[^"'>]*noindex)[^>]*>/i;

function visibleTextLength(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

/**
 * Detects whether the fetched HTML is a Cloudflare, AWS WAF, Imperva, Akamai,
 * DataDome, PerimeterX/HUMAN, Sucuri, or similar bot-challenge page rather
 * than the real site content.
 */
export function looksLikeChallengeHtml(html: string): boolean {
  const lower = html.toLowerCase();

  // Cloudflare
  if (lower.includes("just a moment") && lower.includes("cf-")) return true;
  if (lower.includes("cf-challenge-running") || lower.includes("cf_chl_opt")) return true;
  if (lower.includes("checking your browser") || lower.includes("security verification"))
    return true;
  if (lower.includes("challenges.cloudflare.com")) return true;
  if (lower.includes("enable javascript and cookies to continue")) return true;
  if (lower.includes("enable cookies to continue")) return true;
  if (lower.includes("sorry, you have been blocked")) return true;
  if (lower.includes("cloudflare ray id")) return true;
  if (lower.includes("/cdn-cgi/challenge-platform/")) return true;
  if (lower.includes("please enable cookies") && lower.includes("cf-")) return true;

  // AWS WAF
  if (lower.includes("token.awswaf.com")) return true;
  if (lower.includes("awswafintegration")) return true;
  if (lower.includes("awswafcookiedomainlist")) return true;
  if (lower.includes("window.gokuprops")) return true;
  if (lower.includes("challenge-container") && lower.includes("awswaf")) return true;

  // Imperva / Incapsula
  if (lower.includes("reese84")) return true;
  if (lower.includes("incap_ses") || lower.includes("incap_visid")) return true;
  if (lower.includes("visid_incap")) return true;
  if (lower.includes("protected by incapsula")) return true;
  if (lower.includes("/_incapsula_resource")) return true;

  // Akamai Bot Manager
  if (lower.includes("_abck") || lower.includes("bm_sz")) return true;
  if (lower.includes("akamaibot")) return true;

  // DataDome
  if (lower.includes("datadome") || lower.includes("dd_key")) return true;
  if (lower.includes("captcha-delivery.com")) return true;
  if (lower.includes("protected by datadome")) return true;

  // PerimeterX / HUMAN
  if (lower.includes("px-captcha")) return true;
  if (lower.includes("x-perimeterx")) return true;
  if (lower.includes("press & hold")) return true;

  // Sucuri
  if (lower.includes("sucuri_cloudproxy")) return true;
  if (lower.includes("x-sucuri-id")) return true;

  const writesCookie = DOCUMENT_COOKIE_WRITE_REGEX.test(html);
  const forcesNavigation =
    LOCATION_METHOD_NAVIGATION_REGEX.test(html) ||
    LOCATION_HREF_NAVIGATION_REGEX.test(html) ||
    META_REFRESH_REGEX.test(html);
  const hasNoIndex = ROBOTS_NOINDEX_REGEX.test(html);
  const isSparsePage = html.length < 10000 && visibleTextLength(html) < 120;

  // Generic JavaScript cookie challenge pages
  if (lower.includes("js_challenge_value") && forcesNavigation) return true;
  if (writesCookie && forcesNavigation && (hasNoIndex || isSparsePage)) return true;
  if (
    hasNoIndex &&
    (lower.includes("captcha") ||
      lower.includes("challenge") ||
      lower.includes("bot detection") ||
      lower.includes("security check"))
  ) {
    return true;
  }

  return false;
}

export function extractOgImageUrlFromHtml(html: string) {
  return (
    extractMetaContentFromHtml(html, {property: "og:image:secure_url"}) ??
    extractMetaContentFromHtml(html, {property: "og:image:url"}) ??
    extractMetaContentFromHtml(html, {property: "og:image"})
  );
}
