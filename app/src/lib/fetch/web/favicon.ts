import * as cheerio from "cheerio";
import {readTextWithLimit} from "./bounded-reader";
import {browserManifestFetchHeaders, isRecord} from "./http";
import {safeWebFetch} from "./safe-fetch";

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

async function discoverFromManifest(manifestUrl: string, refererUrl?: string): Promise<BestIcon[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MANIFEST_FETCH_TIMEOUT_MS);
  let manifestJson: unknown;

  try {
    const res = await safeWebFetch(manifestUrl, {
      method: "GET",
      cache: "no-store",
      headers: browserManifestFetchHeaders(manifestUrl, refererUrl),
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
  const $ = cheerio.load(html);
  const icons: BestIcon[] = [];

  let effectiveBase = baseUrl;
  const baseHref = $("base[href]").first().attr("href");
  if (baseHref) {
    try {
      effectiveBase = new URL(baseHref, baseUrl).toString();
    } catch {
      // ignore invalid base urls
    }
  }

  let manifestUrl: string | undefined;

  for (const link of $("link").toArray()) {
    const element = $(link);
    const relRaw = (element.attr("rel") ?? "").toLowerCase();
    const hrefRaw = element.attr("href");
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
      rel: element.attr("rel"),
      sizes: element.attr("sizes"),
      type: element.attr("type"),
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
    const manifestIcons = await discoverFromManifest(
      discovered.manifestUrl,
      discovered.effectiveBase,
    ).catch(() => []);
    icons.push(...manifestIcons);
  }

  icons.push(...buildFallbackFaviconCandidates(origin));
  return selectBestFaviconIcon(dedupeFaviconCandidates(icons));
}
