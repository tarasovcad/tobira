export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export const WEB_FETCH_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const WEB_FETCH_ACCEPT_LANGUAGE = "en-US,en;q=0.9";

export function urlMetadataRequestHeaders(): HeadersInit {
  return {
    "User-Agent": "url-metadata (+https://www.npmjs.com/package/url-metadata)",
    From: "example@example.com",
  };
}

function sameSiteForRequest(url: string, refererUrl?: string) {
  if (!refererUrl) return "none";

  try {
    return new URL(url).origin === new URL(refererUrl).origin ? "same-origin" : "cross-site";
  } catch {
    return "cross-site";
  }
}

export function browserManifestFetchHeaders(url: string, refererUrl?: string): HeadersInit {
  return {
    "User-Agent": WEB_FETCH_USER_AGENT,
    Accept: "application/manifest+json,application/json,text/json,*/*;q=0.8",
    "Accept-Language": WEB_FETCH_ACCEPT_LANGUAGE,
    ...(refererUrl ? {Referer: refererUrl} : {}),
    "Sec-Fetch-Dest": "manifest",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": sameSiteForRequest(url, refererUrl),
  };
}

export function browserImageFetchHeaders(url: string, refererUrl?: string): HeadersInit {
  return {
    "User-Agent": WEB_FETCH_USER_AGENT,
    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": WEB_FETCH_ACCEPT_LANGUAGE,
    ...(refererUrl ? {Referer: refererUrl} : {}),
    "Sec-Fetch-Dest": "image",
    "Sec-Fetch-Mode": "no-cors",
    "Sec-Fetch-Site": sameSiteForRequest(url, refererUrl),
  };
}
