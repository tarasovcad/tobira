"use server";

import {db} from "@/db";
import {tags, bookmarkTags, bookmarks} from "@/db/schema";
import {and, eq, isNull, count, inArray, desc, asc} from "drizzle-orm";
import type {SidebarTag, TagWithCount} from "../home/_types";
import {normalizeTagParam} from "@/lib/utils";
import {NotFoundError, UnauthorizedError} from "@/lib/errors";
import {getCurrentUserId, requireAuthenticatedUserId} from "@/lib/auth-session";

function mapTagWithCount(row: {
  id: string;
  name: string;
  description: string | null;
  is_pinned: boolean | null;
  created_at: string;
  updated_at: string;
  count: number | string | null;
}): TagWithCount {
  return {
    id: row.id,
    name: row.name,
    count: Number(row.count),
    description: row.description,
    is_pinned: !!row.is_pinned,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapSidebarTag(row: {
  id: string;
  name: string;
  is_pinned: boolean | null;
  count: number | string | null;
}): SidebarTag {
  return {
    id: row.id,
    name: row.name,
    count: Number(row.count),
    is_pinned: !!row.is_pinned,
  };
}

export async function getSidebarTags(userId?: string): Promise<SidebarTag[]> {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return [];
  }

  if (userId && userId !== currentUserId) {
    throw new UnauthorizedError();
  }

  const data = await db
    .select({
      id: tags.id,
      name: tags.name,
      is_pinned: tags.isPinned,
      count: count(bookmarks.id),
    })
    .from(tags)
    .leftJoin(bookmarkTags, eq(tags.id, bookmarkTags.tagId))
    .leftJoin(
      bookmarks,
      and(
        eq(bookmarkTags.bookmarkId, bookmarks.id),
        eq(bookmarks.userId, tags.userId),
        isNull(bookmarks.archivedAt),
        isNull(bookmarks.deletedAt),
      ),
    )
    .where(eq(tags.userId, currentUserId))
    .groupBy(tags.id)
    .orderBy(desc(tags.isPinned), asc(tags.name));

  return data.map(mapSidebarTag);
}

export async function getTags(userId?: string): Promise<TagWithCount[]> {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return [];
  }

  if (userId && userId !== currentUserId) {
    throw new UnauthorizedError();
  }

  const data = await db
    .select({
      id: tags.id,
      name: tags.name,
      description: tags.description,
      is_pinned: tags.isPinned,
      created_at: tags.createdAt,
      updated_at: tags.updatedAt,
      count: count(bookmarks.id),
    })
    .from(tags)
    .leftJoin(bookmarkTags, eq(tags.id, bookmarkTags.tagId))
    .leftJoin(
      bookmarks,
      and(
        eq(bookmarkTags.bookmarkId, bookmarks.id),
        eq(bookmarks.userId, tags.userId),
        isNull(bookmarks.archivedAt),
        isNull(bookmarks.deletedAt),
      ),
    )
    .where(eq(tags.userId, currentUserId))
    .groupBy(tags.id)
    .orderBy(desc(tags.isPinned), asc(tags.name));

  return data.map(mapTagWithCount);
}

export async function getTagById(tagId: string, userId?: string): Promise<TagWithCount | null> {
  const currentUserId = await getCurrentUserId();

  if (!tagId || !currentUserId) {
    return null;
  }

  if (userId && userId !== currentUserId) {
    throw new UnauthorizedError();
  }

  const [tag] = await db
    .select({
      id: tags.id,
      name: tags.name,
      description: tags.description,
      is_pinned: tags.isPinned,
      created_at: tags.createdAt,
      updated_at: tags.updatedAt,
      count: count(bookmarks.id),
    })
    .from(tags)
    .leftJoin(bookmarkTags, eq(tags.id, bookmarkTags.tagId))
    .leftJoin(
      bookmarks,
      and(
        eq(bookmarkTags.bookmarkId, bookmarks.id),
        eq(bookmarks.userId, tags.userId),
        isNull(bookmarks.archivedAt),
        isNull(bookmarks.deletedAt),
      ),
    )
    .where(and(eq(tags.userId, currentUserId), eq(tags.id, tagId)))
    .groupBy(tags.id)
    .limit(1);

  return tag ? mapTagWithCount(tag) : null;
}

export async function deleteTags(tagIds: string | string[]): Promise<{ok: true}> {
  const userId = await requireAuthenticatedUserId();
  const ids = Array.isArray(tagIds) ? tagIds : [tagIds];

  await db.delete(tags).where(and(eq(tags.userId, userId), inArray(tags.id, ids)));

  return {ok: true};
}

export async function updateTag(
  tagId: string,
  data: {name: string; description?: string},
): Promise<{ok: true}> {
  const userId = await requireAuthenticatedUserId();

  const updated = await db
    .update(tags)
    .set({name: normalizeTagParam(data.name) ?? data.name, description: data.description ?? null})
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .returning({id: tags.id});

  if (updated.length === 0) {
    throw new NotFoundError("Tag", tagId);
  }

  return {ok: true};
}

export async function toggleTagPin(tagId: string, isPinned: boolean): Promise<{ok: true}> {
  const userId = await requireAuthenticatedUserId();

  const updated = await db
    .update(tags)
    .set({isPinned})
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .returning({id: tags.id});

  if (updated.length === 0) {
    throw new NotFoundError("Tag", tagId);
  }

  return {ok: true};
}
