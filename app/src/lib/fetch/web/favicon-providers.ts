import {readBufferWithLimit} from "./bounded-reader";
import {browserImageFetchHeaders} from "./http";
import {safeWebFetch} from "./safe-fetch";

const FAVICON_PROVIDER_MAX_BYTES = 2 * 1024 * 1024;
const FAVICON_PROVIDER_FETCH_TIMEOUT_MS = 10_000;

const FAVICON_PROVIDER_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/gif",
  "image/svg+xml",
];

export type DownloadedFaviconAsset = {
  bytes: Buffer;
  contentType: string;
};

export function buildFaviconProviderUrls(domain: string) {
  const encodedDomain = encodeURIComponent(domain);

  return [
    `https://www.google.com/s2/favicons?domain=${encodedDomain}&sz=64`,
    `https://favicon.im/${encodedDomain}`,
    `https://icons.duckduckgo.com/ip3/${encodedDomain}.ico`,
    `https://icon.horse/icon/${encodedDomain}`,
  ];
}

export async function fetchFaviconFromProviders(
  domain: string,
): Promise<DownloadedFaviconAsset | null> {
  for (const url of buildFaviconProviderUrls(domain)) {
    const asset = await fetchProviderFavicon(url).catch(() => null);
    if (asset) return asset;
  }

  return null;
}

async function fetchProviderFavicon(url: string): Promise<DownloadedFaviconAsset | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FAVICON_PROVIDER_FETCH_TIMEOUT_MS);

  try {
    const response = await safeWebFetch(url, {
      method: "GET",
      cache: "no-store",
      headers: browserImageFetchHeaders(url),
      signal: controller.signal,
    });

    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      return null;
    }

    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "image/png";
    const bytes = await readBufferWithLimit(
      response,
      FAVICON_PROVIDER_MAX_BYTES,
      FAVICON_PROVIDER_CONTENT_TYPES,
    );

    return {bytes, contentType};
  } finally {
    clearTimeout(timeout);
  }
}
