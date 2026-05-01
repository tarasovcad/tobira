import {fetchJsonWithTimeout, fetchTextWithTimeout, isRecord} from "./http";
import {isHtmlContentType, looksLikeChallengeHtml, stripWrappingQuotes} from "./html";
import {fetchHtmlViaFirecrawl} from "./screenshot";

export type IconSource = "html" | "manifest" | "fallback";

export type BestIcon = {
  url: string;
  rel?: string;
  sizes?: string;
  type?: string;
  source: IconSource;
};

function parseAttributes(tag: string) {
  const attrs: Partial<Record<"href" | "rel" | "sizes" | "type", string>> = {};
  const re = /([a-zA-Z_:][a-zA-Z0-9_:\-]*)\s*=\s*(".*?"|'.*?'|[^\s>]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tag)) !== null) {
    const key = match[1].toLowerCase();
    const value = stripWrappingQuotes(match[2]);
    if (key === "href") attrs.href = value;
    else if (key === "rel") attrs.rel = value;
    else if (key === "sizes") attrs.sizes = value;
    else if (key === "type") attrs.type = value;
  }
  return attrs;
}

function uniqByUrl<T extends {url: string}>(items: T[]) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!item.url || seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
  }
  return out;
}

type ManifestIcon = {src: string; sizes?: string; type?: string};

function parseManifestIcons(manifest: unknown): ManifestIcon[] {
  if (!isRecord(manifest)) return [];
  if (!Array.isArray(manifest.icons)) return [];

  const out: ManifestIcon[] = [];
  for (const icon of manifest.icons) {
    if (!isRecord(icon) || typeof icon.src !== "string") continue;
    out.push({
      src: icon.src,
      sizes: typeof icon.sizes === "string" ? icon.sizes : undefined,
      type: typeof icon.type === "string" ? icon.type : undefined,
    });
  }
  return out;
}

async function discoverFromManifest(manifestUrl: string): Promise<BestIcon[]> {
  const res = await fetchJsonWithTimeout(manifestUrl, 6000, {
    userAgent: "void-enrich-bookmark/1.0",
  });
  if (!res.ok) return [];

  const manifestJson: unknown = await res.json();
  const icons = parseManifestIcons(manifestJson);

  return icons
    .map((icon) => {
      try {
        return {
          url: new URL(icon.src, manifestUrl).toString(),
          sizes: icon.sizes,
          type: icon.type,
          source: "manifest" as const,
        };
      } catch {
        return null;
      }
    })
    .filter((icon): icon is NonNullable<typeof icon> => icon !== null);
}

function discoverFromHtml(html: string, baseUrl: string) {
  // remove comments from html to prevent <link> tags from being ignored
  const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, "");
  const icons: BestIcon[] = [];

  let effectiveBase = baseUrl;
  const baseMatch = cleanHtml.match(/<base\b[^>]*>/i);
  if (baseMatch) {
    const attrs = parseAttributes(baseMatch[0]);
    if (attrs.href) {
      try {
        effectiveBase = new URL(attrs.href, baseUrl).toString();
      } catch {
        // ignore invalid base urls
      }
    }
  }

  const linkTags = cleanHtml.match(/<link\b[^>]*>/gi) ?? [];
  let manifestUrl: string | undefined;

  for (const tag of linkTags) {
    const attrs = parseAttributes(tag);
    const relRaw = (attrs.rel ?? "").toLowerCase();
    const hrefRaw = attrs.href;
    if (!hrefRaw) continue;

    const relTokens = relRaw.split(/\s+/).filter(Boolean);
    const isIconRel =
      relTokens.includes("icon") ||
      relTokens.includes("shortcut") ||
      relRaw.includes("apple-touch-icon") ||
      relTokens.includes("mask-icon");

    let resolved: string;
    try {
      resolved = new URL(hrefRaw, effectiveBase).toString();
    } catch {
      continue;
    }

    if (relTokens.includes("manifest") && !manifestUrl) {
      manifestUrl = resolved;
    }

    if (!isIconRel) continue;

    icons.push({
      url: resolved,
      rel: attrs.rel,
      sizes: attrs.sizes,
      type: attrs.type,
      source: "html",
    });
  }

  return {icons, manifestUrl, effectiveBase};
}

function fallbackCandidates(origin: string): BestIcon[] {
  return [
    "/apple-touch-icon-precomposed.png",
    "/apple-touch-icon.png",
    "/favicon.png",
    "/favicon.ico",
  ].map((path) => ({
    url: new URL(path, origin).toString(),
    source: "fallback" as const,
  }));
}

function looksLikeSvgIcon(icon: Pick<BestIcon, "url" | "type">) {
  const type = icon.type?.toLowerCase() ?? "";
  if (type.includes("svg")) return true;

  try {
    return new URL(icon.url).pathname.toLowerCase().endsWith(".svg");
  } catch {
    return icon.url.toLowerCase().endsWith(".svg");
  }
}

export function selectBestFaviconIcon(icons: BestIcon[]) {
  const isDiscovered = (i: BestIcon) => i.source !== "fallback";
  const isRaster = (i: BestIcon) => !looksLikeSvgIcon(i);

  // Boost apple-touch-icon to the top of the list so it gets evaluated first
  const sortedIcons = [...icons].sort((a, b) => {
    const aIsApple = a.rel?.toLowerCase().includes("apple-touch-icon") ? 1 : 0;
    const bIsApple = b.rel?.toLowerCase().includes("apple-touch-icon") ? 1 : 0;
    return bIsApple - aIsApple;
  });

  return (
    sortedIcons.find((i) => isDiscovered(i) && isRaster(i)) ??
    sortedIcons.find((i) => isDiscovered(i)) ??
    sortedIcons.find((i) => isRaster(i)) ??
    sortedIcons[0] ??
    null
  );
}

export async function fetchFaviconCandidates(
  url: string,
  options?: {userAgent?: string; timeoutMs?: number},
): Promise<{finalUrl?: string; baseUrl?: string; icons: BestIcon[]}> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const userAgent =
    options?.userAgent ??
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

  const origin = new URL(url).origin;
  const icons: BestIcon[] = [];
  let finalUrl: string | undefined;
  let baseUrl: string | undefined;

  try {
    const htmlRes = await fetchTextWithTimeout(url, timeoutMs, {userAgent});
    finalUrl = htmlRes.url;

    const contentType = htmlRes.headers.get("content-type") ?? "";
    let html = "";
    if (isHtmlContentType(contentType)) {
      //  check if the response size is greater than 150kb and close the connection if so
      if (htmlRes.body) {
        const reader = htmlRes.body.getReader();
        const decoder = new TextDecoder();
        let bytesRead = 0;
        const MAX_BYTES = 150 * 1024; // 150KB cap
        while (true) {
          const {done, value} = await reader.read();
          if (value) {
            html += decoder.decode(value, {stream: true});
            bytesRead += value.length;
          }
          if (done || bytesRead >= MAX_BYTES) {
            html += decoder.decode();
            reader.cancel().catch(() => {});
            break;
          }
        }
      } else {
        html = await htmlRes.text();
      }
    }

    if (html && looksLikeChallengeHtml(html)) {
      try {
        html = (await fetchHtmlViaFirecrawl(url)).rawHtml;
        finalUrl = url;
      } catch {
        // Firecrawl fallback failed; continue with whatever we got.
      }
    }

    const discovered = discoverFromHtml(html, finalUrl || url);
    baseUrl = discovered.effectiveBase;
    icons.push(...discovered.icons);

    if (discovered.manifestUrl) {
      const manifestIcons = await discoverFromManifest(discovered.manifestUrl).catch(() => []);
      icons.push(...manifestIcons);
    }
  } catch {
    // ignore favicon fetch failures, fallbacks still apply
  }

  icons.push(...fallbackCandidates(origin));
  return {finalUrl, baseUrl, icons: uniqByUrl(icons)};
}

export async function fetchBestFaviconOne(
  url: string,
  options?: {userAgent?: string; timeoutMs?: number},
): Promise<BestIcon | null> {
  const {icons} = await fetchFaviconCandidates(url, options);
  return selectBestFaviconIcon(icons);
}
