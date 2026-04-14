"use server";

import {db} from "@/db";
import {collections} from "@/db/schema";
import {and, desc, eq, inArray} from "drizzle-orm";
import {NotFoundError, UnauthorizedError} from "@/lib/shared/errors";
import {getCurrentUserId, requireAuthenticatedUserId} from "@/lib/auth/session";

export type Collection = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_pinned: boolean;
  created_at: string;
};

function mapCollection(row: typeof collections.$inferSelect): Collection {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    color: row.color ?? null,
    icon: row.icon ?? null,
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

export async function createCollection(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}): Promise<Collection> {
  const userId = await requireAuthenticatedUserId();

  const [newCollection] = await db
    .insert(collections)
    .values({
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? null,
      icon: data.icon ?? null,
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
    color?: string;
    icon?: string;
  },
): Promise<Collection> {
  const userId = await requireAuthenticatedUserId();

  const [updated] = await db
    .update(collections)
    .set({
      ...(data.name !== undefined && {name: data.name}),
      ...(data.description !== undefined && {description: data.description}),
      ...(data.color !== undefined && {color: data.color}),
      ...(data.icon !== undefined && {icon: data.icon}),
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
