"use server";

import {db} from "@/db";
import {bookmarkCollections, bookmarks, collections, type CollectionColor} from "@/db/schema";
import {and, asc, count, desc, eq, exists, inArray, isNull, not} from "drizzle-orm";
import {NotFoundError, UnauthorizedError} from "@/lib/shared/errors";
import {getCurrentUserId, requireAuthenticatedUserId} from "@/lib/auth/session";

export type Collection = {
  id: string;
  name: string;
  description: string | null;
  color: CollectionColor | null;
  is_pinned: boolean;
  created_at: string;
};

export type CollectionsOverviewData = {
  collections: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string | null;
    itemCount: number;
  }[];
  stats: {
    collectionCount: number;
    savedItemCount: number;
    uncategorizedItemCount: number;
    updatedThisWeekCount: number;
  };
};

function mapCollection(row: typeof collections.$inferSelect): Collection {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    color: row.color ?? null,
    is_pinned: !!row.isPinned,
    created_at: row.createdAt ?? "",
  };
}

export async function getCollections(userId?: string): Promise<Collection[]> {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return [];
  }

  if (userId && userId !== currentUserId) {
    throw new UnauthorizedError();
  }

  const data = await db
    .select()
    .from(collections)
    .where(eq(collections.userId, currentUserId))
    .orderBy(desc(collections.isPinned), desc(collections.createdAt));

  return data.map(mapCollection);
}

export async function getCollectionsOverview(userId?: string): Promise<CollectionsOverviewData> {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return {
      collections: [],
      stats: {
        collectionCount: 0,
        savedItemCount: 0,
        uncategorizedItemCount: 0,
        updatedThisWeekCount: 0,
      },
    };
  }

  if (userId && userId !== currentUserId) {
    throw new UnauthorizedError();
  }

  const [collectionRows, uncategorizedItemCount] = await Promise.all([
    db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        color: collections.color,
        isPinned: collections.isPinned,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        itemCount: count(bookmarks.id),
      })
      .from(collections)
      .leftJoin(bookmarkCollections, eq(collections.id, bookmarkCollections.collectionId))
      .leftJoin(
        bookmarks,
        and(
          eq(bookmarkCollections.bookmarkId, bookmarks.id),
          eq(bookmarks.userId, collections.userId),
          isNull(bookmarks.archivedAt),
          isNull(bookmarks.deletedAt),
        ),
      )
      .where(eq(collections.userId, currentUserId))
      .groupBy(collections.id)
      .orderBy(desc(collections.isPinned), asc(collections.name)),
    db.$count(
      bookmarks,
      and(
        eq(bookmarks.userId, currentUserId),
        isNull(bookmarks.archivedAt),
        isNull(bookmarks.deletedAt),
        not(
          exists(
            db
              .select()
              .from(bookmarkCollections)
              .where(eq(bookmarkCollections.bookmarkId, bookmarks.id)),
          ),
        ),
      ),
    ),
  ]);

  const collectionItems = collectionRows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    color: row.color?.hex ?? null,
    isPinned: !!row.isPinned,
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? null,
    itemCount: Number(row.itemCount),
  }));

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const savedItemCount = collectionItems.reduce((sum, collection) => sum + collection.itemCount, 0);
  const updatedThisWeekCount = collectionItems.filter(
    (collection) => collection.updatedAt && Date.now() - Date.parse(collection.updatedAt) <= weekMs,
  ).length;

  return {
    collections: collectionItems,
    stats: {
      collectionCount: collectionItems.length,
      savedItemCount,
      uncategorizedItemCount,
      updatedThisWeekCount,
    },
  };
}

export async function getCollectionById(
  collectionId: string,
  userId?: string,
): Promise<Collection | null> {
  const currentUserId = await getCurrentUserId();

  if (!collectionId || !currentUserId) {
    return null;
  }

  if (userId && userId !== currentUserId) {
    throw new UnauthorizedError();
  }

  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, currentUserId)))
    .limit(1);

  return collection ? mapCollection(collection) : null;
}

export async function createCollection(data: {
  name: string;
  description?: string;
  color?: CollectionColor;
}): Promise<Collection> {
  const userId = await requireAuthenticatedUserId();

  const [newCollection] = await db
    .insert(collections)
    .values({
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? null,
      userId,
    })
    .returning();

  return mapCollection(newCollection);
}

export async function deleteCollections(ids: string | string[]): Promise<true> {
  const userId = await requireAuthenticatedUserId();

  const idsArray = Array.isArray(ids) ? ids : [ids];

  await db
    .delete(collections)
    .where(and(eq(collections.userId, userId), inArray(collections.id, idsArray)));

  return true;
}

export async function updateCollection(
  id: string,
  data: {
    name?: string;
    description?: string;
    color?: CollectionColor;
  },
): Promise<Collection> {
  const userId = await requireAuthenticatedUserId();

  const [updated] = await db
    .update(collections)
    .set({
      ...(data.name !== undefined && {name: data.name}),
      ...(data.description !== undefined && {description: data.description}),
      ...(data.color !== undefined && {color: data.color}),
    })
    .where(and(eq(collections.id, id), eq(collections.userId, userId)))
    .returning();

  if (!updated) {
    throw new NotFoundError("Collection", id);
  }

  return mapCollection(updated);
}

export async function toggleCollectionPin(
  collectionId: string,
  isPinned: boolean,
): Promise<Collection> {
  const userId = await requireAuthenticatedUserId();

  const [updated] = await db
    .update(collections)
    .set({isPinned})
    .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)))
    .returning();

  if (!updated) {
    throw new NotFoundError("Collection", collectionId);
  }

  return mapCollection(updated);
}
