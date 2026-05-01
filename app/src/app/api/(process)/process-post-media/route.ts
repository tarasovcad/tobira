import {NextRequest, NextResponse} from "next/server";
import {and, eq} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import type {PostBookmarkMetadata} from "@/components/bookmark/types/metadata";
import {buildR2PublicUrl} from "@/lib/storage/r2-storage";
import {
  buildTwitterSizedUrl,
  downloadAndUploadToR2,
  verifyQstashRequest,
} from "@/features/media/server/qstash";

export const runtime = "nodejs";

type ProcessableMediaItem = {
  type: string;
  url: string;
  thumbnail_url?: string;
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
    items.map(async (item, index) => {
      if (item.type === "video" || item.type === "gif") {
        const updates: Partial<ProcessableMediaItem> = {};

        const uploadedUrl = await downloadAndUploadToR2(
          item.url,
          `posts/${bookmarkId}/${prefix}_${index}.mp4`,
        );
        if (uploadedUrl) updates.url = buildR2PublicUrl(uploadedUrl);

        if (item.thumbnail_url) {
          const uploadedThumb = await downloadAndUploadToR2(
            item.thumbnail_url,
            `posts/${bookmarkId}/${prefix}_${index}_thumbnail.jpg`,
          );
          if (uploadedThumb) updates.thumbnail_url = buildR2PublicUrl(uploadedThumb);
        }

        return {...item, ...updates};
      }

      const smallSrcUrl = buildTwitterSizedUrl(item.url, "small");
      const largeSrcUrl = buildTwitterSizedUrl(item.url, "large");

      if (!smallSrcUrl || !largeSrcUrl) return item;

      const [url_small, url_large] = await Promise.all([
        downloadAndUploadToR2(smallSrcUrl, `posts/${bookmarkId}/${prefix}_${index}_small.jpg`),
        downloadAndUploadToR2(largeSrcUrl, `posts/${bookmarkId}/${prefix}_${index}_large.jpg`),
      ]);

      return {
        ...item,
        ...(url_small ? {url_small: buildR2PublicUrl(url_small)} : {}),
        ...(url_large ? {url_large: buildR2PublicUrl(url_large)} : {}),
      };
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
      .select({id: bookmarks.id, metadata: bookmarks.metadata})
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
