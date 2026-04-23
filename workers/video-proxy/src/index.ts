const ALLOWED_HOSTS = ["video.twimg.com", "pbs.twimg.com"];

// Aggressive cache — Twitter URLs are content-addressed (immutable).
const CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=3600";

// Allow requests from your production domain and localhost dev.
const ALLOWED_ORIGINS = [
  "https://tobira.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

function corsHeaders(origin: string | null): HeadersInit {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "access-control-allow-origin": allowed,
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "Range",
    "access-control-expose-headers":
      "Content-Length, Content-Range, Accept-Ranges",
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    const origin = request.headers.get("origin");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return Response.json({ error: "Missing url parameter" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return Response.json({ error: "Invalid url" }, { status: 400 });
    }

    if (parsed.protocol !== "https:") {
      return Response.json(
        { error: "Only HTTPS URLs are allowed" },
        { status: 403 },
      );
    }

    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return Response.json({ error: "Host not allowed" }, { status: 403 });
    }

    // Use Cloudflare's built-in cache API to avoid re-fetching the same video
    // chunk on the same edge PoP.
    const cache = caches.default;
    const cacheKey = new Request(targetUrl, { method: "GET" });
    const cached = await cache.match(cacheKey);
    if (cached) {
      const r = new Response(cached.body, cached);
      // Tag so you can tell it was a cache hit in DevTools.
      r.headers.set("cf-cache-status", "HIT");
      Object.entries(corsHeaders(origin)).forEach(([k, v]) =>
        r.headers.set(k, v),
      );
      return r;
    }

    let upstream: Response;
    try {
      upstream = await fetch(targetUrl, {
        signal: AbortSignal.timeout(15_000),
        headers: {
          // Forward Range so video seeking (byte-range requests) works.
          ...(request.headers.get("range")
            ? { range: request.headers.get("range")! }
            : {}),
        },
        // Deliberately omit Referer — that's the whole point of the proxy.
      });
    } catch (e) {
      const isTimeout =
        e instanceof Error &&
        (e.name === "TimeoutError" || e.name === "AbortError");
      return Response.json(
        { error: isTimeout ? "Upstream timed out" : "Upstream fetch failed" },
        { status: isTimeout ? 504 : 502 },
      );
    }

    const headers = new Headers(corsHeaders(origin));
    headers.set(
      "content-type",
      upstream.headers.get("content-type") ?? "video/mp4",
    );
    headers.set("cache-control", CACHE_CONTROL);
    headers.set("vary", "Accept-Encoding");

    const cl = upstream.headers.get("content-length");
    const cr = upstream.headers.get("content-range");
    const ar = upstream.headers.get("accept-ranges");
    if (cl) headers.set("content-length", cl);
    if (cr) headers.set("content-range", cr);
    if (ar) headers.set("accept-ranges", ar);

    const response = new Response(upstream.body, {
      status: upstream.status,
      headers,
    });

    // Only cache full responses (not partial 206 range responses).
    if (upstream.status === 200) {
      // clone() is required because the body can only be consumed once.
      await cache.put(cacheKey, response.clone());
    }

    return response;
  },
} satisfies ExportedHandler;
