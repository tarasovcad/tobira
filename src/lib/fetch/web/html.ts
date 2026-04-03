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
  return contentType.includes("text/html") || contentType.includes("application/xhtml");
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

/**
 * Detects whether the fetched HTML is a Cloudflare (or similar) bot-challenge
 * page rather than the real site content.
 */
export function looksLikeChallengeHtml(html: string): boolean {
  const lower = html.toLowerCase();

  if (lower.includes("just a moment") && lower.includes("cf-")) return true;
  if (lower.includes("cf-challenge-running") || lower.includes("cf_chl_opt")) return true;
  if (lower.includes("checking your browser") || lower.includes("security verification"))
    return true;
  if (lower.includes("challenges.cloudflare.com")) return true;
  if (lower.includes("enable javascript and cookies to continue")) return true;

  return false;
}

export function extractOgImageUrlFromHtml(html: string) {
  return (
    extractMetaContentFromHtml(html, {property: "og:image:secure_url"}) ??
    extractMetaContentFromHtml(html, {property: "og:image:url"}) ??
    extractMetaContentFromHtml(html, {property: "og:image"})
  );
}
