"use server";

import {db} from "@/db";
import {bookmarks} from "@/db/schema";
import {getBookmarkFilters} from "./filters";
import type {TypeFilter} from "@/app/home/_types";
import {DatabaseError} from "@/lib/errors";
import {logger} from "@/lib/logger";

export async function getBookmarksCount({
  userId,
  tagFilter,
  collectionFilter,
  typeFilter = "website",
}: {
  userId: string;
  tagFilter: string | null;
  collectionFilter: string | null;
  typeFilter?: TypeFilter;
}) {
  const filters = getBookmarkFilters({userId, tagFilter, collectionFilter, typeFilter});

  try {
    const totalCount = await db.$count(bookmarks, filters);
    return totalCount;
  } catch (err) {
    logger.error("getBookmarksCount: database query failed", {
      err: err instanceof Error ? {message: err.message, stack: err.stack} : String(err),
      userId,
      tagFilter,
      collectionFilter,
      typeFilter,
    });
    throw new DatabaseError("Failed to fetch bookmark count.");
  }
}
