import {NextRequest, NextResponse} from "next/server";
import {stripWrappingQuotes} from "@/lib/fetch/web/html";
import {fetchTextWithTimeout} from "@/lib/fetch/web/http";
import {normalizeInputUrl} from "@/lib/fetch/web/url";

type PreviewImageResult = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  // Backwards-compatible convenience: first resolved image URL (if any).
  imageUrl?: string;
  // All extracted image candidates (OG + Twitter for now).
  images: Array<{
    url: string;
    source: "og" | "twitter";
    alt?: string;
    type?: string;
    width?: number;
    height?: number;
  }>;
};

function decodeHtmlEntities(s: string) {
  // Minimal decoding for common entities found in meta tags.
  return s
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function parseMetaTag(tag: string) {
  const nameMatch = /\bname\s*=\s*(".*?"|'.*?'|[^\s>]+)/i.exec(tag);
  const propMatch = /\bproperty\s*=\s*(".*?"|'.*?'|[^\s>]+)/i.exec(tag);
  const contentMatch = /\bcontent\s*=\s*(".*?"|'.*?'|[^\s>]+)/i.exec(tag);

  const name = nameMatch ? stripWrappingQuotes(nameMatch[1] ?? "").toLowerCase() : undefined;
  const property = propMatch ? stripWrappingQuotes(propMatch[1] ?? "").toLowerCase() : undefined;
  const content = contentMatch
    ? decodeHtmlEntities(stripWrappingQuotes(contentMatch[1] ?? ""))
    : undefined;

  return {name, property, content};
}

function parseMaybeNumber(v: string | undefined) {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
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

function extractImagesFromMeta(html: string) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const images: PreviewImageResult["images"] = [];
  let currentOg: PreviewImageResult["images"][number] | null = null;
  let currentTwitter: PreviewImageResult["images"][number] | null = null;

  for (const tag of metaTags) {
    const {name, property, content} = parseMetaTag(tag);
    if (!content) continue;

    const key = (property ?? name ?? "").toLowerCase();
    if (!key) continue;

    // --- Open Graph images ---
    if (key === "og:image" || key === "og:image:url" || key === "og:image:secure_url") {
      const entry: PreviewImageResult["images"][number] = {url: content, source: "og"};
      images.push(entry);
      currentOg = entry;
      continue;
    }

    if (key === "og:image:alt" && currentOg) {
      currentOg.alt = content;
      continue;
    }
    if (key === "og:image:type" && currentOg) {
      currentOg.type = content;
      continue;
    }
    if (key === "og:image:width" && currentOg) {
      currentOg.width = parseMaybeNumber(content);
      continue;
    }
    if (key === "og:image:height" && currentOg) {
      currentOg.height = parseMaybeNumber(content);
      continue;
    }

    // --- Twitter Card images ---
    if (key === "twitter:image" || key === "twitter:image:src") {
      const entry: PreviewImageResult["images"][number] = {url: content, source: "twitter"};
      images.push(entry);
      currentTwitter = entry;
      continue;
    }
    if (key === "twitter:image:alt" && currentTwitter) {
      currentTwitter.alt = content;
      continue;
    }
  }

  return images;
}

export async function GET(request: NextRequest) {
  const inputUrl = request.nextUrl.searchParams.get("url") ?? "";

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(inputUrl);
  } catch (e) {
    return NextResponse.json(
      {error: e instanceof Error ? e.message : "Invalid url"},
      {status: 400},
    );
  }

  const result: PreviewImageResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
    images: [],
  };

  try {
    const res = await fetchTextWithTimeout(normalized.toString(), 8000, {
      userAgent: "void-preview-image/1.0",
    });
    result.finalUrl = res.url;

    const contentType = res.headers.get("content-type") ?? "";
    const isHtml = contentType.includes("text/html") || contentType.includes("application/xhtml");
    if (!isHtml) {
      return NextResponse.json(result, {headers: {"cache-control": "no-store"}});
    }

    const html = await res.text();
    const extracted = extractImagesFromMeta(html);

    // Resolve any relative URLs against the final fetched URL.
    const base = res.url || normalized.toString();
    result.images = uniqByUrl(
      extracted
        .map((img) => {
          try {
            return {...img, url: new URL(img.url, base).toString()};
          } catch {
            return null;
          }
        })
        .filter((v): v is NonNullable<typeof v> => v !== null),
    );

    result.imageUrl = result.images[0]?.url;
  } catch (e) {
    return NextResponse.json(
      {error: e instanceof Error ? e.message : "Request failed"},
      {status: 500},
    );
  }

  return NextResponse.json(result, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
