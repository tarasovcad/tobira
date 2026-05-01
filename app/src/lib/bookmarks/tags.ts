import {db} from "@/db";
import {bookmarks, bookmarkTags, tags} from "@/db/schema";
import {and, eq, inArray, isNull, notInArray} from "drizzle-orm";
import {normalizeTagNames} from "@/lib/bookmarks/tag-utils";

export async function attachTagsToBookmark(
  bookmarkId: string,
  userId: string,
  rawTagNames: string[],
) {
  if (!bookmarkId || !userId) {
    throw new Error("bookmarkId and userId are required");
  }

  const cleanedTagNames = normalizeTagNames(rawTagNames);
  if (cleanedTagNames.length === 0) return;

  const upsertedTags = await db
    .insert(tags)
    .values(cleanedTagNames.map((name) => ({name, userId})))
    .onConflictDoUpdate({
      target: [tags.userId, tags.name],
      set: {updatedAt: new Date().toISOString()},
    })
    .returning({id: tags.id});

  if (upsertedTags.length > 0) {
    await db
      .insert(bookmarkTags)
      .values(upsertedTags.map((tag) => ({bookmarkId, tagId: tag.id})))
      .onConflictDoNothing();
  }
}

export async function syncBookmarkTags(bookmarkId: string, userId: string, rawTagNames: string[]) {
  if (!bookmarkId || !userId) {
    throw new Error("invalid input");
  }

  const [bookmarkExists] = await db
    .select({id: bookmarks.id})
    .from(bookmarks)
    .where(
      and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId), isNull(bookmarks.deletedAt)),
    );

  if (!bookmarkExists) {
    throw new Error("bookmark not found");
  }

  const cleanedTagNames = normalizeTagNames(rawTagNames);

  if (cleanedTagNames.length === 0) {
    await db.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, bookmarkId));
    return;
  }

  await db
    .insert(tags)
    .values(cleanedTagNames.map((name) => ({name, userId})))
    .onConflictDoNothing();

  const desiredTags = await db
    .select({id: tags.id})
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.name, cleanedTagNames)));

  const desiredTagIds = desiredTags.map((tag) => tag.id);
  if (desiredTagIds.length === 0) return;

  await db
    .insert(bookmarkTags)
    .values(desiredTagIds.map((tagId) => ({bookmarkId, tagId})))
    .onConflictDoNothing();

  await db
    .delete(bookmarkTags)
    .where(
      and(eq(bookmarkTags.bookmarkId, bookmarkId), notInArray(bookmarkTags.tagId, desiredTagIds)),
    );
}
