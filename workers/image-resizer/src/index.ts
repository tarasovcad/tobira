import {
  PhotonImage,
  SamplingFilter,
  resize,
  crop,
} from "@cf-wasm/photon/workerd";

export interface Env {
  BOOKMARKS: R2Bucket;
}

const SIZES = {
  thumb: 50,
  small: 680,
  medium: 2048,
} as const;

type ResizeSizeType = keyof typeof SIZES;
type SizeType = ResizeSizeType | "large" | "orig";
type FormatType = "webp" | "jpg" | "jpeg" | "png";

const CACHE_CONTROL = "public, max-age=31536000, immutable";
const FAVICON_URL = "https://tobira.app/logo/favicon.svg";
const FAVICON_PATHS = new Set(["/favicon.ico", "/favicon.svg"]);

function normalizeSizeParam(size: string | null): SizeType {
  if (size === "thumb" || size === "small" || size === "medium") {
    return size;
  }

  // "orig" and "large" both return the original/passthrough size. Legacy
  // "original" and missing/unknown values also use the same behavior.
  if (size === "orig") {
    return "orig";
  }

  return "large";
}

function normalizeFormatParam(format: string | null): FormatType {
  const normalized = format?.toLowerCase();

  if (
    normalized === "webp" ||
    normalized === "jpg" ||
    normalized === "jpeg" ||
    normalized === "png"
  ) {
    return normalized;
  }

  return "webp";
}

function buildCacheKeyUrl(
  url: URL,
  size: SizeType,
  format: FormatType,
  sourceEtag: string
) {
  const cacheUrl = new URL(url.origin);
  cacheUrl.pathname = url.pathname;
  cacheUrl.searchParams.set("size", size);
  cacheUrl.searchParams.set("source_etag", sourceEtag);

  if (size !== "large" && size !== "orig") {
    cacheUrl.searchParams.set("format", format);
  }

  return cacheUrl;
}

function buildDerivativeKey(
  originalPath: string,
  sourceEtag: string,
  size: ResizeSizeType,
  format: FormatType
) {
  return `_cache/${originalPath}__${sourceEtag}__${size}__${format}`;
}

function faviconResponse(): Response {
  return new Response(null, {
    status: 308,
    headers: {
      Location: FAVICON_URL,
      "Cache-Control": CACHE_CONTROL,
    },
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (FAVICON_PATHS.has(url.pathname)) {
      return faviconResponse();
    }

    if (request.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // 2. Parse params
    const sizeParam = normalizeSizeParam(url.searchParams.get("size"));
    const formatParam = normalizeFormatParam(url.searchParams.get("format"));

    const originalPath = url.pathname.startsWith("/")
      ? url.pathname.slice(1)
      : url.pathname;
    if (!originalPath) {
      return Response.json({ error: "Missing image path" }, { status: 400 });
    }

    const originalHead = await env.BOOKMARKS.head(originalPath);
    if (!originalHead) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Edge cache lookup
    const cache = caches.default;
    // Include the source ETag so reused paths do not share stale cache entries.
    const cacheKeyUrl = buildCacheKeyUrl(
      url,
      sizeParam,
      formatParam,
      originalHead.etag
    );
    const cacheKey = new Request(cacheKeyUrl.toString(), request);
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      // Tag so you can tell it was a cache hit in DevTools.
      const r = new Response(cachedResponse.body, cachedResponse);
      r.headers.set("cf-cache-status", "HIT");
      return r;
    }

    // 3. R2 derivative lookup
    const derivativeObj =
      sizeParam === "large" || sizeParam === "orig"
        ? null
        : await env.BOOKMARKS.get(
            buildDerivativeKey(
              originalPath,
              originalHead.etag,
              sizeParam,
              formatParam
            )
          );
    if (derivativeObj) {
      const headers = new Headers();
      derivativeObj.writeHttpMetadata(headers);
      headers.set("Cache-Control", CACHE_CONTROL);
      headers.set(
        "ETag",
        `W/"${sizeParam}-${formatParam}-${originalHead.etag}"`
      );
      headers.set("cf-cache-status", "MISS-R2-HIT"); // Custom header for debugging

      const response = new Response(derivativeObj.body, { headers });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    // 4. Fetch original
    const originalObj = await env.BOOKMARKS.get(originalPath);
    if (!originalObj) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // "large" and "orig" are the original R2 object and do not go through Photon.
    if (sizeParam === "large" || sizeParam === "orig") {
      const headers = new Headers();
      originalObj.writeHttpMetadata(headers);
      headers.set("Cache-Control", CACHE_CONTROL);
      headers.set("cf-cache-status", "MISS-R2-PASSTHROUGH");

      const response = new Response(originalObj.body, { headers });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    const inputBytes = new Uint8Array(await originalObj.arrayBuffer());
    let outputBytes: Uint8Array;
    let contentType: string;

    try {
      const inputImage = PhotonImage.new_from_byteslice(inputBytes);

      let processedImage = inputImage;
      let resized = false;

      // Resize if needed
      if (sizeParam in SIZES) {
        const targetWidth = SIZES[sizeParam];
        const originalWidth = inputImage.get_width();
        const originalHeight = inputImage.get_height();

        if (sizeParam === "thumb") {
          // Exact square with center crop
          const targetSize = targetWidth;
          const scale = Math.max(
            targetSize / originalWidth,
            targetSize / originalHeight
          );
          const scaledWidth = Math.max(
            targetSize,
            Math.round(originalWidth * scale)
          );
          const scaledHeight = Math.max(
            targetSize,
            Math.round(originalHeight * scale)
          );

          let scaledImage = inputImage;
          let needsFree = false;

          if (
            scaledWidth !== originalWidth ||
            scaledHeight !== originalHeight
          ) {
            scaledImage = resize(
              inputImage,
              scaledWidth,
              scaledHeight,
              SamplingFilter.Lanczos3
            );
            needsFree = true;
          }

          const x1 = Math.floor((scaledWidth - targetSize) / 2);
          const y1 = Math.floor((scaledHeight - targetSize) / 2);

          processedImage = crop(
            scaledImage,
            x1,
            y1,
            x1 + targetSize,
            y1 + targetSize
          );

          if (needsFree) {
            scaledImage.free();
          }
          resized = true;
        } else if (originalWidth > targetWidth) {
          // Using Lanczos3 for better quality downscaling
          const targetHeight = Math.round(
            (originalHeight / originalWidth) * targetWidth
          );
          processedImage = resize(
            inputImage,
            targetWidth,
            targetHeight,
            SamplingFilter.Lanczos3
          );
          resized = true;
        }
      }

      // Format output
      if (formatParam === "webp") {
        outputBytes = processedImage.get_bytes_webp();
        contentType = "image/webp";
      } else if (formatParam === "jpg" || formatParam === "jpeg") {
        // Quality 85 is a good balance for jpeg
        outputBytes = processedImage.get_bytes_jpeg(85);
        contentType = "image/jpeg";
      } else {
        outputBytes = processedImage.get_bytes();
        contentType = "image/png";
      }

      // Cleanup WASM memory
      if (resized) {
        processedImage.free();
      }
      inputImage.free();
    } catch (e) {
      console.error("Photon processing error:", e);
      const headers = new Headers();
      originalObj.writeHttpMetadata(headers);
      headers.set("Cache-Control", "no-store");
      headers.set("cf-cache-status", "MISS-R2-PASSTHROUGH-ERROR");
      headers.set("ETag", `W/"original-${originalObj.etag}"`);
      headers.set("x-image-derivative-error", "1");

      const response = new Response(inputBytes, { headers });
      return response;
    }

    // 5. Store derivative back to R2
    await env.BOOKMARKS.put(
      buildDerivativeKey(
        originalPath,
        originalHead.etag,
        sizeParam,
        formatParam
      ),
      outputBytes,
      {
        httpMetadata: {
          contentType,
        },
      }
    );

    // 6. Respond
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Cache-Control", CACHE_CONTROL);
    responseHeaders.set(
      "ETag",
      `W/"${sizeParam}-${formatParam}-${originalObj.etag}"`
    );
    responseHeaders.set("cf-cache-status", "MISS");

    const response = new Response(outputBytes, { headers: responseHeaders });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
} satisfies ExportedHandler<Env>;
