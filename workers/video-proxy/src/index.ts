export interface Env {
  BOOKMARKS: R2Bucket;
}

const ALLOWED_HOSTS = ["video.twimg.com", "pbs.twimg.com"];
const ALLOWED_ORIGINS = [
  "https://tobira.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

const PROXY_CACHE_CONTROL =
  "public, max-age=86400, stale-while-revalidate=3600";
const R2_CACHE_CONTROL = "public, max-age=31536000, immutable";
const FAVICON_URL = "https://tobira.app/logo/favicon.svg";
const FAVICON_PATHS = new Set(["/favicon.ico", "/favicon.svg"]);
const VIDEO_PREFIX = "videos/";
const TWITTER_VIDEO_HOST = "video.twimg.com";

type ParsedRange = { start: number; end: number } | { invalid: true };

function faviconResponse(): Response {
  return new Response(null, {
    status: 308,
    headers: {
      Location: FAVICON_URL,
      "Cache-Control": R2_CACHE_CONTROL,
    },
  });
}

function corsHeaders(origin: string | null): HeadersInit {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "access-control-allow-headers": "Range, If-None-Match, If-Modified-Since",
    "access-control-expose-headers":
      "Accept-Ranges, Content-Length, Content-Range, Content-Type, ETag",
    vary: "Origin",
  };
}

function jsonError(
  message: string,
  status: number,
  origin: string | null
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
    },
  });
}

function parseRangeHeader(
  rangeHeader: string | null,
  size: number
): ParsedRange | null {
  if (!rangeHeader) {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) {
    return { invalid: true };
  }

  const [, rawStart, rawEnd] = match;

  if (rawStart === "" && rawEnd === "") {
    return { invalid: true };
  }

  if (rawStart === "") {
    const suffixLength = Number(rawEnd);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
      return { invalid: true };
    }

    const start = Math.max(size - suffixLength, 0);
    return { start, end: size - 1 };
  }

  const start = Number(rawStart);
  const end = rawEnd === "" ? size - 1 : Number(rawEnd);

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return { invalid: true };
  }

  return { start, end: Math.min(end, size - 1) };
}

async function handleR2Video(
  request: Request,
  env: Env,
  origin: string | null
): Promise<Response> {
  const url = new URL(request.url);
  const key = url.pathname.startsWith("/")
    ? url.pathname.slice(1)
    : url.pathname;

  if (!key.startsWith(VIDEO_PREFIX) || key.length <= VIDEO_PREFIX.length) {
    return jsonError("Missing video path", 400, origin);
  }

  const head = await env.BOOKMARKS.head(key);
  if (!head) {
    return jsonError("Not found", 404, origin);
  }

  const parsedRange = parseRangeHeader(request.headers.get("range"), head.size);
  if (parsedRange && "invalid" in parsedRange) {
    return new Response(null, {
      status: 416,
      headers: {
        ...corsHeaders(origin),
        "accept-ranges": "bytes",
        "content-range": `bytes */${head.size}`,
      },
    });
  }

  const validRange =
    parsedRange && !("invalid" in parsedRange) ? parsedRange : null;

  const object = await env.BOOKMARKS.get(key, {
    range: validRange
      ? {
          offset: validRange.start,
          length: validRange.end - validRange.start + 1,
        }
      : undefined,
  });

  if (!object) {
    return jsonError("Not found", 404, origin);
  }

  const headers = new Headers(corsHeaders(origin));
  object.writeHttpMetadata(headers);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", R2_CACHE_CONTROL);
  headers.set("etag", object.httpEtag);
  headers.set(
    "content-length",
    String(validRange ? validRange.end - validRange.start + 1 : head.size)
  );
  if (!headers.has("content-type")) {
    headers.set("content-type", "video/mp4");
  }

  const status = validRange ? 206 : 200;
  if (validRange) {
    headers.set(
      "content-range",
      `bytes ${validRange.start}-${validRange.end}/${head.size}`
    );
  }

  return new Response(request.method === "HEAD" ? null : object.body, {
    status,
    headers,
  });
}

async function handleTwitterProxy(
  request: Request,
  origin: string | null,
  targetUrl: string
): Promise<Response> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return jsonError("Invalid url", 400, origin);
  }

  if (parsed.protocol !== "https:") {
    return jsonError("Only HTTPS URLs are allowed", 403, origin);
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return jsonError("Host not allowed", 403, origin);
  }

  const cache = caches.default;
  const cacheKey = new Request(targetUrl, { method: "GET" });
  const cached = request.method === "GET" ? await cache.match(cacheKey) : null;
  if (cached) {
    const response = new Response(cached.body, cached);
    response.headers.set("cf-cache-status", "HIT");
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }
    return response;
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        ...(request.headers.get("range")
          ? { range: request.headers.get("range")! }
          : {}),
      },
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return jsonError(
      isTimeout ? "Upstream timed out" : "Upstream fetch failed",
      isTimeout ? 504 : 502,
      origin
    );
  }

  const headers = new Headers(corsHeaders(origin));
  headers.set(
    "content-type",
    upstream.headers.get("content-type") ?? "video/mp4"
  );
  headers.set("cache-control", PROXY_CACHE_CONTROL);
  headers.set("vary", "Accept-Encoding, Origin");

  const passthroughHeaders = [
    "accept-ranges",
    "content-length",
    "content-range",
    "etag",
    "last-modified",
  ];
  for (const headerName of passthroughHeaders) {
    const value = upstream.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  const response = new Response(
    request.method === "HEAD" ? null : upstream.body,
    {
      status: upstream.status,
      headers,
    }
  );

  if (request.method === "GET" && upstream.status === 200) {
    await cache.put(cacheKey, response.clone());
  }

  return response;
}

function buildPathProxyTarget(url: URL): string | null {
  if (url.pathname === "/") {
    return null;
  }

  return `https://${TWITTER_VIDEO_HOST}${url.pathname}${url.search}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return jsonError("Method not allowed", 405, origin);
    }

    const url = new URL(request.url);
    if (FAVICON_PATHS.has(url.pathname)) {
      return faviconResponse();
    }

    if (url.pathname.startsWith(`/${VIDEO_PREFIX}`)) {
      return handleR2Video(request, env, origin);
    }

    const explicitTargetUrl = url.searchParams.get("url");
    if (explicitTargetUrl) {
      return handleTwitterProxy(request, origin, explicitTargetUrl);
    }

    const pathTargetUrl = buildPathProxyTarget(url);
    if (pathTargetUrl) {
      return handleTwitterProxy(request, origin, pathTargetUrl);
    }

    return jsonError("Missing proxy path", 400, origin);
  },
} satisfies ExportedHandler<Env>;
