import {and, eq} from "drizzle-orm";
import {NextRequest, NextResponse} from "next/server";
import {db} from "@/db";
import {bookmarks, type ImageItem, type MediaImages, type VideoItem} from "@/db/schema";
import {downloadAndUploadToR2, verifyQstashRequest} from "@/features/media/server/qstash";
import {existsInR2} from "@/lib/storage/r2-storage";

export const runtime = "nodejs";

type MediaBookmarkItem = MediaImages["items"][number];
type UploadResult = {status: "skipped"} | {status: "success"; key: string} | {status: "failed"};

export async function POST(request: NextRequest) {
  const rawBody = await request.text().catch(() => "");

  if (!(await verifyQstashRequest(request, rawBody))) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const bookmarkId = getBookmarkIdFromBody(rawBody);
  if (bookmarkId instanceof NextResponse) {
    return bookmarkId;
  }

  const bookmark = await getMediaBookmark(bookmarkId);
  if (!bookmark) {
    return NextResponse.json({error: "Bookmark not found"}, {status: 404});
  }

  const images = bookmark.images;
  if (!isMediaImages(images)) {
    return NextResponse.json({ok: true, skipped: "no media items"});
  }

  try {
    const processed = await Promise.all(images.items.map(processMediaBookmarkItem));

    if (processed.some((result) => result.status === "failed")) {
      throw new Error("One or more media uploads failed");
    }

    await db
      .update(bookmarks)
      .set({
        images: {
          processing: false,
          items: processed.map((result) => result.item),
        },
      })
      .where(eq(bookmarks.id, bookmarkId));
  } catch (error) {
    console.error("process-media-bookmark failed", error);
    return NextResponse.json({error: "Processing failed"}, {status: 500});
  }

  return NextResponse.json({ok: true}, {headers: {"cache-control": "no-store"}});
}

function getBookmarkIdFromBody(rawBody: string): string | NextResponse {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({error: "Invalid payload"}, {status: 400});
  }

  if (!parsed || typeof parsed !== "object" || !("id" in parsed) || typeof parsed.id !== "string") {
    return NextResponse.json({error: "Missing id"}, {status: 400});
  }

  return parsed.id;
}

async function getMediaBookmark(bookmarkId: string) {
  const [bookmark] = await db
    .select({id: bookmarks.id, images: bookmarks.images})
    .from(bookmarks)
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.kind, "media")));

  return bookmark ?? null;
}

function isMediaImages(images: unknown): images is MediaImages {
  return !!images && typeof images === "object" && "items" in images && Array.isArray(images.items);
}

async function processMediaBookmarkItem(
  item: MediaBookmarkItem,
): Promise<{item: MediaBookmarkItem; status: UploadResult["status"]}> {
  if (item.type === "image") {
    return processImageItem(item);
  }

  return processVideoItem(item);
}

async function processImageItem(
  item: ImageItem,
): Promise<{item: ImageItem; status: UploadResult["status"]}> {
  const mediaUpload = await ensureUploaded(item.source_url, item.media_key);

  return {
    item: {
      ...item,
      ...(mediaUpload.status === "success" ? {media_key: mediaUpload.key} : {}),
    },
    status: mediaUpload.status,
  };
}

async function processVideoItem(
  item: VideoItem,
): Promise<{item: VideoItem; status: UploadResult["status"]}> {
  const [keyUpload, thumbnailUpload] = await Promise.all([
    ensureUploaded(item.source_url, item.key),
    ensureUploaded(item.source_thumbnail_url, item.key_thumbnail),
  ]);

  const status =
    keyUpload.status === "failed" || thumbnailUpload.status === "failed" ? "failed" : "success";

  return {
    item: {
      ...item,
      ...(keyUpload.status === "success" ? {key: keyUpload.key} : {}),
      ...(thumbnailUpload.status === "success" ? {key_thumbnail: thumbnailUpload.key} : {}),
    },
    status,
  };
}

async function ensureUploaded(
  sourceUrl: string | null | undefined,
  objectKey: string | null | undefined,
): Promise<UploadResult> {
  if (!sourceUrl || !objectKey) {
    return {status: "skipped"};
  }

  if (await existsInR2(objectKey)) {
    return {status: "success", key: objectKey};
  }

  const uploadedKey = await downloadAndUploadToR2(sourceUrl, objectKey);
  if (!uploadedKey) {
    return {status: "failed"};
  }

  return {status: "success", key: uploadedKey};
}
