import {syncBookmarkCollection} from "@/lib/bookmarks/collections";
import {attachTagsToBookmark} from "@/lib/bookmarks/tags";
import {logger, toLogError} from "@/lib/shared/logger";

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
