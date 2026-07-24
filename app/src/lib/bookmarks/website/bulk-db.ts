import {and, eq, inArray, isNull} from "drizzle-orm";
import {db} from "@/db";
import {bookmarks, websiteRecords} from "@/db/schema";
import type {WebsiteRecord} from "./records";

export type WebsiteBookmarkProcessingInfo = {
  id: string;
  url: string;
};

export async function getWebsiteBookmarksProcessingInfo(
  bookmarkIds: string[],
): Promise<WebsiteBookmarkProcessingInfo[]> {
  if (bookmarkIds.length === 0) return [];

  const rows = await db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
    })
    .from(bookmarks)
    .where(
      and(
        inArray(bookmarks.id, bookmarkIds),
        eq(bookmarks.kind, "website"),
        isNull(bookmarks.deletedAt),
      ),
    );

  // Preserve requested order
  const idIndex = new Map(bookmarkIds.map((id, i) => [id, i]));
  return rows.slice().sort((a, b) => (idIndex.get(a.id) ?? 0) - (idIndex.get(b.id) ?? 0));
}

export async function getWebsiteRecordsByKeys(keys: string[]): Promise<WebsiteRecord[]> {
  if (keys.length === 0) return [];

  return db.select().from(websiteRecords).where(inArray(websiteRecords.key, keys));
}
