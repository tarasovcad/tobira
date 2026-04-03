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
  return (
    s
      .replaceAll("&amp;", "&")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      // collapse whitespace
      .replaceAll(/\s+/g, " ")
      .trim()
  );
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

  // Cloudflare "Just a moment..." interstitial
  if (lower.includes("just a moment") && lower.includes("cf-")) return true;

  // Cloudflare challenge markers
  if (lower.includes("cf-challenge-running") || lower.includes("cf_chl_opt")) return true;

  // Cloudflare "Checking your browser" / "Performing security verification"
  if (lower.includes("checking your browser") || lower.includes("security verification"))
    return true;

  // Cloudflare Turnstile challenge
  if (lower.includes("challenges.cloudflare.com")) return true;

  // Generic bot-wall markers
  if (lower.includes("enable javascript and cookies to continue")) return true;

  return false;
}

export function extractOgImageUrlFromHtml(html: string) {
  // Keep it simple: OG image first. (You can add twitter:image and fallbacks later.)
  return (
    extractMetaContentFromHtml(html, {property: "og:image:secure_url"}) ??
    extractMetaContentFromHtml(html, {property: "og:image:url"}) ??
    extractMetaContentFromHtml(html, {property: "og:image"})
  );
}

export function looksLikePrivateHostname(hostname: string) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "0.0.0.0" || h === "127.0.0.1" || h === "::1") return true;
  if (h.endsWith(".local")) return true;

  // Block obvious private IPv4 ranges if hostname is an IPv4 literal.
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!ipv4) return false;
  const parts = ipv4.slice(1).map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export function normalizeInputUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Missing url");
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  const u = new URL(withScheme);
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported");
  }
  if (!u.hostname) throw new Error("Invalid URL hostname");
  if (looksLikePrivateHostname(u.hostname)) throw new Error("Hostname is not allowed");
  return u;
}

export async function fetchTextWithTimeout(
  url: string,
  timeoutMs: number,
  options?: {userAgent?: string; accept?: string},
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        accept:
          options?.accept ?? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": options?.userAgent ?? "void/1.0",
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number,
  options?: {userAgent?: string; accept?: string},
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        accept: options?.accept ?? "application/json,text/json,*/*;q=0.8",
        "user-agent": options?.userAgent ?? "void/1.0",
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// -----------------------------
// Bookmark enrichment helpers
// -----------------------------

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
    // Only keep the attributes we actually use (avoids dynamic key injection).
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

  // Optional <base href="..."> affects relative URL resolution.
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
  // sizes can be: "16x16", "32x32 48x48", "any"
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

    // Favor mid-sized icons for UI previews; still allow very large.
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

    // If the HTML is a Cloudflare challenge, use Browserless to get the real page
    if (html && looksLikeChallengeHtml(html)) {
      try {
        html = await fetchBrowserlessRenderedHtml(url);
        // Update finalUrl since Browserless resolved the actual page
        finalUrl = url;
      } catch {
        // Browserless fallback failed — continue with whatever we got
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

export async function fetchResolvedOgImageUrl(url: string) {
  const res = await fetchTextWithTimeout(url, 8000, {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const contentType = res.headers.get("content-type") ?? "";
  if (!isHtmlContentType(contentType)) return undefined;

  let html = await res.text();

  // Fall back to Browserless rendered HTML if we hit a challenge page
  if (looksLikeChallengeHtml(html)) {
    try {
      html = await fetchBrowserlessRenderedHtml(url);
    } catch {
      return undefined;
    }
  }

  const og = extractOgImageUrlFromHtml(html);
  if (!og) return undefined;
  try {
    return new URL(og, res.url || url).toString();
  } catch {
    return undefined;
  }
}

function arrayBufferToBase64(ab: ArrayBuffer) {
  // Prefer Node's Buffer when available (node runtime), fallback to a Web base64 method.
  if (typeof Buffer !== "undefined") {
    return Buffer.from(ab).toString("base64");
  }
  const btoaFn: ((s: string) => string) | undefined =
    typeof globalThis.btoa === "function" ? globalThis.btoa.bind(globalThis) : undefined;
  if (!btoaFn) {
    throw new Error("Base64 encoding is not available in this runtime");
  }

  const bytes = new Uint8Array(ab);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoaFn(binary);
}

/**
 * Uses Browserless /content endpoint to fetch fully rendered HTML
 * (after JS execution). This handles Cloudflare challenges and JS-rendered SPAs.
 */
export async function fetchBrowserlessRenderedHtml(url: string): Promise<string> {
  const token = process.env.BROWSERLESS_API_KEY;
  if (!token) throw new Error("Missing BROWSERLESS_API_KEY");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(`https://production-sfo.browserless.io/content?token=${token}`, {
      method: "POST",
      headers: {"Cache-Control": "no-cache", "Content-Type": "application/json"},
      body: JSON.stringify({
        url,
        gotoOptions: {waitUntil: "networkidle0", timeout: 15000},
        waitForSelector: {
          selector: "title",
          timeout: 10000,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Browserless content failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`,
      );
    }

    return await response.text();
  } finally {
    clearTimeout(t);
  }
}

export async function fetchBrowserlessScreenshotDataUrl(url: string) {
  const token = process.env.BROWSERLESS_API_KEY;
  if (!token) throw new Error("Missing BROWSERLESS_API_KEY");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(
      `https://production-sfo.browserless.io/screenshot?token=${token}`,
      {
        method: "POST",
        headers: {"Cache-Control": "no-cache", "Content-Type": "application/json"},
        body: JSON.stringify({
          url,
          gotoOptions: {waitUntil: "networkidle0", timeout: 15000},
          waitForSelector: {
            selector: "body",
            timeout: 10000,
          },
          viewport: {width: 1920, height: 1080, deviceScaleFactor: 1},
          options: {
            type: "png",
            fullPage: false,
            clip: {x: 0, y: 0, width: 1920, height: 900},
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Browserless screenshot failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`,
      );
    }

    const contentTypeRaw = response.headers.get("content-type") ?? "image/png";
    const contentType = contentTypeRaw.split(";")[0] ?? "image/png";
    const imageBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(imageBuffer);

    return {
      dataUrl: `data:${contentType};base64,${base64}`,
      contentType,
      bytes: imageBuffer.byteLength,
    };
  } finally {
    clearTimeout(t);
  }
}
