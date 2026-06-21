import {readTextWithLimit} from "./bounded-reader";
import {isRecord} from "./http";
import {stripWrappingQuotes} from "./html";

const MANIFEST_MAX_BYTES = 1024 * 1024;
const MANIFEST_FETCH_TIMEOUT_MS = 6000;

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

export function dedupeFaviconCandidates<T extends {url: string}>(items: T[]) {
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

export function parseManifestIcons(manifest: unknown): ManifestIcon[] {
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MANIFEST_FETCH_TIMEOUT_MS);
  let manifestJson: unknown;

  try {
    const res = await fetch(manifestUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        accept: "application/json,text/json,*/*;q=0.8",
        "user-agent": "void-enrich-bookmark/1.0",
      },
      signal: controller.signal,
    });
    if (!res.ok) return [];

    manifestJson = JSON.parse(await readTextWithLimit(res, MANIFEST_MAX_BYTES));
  } finally {
    clearTimeout(timeout);
  }

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

export function discoverFaviconCandidatesFromHtml(html: string, baseUrl: string) {
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

export function buildFallbackFaviconCandidates(origin: string): BestIcon[] {
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

export async function fetchBestFaviconFromHtml({
  html,
  baseUrl,
  fallbackOriginUrl = baseUrl,
}: {
  html: string;
  baseUrl: string;
  fallbackOriginUrl?: string;
}): Promise<BestIcon | null> {
  const origin = new URL(fallbackOriginUrl).origin;
  const icons: BestIcon[] = [];

  const discovered = discoverFaviconCandidatesFromHtml(html, baseUrl);
  icons.push(...discovered.icons);

  if (discovered.manifestUrl) {
    const manifestIcons = await discoverFromManifest(discovered.manifestUrl).catch(() => []);
    icons.push(...manifestIcons);
  }

  icons.push(...buildFallbackFaviconCandidates(origin));
  return selectBestFaviconIcon(dedupeFaviconCandidates(icons));
}
