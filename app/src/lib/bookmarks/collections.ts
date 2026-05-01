import {db} from "@/db";
import {bookmarks, bookmarkCollections, collections} from "@/db/schema";
import {and, eq, isNull} from "drizzle-orm";

export async function syncBookmarkCollection(
  bookmarkId: string,
  userId: string,
  collectionId: string | null,
) {
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

  if (collectionId) {
    const [collectionExists] = await db
      .select({id: collections.id})
      .from(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)));

    if (!collectionExists) {
      throw new Error("collection not found");
    }
  }

  await db.delete(bookmarkCollections).where(eq(bookmarkCollections.bookmarkId, bookmarkId));

  if (collectionId) {
    await db.insert(bookmarkCollections).values({bookmarkId, collectionId}).onConflictDoNothing();
  }
}
