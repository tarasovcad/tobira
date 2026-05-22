import {NextRequest, NextResponse} from "next/server";
import {and, eq} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks, type ImageItem, type PostImages, type VideoItem} from "@/db/schema";
import {downloadAndUploadToR2, verifyQstashRequest} from "@/features/media/server/qstash";
import {existsInR2} from "@/lib/storage/r2-storage";

export const runtime = "nodejs";

type PostMediaItem = PostImages["items"][number];
type UploadResult = {status: "skipped"} | {status: "success"; key: string} | {status: "failed"};
type ProcessedMediaItem<T extends PostMediaItem = PostMediaItem> = {
  item: T;
  status: UploadResult["status"];
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text().catch(() => "");

  if (!(await verifyQstashRequest(request, rawBody))) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const bookmarkId = getBookmarkIdFromBody(rawBody);
  if (bookmarkId instanceof NextResponse) {
    return bookmarkId;
  }

  try {
    const bookmark = await getPostBookmark(bookmarkId);
    if (!bookmark) {
      return NextResponse.json({error: "Bookmark not found"}, {status: 404});
    }

    if (!isPostImages(bookmark.images)) {
      return NextResponse.json({ok: true, skipped: "no post media items"});
    }

    await processPostImages(bookmarkId, bookmark.images);
  } catch (error) {
    console.error("process-post-media failed", error);
    return NextResponse.json({error: "Processing failed"}, {status: 500});
  }

  return NextResponse.json({ok: true}, {headers: {"cache-control": "no-store"}});
}

async function getPostBookmark(bookmarkId: string) {
  const [bookmark] = await db
    .select({id: bookmarks.id, images: bookmarks.images})
    .from(bookmarks)
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.kind, "post")));

  return bookmark ?? null;
}

function isPostImages(images: unknown): images is PostImages {
  return !!images && typeof images === "object" && "items" in images && Array.isArray(images.items);
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

async function processPostImages(bookmarkId: string, images: PostImages) {
  const [items, qrtItems] = await Promise.all([
    processPostMediaItems(images.items),
    processPostMediaItems(images.qrtItems ?? []),
  ]);

  const processedImages = buildProcessedPostImages(items, qrtItems);
  await db.update(bookmarks).set({images: processedImages}).where(eq(bookmarks.id, bookmarkId));
}

function buildProcessedPostImages(
  items: ProcessedMediaItem[],
  qrtItems: ProcessedMediaItem[],
): PostImages {
  const results = [...items, ...qrtItems];

  if (results.some((result) => result.status === "failed")) {
    throw new Error("One or more post media uploads failed");
  }

  return {
    processing: false,
    items: items.map((result) => result.item),
    ...(qrtItems.length > 0 ? {qrtItems: qrtItems.map((result) => result.item)} : {}),
  };
}

function processPostMediaItems(items: PostMediaItem[]): Promise<ProcessedMediaItem[]> {
  return Promise.all(items.map(processPostMediaItem));
}

function processPostMediaItem(item: PostMediaItem): Promise<ProcessedMediaItem> {
  if (item.type === "image") {
    return processImageItem(item);
  }

  return processVideoItem(item);
}

async function processImageItem(item: ImageItem): Promise<ProcessedMediaItem<ImageItem>> {
  const mediaUpload = await ensureUploaded(item.source_url, item.media_key);

  return {
    item: {
      ...item,
      ...(mediaUpload.status === "success" ? {media_key: mediaUpload.key} : {}),
    },
    status: mediaUpload.status,
  };
}

async function processVideoItem(item: VideoItem): Promise<ProcessedMediaItem<VideoItem>> {
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
