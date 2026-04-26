function arrayBufferToBase64(ab: ArrayBuffer) {
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

type ScreenshotDataUrl = {
  dataUrl: string;
  contentType: string;
  bytes: number;
};

type FirecrawlScrapeMetadata = {
  ogImage?: string;
  sourceURL?: string;
  url?: string;
  ["og:image"]?: string;
};

type FirecrawlScrapeResponse = {
  success?: boolean;
  data?: {
    rawHtml?: string;
    screenshot?: string;
    metadata?: FirecrawlScrapeMetadata;
  };
};

type FirecrawlHtmlData = {
  rawHtml: string;
  metadata?: FirecrawlScrapeMetadata;
};

export async function fetchHtmlViaFirecrawl(url: string): Promise<FirecrawlHtmlData> {
  const token = process.env.FIRECRAWL_API_KEY;
  if (!token) throw new Error("Missing FIRECRAWL_API_KEY");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        onlyMainContent: false,
        maxAge: 172800000,
        parsers: [],
        formats: ["rawHtml"],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Firecrawl HTML request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`,
      );
    }

    const payload = (await response.json()) as FirecrawlScrapeResponse;
    const rawHtml = payload.data?.rawHtml;
    if (!payload.success || typeof rawHtml !== "string" || !rawHtml) {
      throw new Error("Firecrawl HTML response did not include HTML content");
    }

    return {
      rawHtml,
      metadata: payload.data?.metadata,
    };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchScreenshotDataUrl(url: string): Promise<ScreenshotDataUrl> {
  const token = process.env.FIRECRAWL_API_KEY;
  if (!token) throw new Error("Missing FIRECRAWL_API_KEY");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: [
          {
            type: "screenshot",
            fullPage: false,
            viewport: {width: 1920, height: 1080},
          },
        ],
        maxAge: 0,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Firecrawl screenshot request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`,
      );
    }

    const payload = (await response.json()) as FirecrawlScrapeResponse;
    const screenshotUrl = payload.data?.screenshot;
    if (!payload.success || typeof screenshotUrl !== "string" || !screenshotUrl) {
      throw new Error("Firecrawl screenshot response did not include a screenshot URL");
    }

    const imageResponse = await fetch(screenshotUrl, {
      method: "GET",
      cache: "no-store",
      headers: {"user-agent": "void-enrich-bookmark/1.0"},
      signal: controller.signal,
    });

    if (!imageResponse.ok) {
      const text = await imageResponse.text().catch(() => "");
      throw new Error(
        `Firecrawl screenshot download failed: ${imageResponse.status} ${imageResponse.statusText}${text ? ` - ${text}` : ""}`,
      );
    }

    const contentTypeRaw = imageResponse.headers.get("content-type") ?? "image/png";
    const contentType = contentTypeRaw.split(";")[0] ?? "image/png";
    const imageBuffer = await imageResponse.arrayBuffer();
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
