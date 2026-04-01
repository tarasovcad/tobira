import {db} from "@/db";
import {bookmarks, tags, bookmarkTags, bookmarkCollections} from "@/db/schema";
import {and, eq, isNull, exists} from "drizzle-orm";
import type {TypeFilter} from "@/app/home/_types";

export function getBookmarkFilters({
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
  const filters = [
    eq(bookmarks.userId, userId),
    isNull(bookmarks.archivedAt),
    isNull(bookmarks.deletedAt),
    eq(bookmarks.kind, typeFilter),
  ];

  if (tagFilter) {
    filters.push(
      exists(
        db
          .select()
          .from(bookmarkTags)
          .innerJoin(tags, eq(bookmarkTags.tagId, tags.id))
          .where(and(eq(bookmarkTags.bookmarkId, bookmarks.id), eq(tags.id, tagFilter))),
      ),
    );
  }

  if (collectionFilter) {
    filters.push(
      exists(
        db
          .select()
          .from(bookmarkCollections)
          .where(
            and(
              eq(bookmarkCollections.bookmarkId, bookmarks.id),
              eq(bookmarkCollections.collectionId, collectionFilter),
            ),
          ),
      ),
    );
  }

  return and(...filters);
}
