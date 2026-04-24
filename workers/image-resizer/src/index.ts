import { PhotonImage, SamplingFilter, resize } from "@cf-wasm/photon/workerd";

export interface Env {
  BOOKMARKS: R2Bucket;
}

const SIZES = {
  thumb: 150,
  small: 680,
  medium: 1200,
  large: 2048,
};

type SizeType = keyof typeof SIZES | "original";
type FormatType = "webp" | "jpg" | "jpeg" | "png" | "original";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // 1. Route guard: Ensure we only process /images/*
    if (!url.pathname.startsWith("/images/")) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (request.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // 2. Parse params
    const sizeParam = (url.searchParams.get("size") || "original") as SizeType;
    // Default to original if no format is provided
    const formatParam = (
      url.searchParams.get("format") || "original"
    ).toLowerCase() as FormatType;

    const originalPath = url.pathname.replace("/images/", "");
    if (!originalPath) {
      return Response.json({ error: "Missing image path" }, { status: 400 });
    }

    // Edge cache lookup
    const cache = caches.default;
    // Remove search params for edge cache key if we want to normalize it,
    // but url with search params is fine because they are part of the cache key.
    const cacheKey = new Request(url.toString(), request);
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      // Tag so you can tell it was a cache hit in DevTools.
      const r = new Response(cachedResponse.body, cachedResponse);
      r.headers.set("cf-cache-status", "HIT");
      return r;
    }

    const r2DerivativeKey = `_cache/${originalPath}__${sizeParam}__${formatParam}`;

    // 3. R2 derivative lookup
    const derivativeObj = await env.BOOKMARKS.get(r2DerivativeKey);
    if (derivativeObj) {
      const headers = new Headers();
      derivativeObj.writeHttpMetadata(headers);
      headers.set("Cache-Control", CACHE_CONTROL);
      headers.set(
        "ETag",
        `W/"${sizeParam}-${formatParam}-${derivativeObj.etag}"`,
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

    // OPTIMIZATION: If they want original size AND original format,
    // we skip processing entirely and just serve the R2 file!
    if (sizeParam === "original" && formatParam === "original") {
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
      if (sizeParam !== "original" && SIZES[sizeParam]) {
        const targetWidth = SIZES[sizeParam];
        const originalWidth = inputImage.get_width();
        const originalHeight = inputImage.get_height();

        if (originalWidth > targetWidth) {
          // Using Lanczos3 for better quality downscaling
          const targetHeight = Math.round(
            (originalHeight / originalWidth) * targetWidth,
          );
          processedImage = resize(
            inputImage,
            targetWidth,
            targetHeight,
            SamplingFilter.Lanczos3,
          );
          resized = true;
        }
      }

      // Determine final output format
      let targetFormat = formatParam;
      if (targetFormat === "original") {
        // Try to guess from original path extension
        const ext = originalPath.split(".").pop()?.toLowerCase();
        if (ext === "jpg" || ext === "jpeg") targetFormat = "jpeg";
        else if (ext === "png") targetFormat = "png";
        else targetFormat = "webp"; // Fallback
      }

      // Format output
      if (targetFormat === "webp") {
        outputBytes = processedImage.get_bytes_webp();
        contentType = "image/webp";
      } else if (targetFormat === "jpg" || targetFormat === "jpeg") {
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
      return Response.json(
        { error: "Image processing failed" },
        { status: 500 },
      );
    }

    // 5. Store derivative back to R2
    await env.BOOKMARKS.put(r2DerivativeKey, outputBytes, {
      httpMetadata: {
        contentType,
      },
    });

    // 6. Respond
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Cache-Control", CACHE_CONTROL);
    responseHeaders.set(
      "ETag",
      `W/"${sizeParam}-${formatParam}-${originalObj.etag}"`,
    );
    responseHeaders.set("cf-cache-status", "MISS");

    const response = new Response(outputBytes, { headers: responseHeaders });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
} satisfies ExportedHandler<Env>;
