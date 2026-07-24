import {syncBookmarkCollection} from "@/lib/bookmarks/collections";
import {attachTagsToBookmark} from "@/lib/bookmarks/tags";
import {logger, toLogError} from "@/lib/shared/logger";
import {attachCollectionToBookmarks} from "@/lib/bookmarks/collections";
import {attachTagsToBookmarks} from "@/lib/bookmarks/tags";

export async function attachBookmarkRelations({
  bookmarkId,
  userId,
  tags,
  collectionId,
  kind,
}: {
  bookmarkId: string;
  userId: string;
  tags?: string[];
  collectionId?: string;
  kind: "website" | "media" | "post";
}) {
  const attachments: Promise<void>[] = [];

  if (tags?.length) {
    attachments.push(
      attachTagsToBookmark(bookmarkId, userId, tags).catch((error: unknown) => {
        logger.error("Failed to attach tags to bookmark", {
          bookmarkId,
          kind,
          error: toLogError(error),
        });
      }),
    );
  }

  if (collectionId) {
    attachments.push(
      syncBookmarkCollection(bookmarkId, userId, collectionId).catch((error: unknown) => {
        logger.error("Failed to attach bookmark to collection", {
          bookmarkId,
          kind,
          error: toLogError(error),
        });
      }),
    );
  }

  await Promise.all(attachments);
}

export async function attachRelationsToBookmarks({
  bookmarkIds,
  userId,
  tags,
  collectionId,
}: {
  bookmarkIds: string[];
  userId: string;
  tags?: string[];
  collectionId?: string;
}): Promise<void> {
  const attachments: Promise<void>[] = [];

  if (tags?.length) {
    attachments.push(
      attachTagsToBookmarks(bookmarkIds, userId, tags).catch((error: unknown) => {
        logger.error("Failed to batch-attach tags to bookmarks", {
          bookmarkIds,
          error: toLogError(error),
        });
      }),
    );
  }

  if (collectionId) {
    attachments.push(
      attachCollectionToBookmarks(bookmarkIds, userId, collectionId).catch((error: unknown) => {
        logger.error("Failed to batch-attach collection to bookmarks", {
          bookmarkIds,
          error: toLogError(error),
        });
      }),
    );
  }

  await Promise.all(attachments);
}
