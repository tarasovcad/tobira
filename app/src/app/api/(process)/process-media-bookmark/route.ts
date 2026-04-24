import {NextRequest, NextResponse} from "next/server";
import {and, eq} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks, type MediaImages} from "@/db/schema";
import {
  buildTwitterSizedUrl,
  downloadAndUploadToR2,
  verifyQstashRequest,
} from "@/features/media/server/qstash";

export const runtime = "nodejs";

type MediaBookmarkItem = MediaImages["items"][number];

async function processImageItem(
  item: Extract<MediaBookmarkItem, {type: "image"}>,
  bookmarkId: string,
  index: number,
): Promise<MediaBookmarkItem> {
  const baseKey = `posts/${bookmarkId}/media_${index}`;
  const smallSrcUrl = buildTwitterSizedUrl(item.source_url, "small");
  const mediumSrcUrl = buildTwitterSizedUrl(item.source_url, "medium");
  const largeSrcUrl = buildTwitterSizedUrl(item.source_url, "large");

  const [key_small, key_medium, key_large] = await Promise.all([
    smallSrcUrl
      ? downloadAndUploadToR2(smallSrcUrl, `${baseKey}_small.jpg`)
      : Promise.resolve(null),
    mediumSrcUrl
      ? downloadAndUploadToR2(mediumSrcUrl, `${baseKey}_medium.jpg`)
      : Promise.resolve(null),
    largeSrcUrl
      ? downloadAndUploadToR2(largeSrcUrl, `${baseKey}_large.jpg`)
      : Promise.resolve(null),
  ]);

  return {
    ...item,
    ...(key_small ? {key_small} : {}),
    ...(key_medium ? {key_medium} : {}),
    ...(key_large ? {key_large} : {}),
  };
}

async function processVideoItem(
  item: Extract<MediaBookmarkItem, {type: "video" | "gif"}>,
  bookmarkId: string,
  index: number,
): Promise<MediaBookmarkItem> {
  const baseKey = `posts/${bookmarkId}/media_${index}`;

  const [key, key_thumbnail] = await Promise.all([
    downloadAndUploadToR2(item.source_url, `${baseKey}.mp4`),
    item.source_thumbnail_url
      ? downloadAndUploadToR2(item.source_thumbnail_url, `${baseKey}_thumbnail.jpg`)
      : Promise.resolve(null),
  ]);

  return {
    ...item,
    ...(key ? {key} : {}),
    ...(key_thumbnail ? {key_thumbnail} : {}),
  };
}

async function processMediaBookmarkItems(
  items: MediaImages["items"],
  bookmarkId: string,
): Promise<MediaImages["items"]> {
  return Promise.all(
    items.map((item, index) => {
      if (item.type === "image") {
        return processImageItem(item, bookmarkId, index);
      }

      return processVideoItem(item, bookmarkId, index);
    }),
  );
}

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
      .select({id: bookmarks.id, images: bookmarks.images})
      .from(bookmarks)
      .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.kind, "media")));

    if (!bookmark) {
      return NextResponse.json({error: "Bookmark not found"}, {status: 404});
    }

    const images = bookmark.images;
    if (
      !images ||
      typeof images !== "object" ||
      !("items" in images) ||
      !Array.isArray(images.items)
    ) {
      return NextResponse.json({ok: true, skipped: "no media items"});
    }

    const processedItems = await processMediaBookmarkItems(images.items, bookmarkId);

    await db
      .update(bookmarks)
      .set({images: {processing: false, items: processedItems}})
      .where(eq(bookmarks.id, bookmarkId));
  } catch (error) {
    console.error("process-media-bookmark failed", error);
  }

  return NextResponse.json({ok: true}, {headers: {"cache-control": "no-store"}});
}
