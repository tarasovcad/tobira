"use server";

import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {db} from "@/db";
import {tags, bookmarkTags, bookmarks} from "@/db/schema";
import {and, eq, isNull, count, inArray, desc, asc} from "drizzle-orm";
import type {TagWithCount} from "../home/_types";

export async function generateAiSuggestions() {
  return {
    suggestions: ["react", "nextjs", "typescript", "tailwind", "ui"],
  };
}

export async function getTags(): Promise<TagWithCount[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

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
    .where(eq(tags.userId, session.user.id))
    .groupBy(tags.id)
    .orderBy(desc(tags.isPinned), asc(tags.name));

  return data.map((t) => ({
    id: t.id,
    name: t.name,
    count: Number(t.count),
    description: t.description,
    is_pinned: !!t.is_pinned,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }));
}

export async function deleteTags(tagIds: string | string[]): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const ids = Array.isArray(tagIds) ? tagIds : [tagIds];

  await db.delete(tags).where(and(eq(tags.userId, session.user.id), inArray(tags.id, ids)));

  return {ok: true};
}

export async function updateTag(
  tagId: string,
  data: {name: string; description?: string},
): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  await db
    .update(tags)
    .set({name: data.name, description: data.description ?? null})
    .where(and(eq(tags.id, tagId), eq(tags.userId, session.user.id)));

  return {ok: true};
}

export async function toggleTagPin(tagId: string, isPinned: boolean): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  await db
    .update(tags)
    .set({isPinned})
    .where(and(eq(tags.id, tagId), eq(tags.userId, session.user.id)));

  return {ok: true};
}
