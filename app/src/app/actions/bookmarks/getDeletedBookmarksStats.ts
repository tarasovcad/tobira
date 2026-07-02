"use server";

import {and, eq, isNotNull} from "drizzle-orm";

import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import type {BinHeaderStats} from "@/features/bin/components/BinHeader";
import {getCurrentUserId} from "@/lib/auth/session";
import {UnauthorizedError} from "@/lib/shared/errors";

const EMPTY_BIN_STATS: BinHeaderStats = {
  all: 0,
  websites: 0,
  media: 0,
  posts: 0,
};

export async function getDeletedBookmarksStats(userId?: string): Promise<BinHeaderStats> {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return EMPTY_BIN_STATS;
  }

  if (userId && userId !== currentUserId) {
    throw new UnauthorizedError();
  }

  const deletedFilter = and(eq(bookmarks.userId, currentUserId), isNotNull(bookmarks.deletedAt));

  const [all, websites, media, posts] = await Promise.all([
    db.$count(bookmarks, deletedFilter),
    db.$count(bookmarks, and(deletedFilter, eq(bookmarks.kind, "website"))),
    db.$count(bookmarks, and(deletedFilter, eq(bookmarks.kind, "media"))),
    db.$count(bookmarks, and(deletedFilter, eq(bookmarks.kind, "post"))),
  ]);

  return {all, websites, media, posts};
}
