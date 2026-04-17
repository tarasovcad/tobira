import {NextRequest, NextResponse} from "next/server";
import {Receiver} from "@upstash/qstash";
import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {and, eq} from "drizzle-orm";
import {uploadToR2, buildR2PublicUrl} from "@/lib/storage/r2-storage";
import type {PostBookmarkMetadata} from "@/app/home/_types/bookmark-metadata";

export const runtime = "nodejs";

// ── QStash verification ───────────────────────────────────────────────────────

function getQstashReceiver() {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    throw new Error("Missing QSTASH_CURRENT_SIGNING_KEY or QSTASH_NEXT_SIGNING_KEY");
  }
  return new Receiver({currentSigningKey, nextSigningKey});
}

async function verifyQstashRequest(request: NextRequest, rawBody: string): Promise<boolean> {
  const signature = request.headers.get("Upstash-Signature");
  if (!signature) return false;

  const url = new URL(request.url);
  url.search = "";
  url.hash = "";

  try {
    const receiver = getQstashReceiver();
    return await receiver.verify({signature, body: rawBody, url: url.toString()});
  } catch {
    return false;
  }
}

// ── Image URL helpers ─────────────────────────────────────────────────────────

function buildTwitterSizedUrl(url: string, size: "small" | "large"): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("pbs.twimg.com")) return null;
    u.searchParams.set("name", size);
    return u.toString();
  } catch {
    return null;
  }
}

async function downloadAndUpload(sourceUrl: string, r2Key: string): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl, {cache: "no-store"});
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentTypeRaw = res.headers.get("content-type") ?? "image/jpeg";
    const contentType = contentTypeRaw.split(";")[0] ?? "image/jpeg";

    await uploadToR2({key: r2Key, body: buffer, contentType});
    return buildR2PublicUrl(r2Key);
  } catch {
    return null;
  }
}

// ── Media processing ──────────────────────────────────────────────────────────

type ProcessableMediaItem = {
  type: string;
  url: string;
  url_small?: string;
  url_large?: string;
  [key: string]: unknown;
};

async function processMediaItems(
  items: ProcessableMediaItem[],
  bookmarkId: string,
  prefix: string,
): Promise<ProcessableMediaItem[]> {
  return Promise.all(
    items.map(async (item, i) => {
      if (item.type === "video") return item;

      const smallSrcUrl = buildTwitterSizedUrl(item.url, "small");
      const largeSrcUrl = buildTwitterSizedUrl(item.url, "large");

      if (!smallSrcUrl || !largeSrcUrl) return item;

      const [url_small, url_large] = await Promise.all([
        downloadAndUpload(smallSrcUrl, `posts/${bookmarkId}/${prefix}_${i}_small.jpg`),
        downloadAndUpload(largeSrcUrl, `posts/${bookmarkId}/${prefix}_${i}_large.jpg`),
      ]);

      return {
        ...item,
        ...(url_small ? {url_small} : {}),
        ...(url_large ? {url_large} : {}),
      };
    }),
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rawBody = await request.text().catch(() => "");

  const isValid = await verifyQstashRequest(request, rawBody);
  if (!isValid) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  let bookmarkId: string | undefined;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (
      parsed &&
      typeof parsed === "object" &&
      "id" in parsed &&
      typeof (parsed as {id: unknown}).id === "string"
    ) {
      bookmarkId = (parsed as {id: string}).id;
    }
  } catch {
    return NextResponse.json({error: "Invalid payload"}, {status: 400});
  }

  if (!bookmarkId) {
    return NextResponse.json({error: "Missing id"}, {status: 400});
  }

  try {
    const [bookmark] = await db
      .select({id: bookmarks.id, metadata: bookmarks.metadata, userId: bookmarks.userId})
      .from(bookmarks)
      .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.kind, "post")));

    if (!bookmark) {
      return NextResponse.json({error: "Bookmark not found"}, {status: 404});
    }

    const meta = bookmark.metadata as PostBookmarkMetadata;
    if (meta?.platform !== "x") {
      return NextResponse.json({ok: true, skipped: "not an X post"});
    }

    const [processedMain, processedQrt] = await Promise.all([
      processMediaItems((meta.media_extended ?? []) as ProcessableMediaItem[], bookmarkId, "media"),
      meta.qrt?.media_extended?.length
        ? processMediaItems(
            meta.qrt.media_extended as ProcessableMediaItem[],
            bookmarkId,
            "qrt_media",
          )
        : Promise.resolve(meta.qrt?.media_extended ?? []),
    ]);

    const updatedMetadata: PostBookmarkMetadata = {
      ...meta,
      media_extended: processedMain as PostBookmarkMetadata["media_extended"],
      qrt: meta.qrt
        ? {
            ...meta.qrt,
            media_extended: processedQrt as PostBookmarkMetadata["media_extended"],
          }
        : null,
    };

    await db.update(bookmarks).set({metadata: updatedMetadata}).where(eq(bookmarks.id, bookmarkId));
  } catch (error) {
    console.error("process-post-media failed", error);
  }

  return NextResponse.json({ok: true}, {headers: {"cache-control": "no-store"}});
}
