import {NextRequest, NextResponse} from "next/server";
import {fetchBestFaviconOne} from "@/lib/fetch/web/favicon";
import {isRecord} from "@/lib/fetch/web/http";
import {fetchResolvedOgImageUrl} from "@/lib/fetch/web/og";
import {
  fetchScreenshotDataUrlViaCloudflare,
  fetchScreenshotDataUrlViaFirecrawl,
  isScreenshotAccessRestrictionError,
} from "@/lib/fetch/web/screenshot";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import {buildWebsiteImageKeys} from "@/features/media/utils";
import {uploadToR2, existsInR2} from "@/lib/storage/r2-storage";
import {Receiver} from "@upstash/qstash";
import DOMPurify from "isomorphic-dompurify";
import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {eq, sql} from "drizzle-orm";

export async function POST(request: NextRequest) {
  const rawBody = await request.text().catch(() => "");

  const isValid = await verifyQstashRequest(request, rawBody);
  if (!isValid) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const payload = await readJobPayload(request, rawBody);
  if (!payload.id) {
    return NextResponse.json({error: "Missing id"}, {status: 400});
  }

  try {
    await runEnrichment(payload.id);
  } catch (e) {
    console.error("enrich-bookmark failed", e);
    return NextResponse.json(
      {error: "Failed to enrich bookmark"},
      {
        status: 500,
        headers: {"cache-control": "no-store"},
      },
    );
  }

  return NextResponse.json(
    {success: true},
    {
      headers: {"cache-control": "no-store"},
    },
  );
}

/*
FUNCTIONS AND HELPERS
*/
export const runtime = "nodejs";

type WebsiteBookmarkProcessingInfo = {
  id: string;
  url: string;
  metadata: unknown;
};

function getQstashReceiver() {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    throw new Error("Missing QSTASH_CURRENT_SIGNING_KEY or QSTASH_NEXT_SIGNING_KEY");
  }
  return new Receiver({currentSigningKey, nextSigningKey});
}

async function verifyQstashRequest(request: NextRequest, rawBody: string) {
  const signature = request.headers.get("Upstash-Signature");
  if (!signature) return false;

  const url = new URL(request.url);
  url.search = "";
  url.hash = "";

  try {
    const receiver = getQstashReceiver();
    return await receiver.verify({
      signature,
      body: rawBody,
      url: url.toString(),
    });
  } catch {
    return false;
  }
}

async function readJobPayload(request: NextRequest, rawBody: string): Promise<{id?: string}> {
  const idFromQuery = request.nextUrl.searchParams.get("id") ?? undefined;
  if (idFromQuery) return {id: idFromQuery};

  if (!rawBody) return {};
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!isRecord(parsed)) return {};
    return {id: typeof parsed.id === "string" ? parsed.id : undefined};
  } catch {
    return {};
  }
}

async function uploadBytesToR2(opts: {objectKey: string; bytes: Buffer; contentType: string}) {
  await uploadToR2({
    key: opts.objectKey,
    body: opts.bytes,
    contentType: opts.contentType,
  });
}

async function uploadFaviconToR2(bestIconUrl: string, normalizedUrl: string) {
  const iconRes = await fetch(bestIconUrl, {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
    headers: {"user-agent": "void-enrich-bookmark/1.0"},
  });

  if (!iconRes.ok) return;

  const contentTypeRaw = iconRes.headers.get("content-type") ?? "image/png";
  const contentType = contentTypeRaw.split(";")[0] ?? "image/png";
  let bytes = Buffer.from(await iconRes.arrayBuffer());

  // Sanitize SVGs to prevent XSS while allowing foreignObject and basic HTML
  if (contentType.includes("svg") || bestIconUrl.toLowerCase().endsWith(".svg")) {
    const svgString = bytes.toString("utf-8");
    const sanitizedSvg = DOMPurify.sanitize(svgString, {
      USE_PROFILES: {svg: true, svgFilters: true, html: true},
      ADD_TAGS: ["foreignObject"],
      HTML_INTEGRATION_POINTS: {foreignobject: true},
    });
    bytes = Buffer.from(sanitizedSvg, "utf-8");
  }

  const objectKey = (await buildWebsiteImageKeys(normalizedUrl)).favicon;

  await uploadBytesToR2({
    objectKey,
    bytes,
    contentType,
  });
}

async function uploadOgImageToR2(ogImageUrl: string, normalizedUrl: string) {
  const res = await fetch(ogImageUrl, {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
    headers: {"user-agent": "void-enrich-bookmark/1.0"},
  });
  if (!res.ok) return;

  const contentTypeRaw = res.headers.get("content-type") ?? "image/png";
  const contentType = contentTypeRaw.split(";")[0] ?? "image/png";
  const bytes = Buffer.from(await res.arrayBuffer());

  const objectKey = (await buildWebsiteImageKeys(normalizedUrl)).og;

  await uploadBytesToR2({
    objectKey,
    bytes,
    contentType,
  });
}

function decodeBase64DataUrl(dataUrl: string) {
  const idx = dataUrl.indexOf("base64,");
  if (idx === -1) throw new Error("Invalid dataUrl: missing base64,");
  const base64 = dataUrl.slice(idx + "base64,".length);
  return Buffer.from(base64, "base64");
}

async function uploadPreviewToR2(
  screenshot: {dataUrl: string; contentType: string},
  normalizedUrl: string,
) {
  const bytes = decodeBase64DataUrl(screenshot.dataUrl);
  const objectKey = (await buildWebsiteImageKeys(normalizedUrl)).preview;

  await uploadBytesToR2({
    objectKey,
    bytes,
    contentType: screenshot.contentType || "image/png",
  });
}

async function getWebsiteBookmarkProcessingInfo(
  bookmarkId: string,
): Promise<WebsiteBookmarkProcessingInfo | null> {
  const [bookmark] = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      kind: bookmarks.kind,
      metadata: bookmarks.metadata,
    })
    .from(bookmarks)
    .where(eq(bookmarks.id, bookmarkId))
    .limit(1);

  if (!bookmark || bookmark.kind !== "website") return null;
  return {id: bookmark.id, url: bookmark.url, metadata: bookmark.metadata};
}

function hasScreenshotAccessRestricted(metadata: unknown) {
  return isRecord(metadata) && metadata.screenshotAccessRestricted === true;
}

async function markScreenshotAccessRestricted(bookmarkId: string) {
  await db
    .update(bookmarks)
    .set({
      metadata: sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{screenshotAccessRestricted}', 'true'::jsonb, true)`,
    })
    .where(eq(bookmarks.id, bookmarkId));
}

async function fetchPreviewScreenshot(url: string, bookmark: WebsiteBookmarkProcessingInfo | null) {
  if (hasScreenshotAccessRestricted(bookmark?.metadata)) {
    return fetchScreenshotDataUrlViaFirecrawl(url);
  }

  try {
    return await fetchScreenshotDataUrlViaCloudflare(url);
  } catch (error) {
    if (!isScreenshotAccessRestrictionError(error)) {
      throw error;
    }

    if (bookmark) {
      await markScreenshotAccessRestricted(bookmark.id);
    }

    return fetchScreenshotDataUrlViaFirecrawl(url);
  }
}

async function runEnrichment(bookmarkId: string) {
  const bookmark = await getWebsiteBookmarkProcessingInfo(bookmarkId);
  if (!bookmark) return;

  const normalized = normalizeInputUrl(bookmark.url).toString();

  const keys = await buildWebsiteImageKeys(normalized);

  const fetchAndUpload = async <T>(
    label: string,
    key: string,
    fetchFn: () => Promise<T>,
    uploadFn: (data: T) => Promise<void>,
  ) => {
    if (await existsInR2(key)) {
      return;
    }
    const data = await fetchFn();
    if (data) {
      await uploadFn(data);
    }
  };

  const results = await Promise.allSettled([
    fetchAndUpload(
      "favicon",
      keys.favicon,
      () => fetchBestFaviconOne(normalized),
      async (best) => {
        if (best?.url) {
          await uploadFaviconToR2(best.url, normalized);
        }
      },
    ),
    fetchAndUpload(
      "og",
      keys.og,
      () => fetchResolvedOgImageUrl(normalized),
      async (ogUrl) => {
        if (typeof ogUrl === "string" && ogUrl) {
          await uploadOgImageToR2(ogUrl, normalized);
        }
      },
    ),
    fetchAndUpload(
      "preview",
      keys.preview,
      () => fetchPreviewScreenshot(normalized, bookmark),
      async (preview) => {
        if (
          preview &&
          typeof preview.dataUrl === "string" &&
          typeof preview.contentType === "string"
        ) {
          await uploadPreviewToR2(preview, normalized);
        }
      },
    ),
  ]);

  const failures = results
    .map((result, index) => ({
      result,
      label: ["favicon", "og", "preview"][index],
    }))
    .filter(
      (item): item is {result: PromiseRejectedResult; label: string} =>
        item.result.status === "rejected",
    );

  if (failures.length > 0) {
    console.error("website enrichment failed", {
      bookmarkId: bookmark.id,
      url: normalized,
      failures: failures.map((failure) => ({
        label: failure.label,
        reason: failure.result.reason,
      })),
    });
    throw new Error(
      `Website enrichment failed for ${failures.map((failure) => failure.label).join(", ")}`,
    );
  }
}
