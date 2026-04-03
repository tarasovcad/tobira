import {fetchJsonWithTimeout, fetchTextWithTimeout, isRecord} from "./http";
import {isHtmlContentType, looksLikeChallengeHtml, stripWrappingQuotes} from "./html";
import {fetchBrowserlessRenderedHtml} from "./screenshot";

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
    const key = item.url;
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

type ManifestIcon = {src: string; sizes?: string; type?: string};

function parseManifestIcons(manifest: unknown): ManifestIcon[] {
  if (!isRecord(manifest)) return [];
  const icons = manifest.icons;
  if (!Array.isArray(icons)) return [];

  const out: ManifestIcon[] = [];
  for (const icon of icons) {
    if (!isRecord(icon)) continue;
    if (typeof icon.src !== "string") continue;
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
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

function discoverFromHtml(html: string, baseUrl: string) {
  const icons: BestIcon[] = [];

  let effectiveBase = baseUrl;
  const baseMatch = html.match(/<base\b[^>]*>/i);
  if (baseMatch) {
    const attrs = parseAttributes(baseMatch[0]);
    const href = attrs.href;
    if (href) {
      try {
        effectiveBase = new URL(href, baseUrl).toString();
      } catch {
        // ignore
      }
    }
  }

  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
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
      relTokens.includes("shortcut-icon") ||
      relRaw.includes("apple-touch-icon") ||
      relTokens.includes("mask-icon");

    const isManifest = relTokens.includes("manifest");

    let resolved: string;
    try {
      resolved = new URL(hrefRaw, effectiveBase).toString();
    } catch {
      continue;
    }

    if (isManifest && !manifestUrl) {
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
  const paths = [
    "/favicon.ico",
    "/favicon.png",
    "/apple-touch-icon.png",
    "/apple-touch-icon-precomposed.png",
  ];
  return paths.map((p) => ({
    url: new URL(p, origin).toString(),
    source: "fallback" as const,
  }));
}

function parseLargestSquareSize(sizes?: string) {
  if (!sizes) return undefined;
  const parts = sizes.split(/\s+/).filter(Boolean);
  let best: number | undefined;
  for (const part of parts) {
    if (part.toLowerCase() === "any") continue;
    const m = /^(\d+)\s*x\s*(\d+)$/i.exec(part);
    if (!m) continue;
    const w = Number(m[1]);
    const h = Number(m[2]);
    if (!Number.isFinite(w) || !Number.isFinite(h)) continue;
    if (w !== h) continue;
    best = best === undefined ? w : Math.max(best, w);
  }
  return best;
}

function guessTypeFromUrl(url: string) {
  const pathname = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".svg")) return "image/svg+xml";
  if (pathname.endsWith(".ico")) return "image/x-icon";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  return undefined;
}

function typeRank(mime?: string) {
  const t = (mime ?? "").toLowerCase();
  if (t.includes("png")) return 5;
  if (t.includes("svg")) return 4;
  if (t.includes("icon") || t.includes("ico")) return 3;
  if (t.includes("webp")) return 2;
  if (t.includes("jpeg") || t.includes("jpg")) return 1;
  return 0;
}

function sourceRank(source: IconSource) {
  if (source === "html") return 3;
  if (source === "manifest") return 2;
  return 1;
}

function relRank(rel?: string) {
  const r = (rel ?? "").toLowerCase();
  if (!r) return 0;
  if (r.split(/\s+/).includes("icon")) return 3;
  if (r.includes("apple-touch-icon")) return 2;
  if (r.split(/\s+/).includes("mask-icon")) return 1;
  return 0;
}

function selectBestIcon(icons: BestIcon[]) {
  if (icons.length === 0) return null;
  const scored = icons.map((icon) => {
    const inferredType = icon.type ?? guessTypeFromUrl(icon.url);
    const size = parseLargestSquareSize(icon.sizes);
    const sizeScore = size === undefined ? 0 : size >= 64 && size <= 256 ? 3 : size >= 32 ? 2 : 1;

    const score =
      sourceRank(icon.source) * 1000 +
      typeRank(inferredType) * 100 +
      sizeScore * 10 +
      relRank(icon.rel);

    return {icon, score};
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.icon ?? null;
}

export function selectBestFaviconIcon(icons: BestIcon[]) {
  return selectBestIcon(icons);
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
    let html = isHtmlContentType(contentType) ? await htmlRes.text() : "";

    if (html && looksLikeChallengeHtml(html)) {
      try {
        html = await fetchBrowserlessRenderedHtml(url);
        finalUrl = url;
      } catch {
        // Browserless fallback failed; continue with whatever we got.
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
  const unique = uniqByUrl(icons);
  return {finalUrl, baseUrl, icons: unique};
}

export async function fetchBestFaviconOne(
  url: string,
  options?: {userAgent?: string; timeoutMs?: number},
): Promise<BestIcon | null> {
  const {icons} = await fetchFaviconCandidates(url, options);
  return selectBestIcon(icons);
}
