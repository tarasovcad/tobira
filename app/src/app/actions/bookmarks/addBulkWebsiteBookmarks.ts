"use server";

import {z} from "zod";
import {requireAuthenticatedUserId} from "@/lib/auth/session";
import {logger, toLogError} from "@/lib/shared/logger";
import {createBulkWebsiteBookmarks, type CreatedBulkBookmark} from "@/lib/bookmarks/website/create";
import {queueWebsiteBookmarkBatch} from "@/lib/bookmarks/website/queue";
import {
  normalizeBulkWebsiteUrls,
  BULK_WEBSITE_MAX_URLS,
  type RejectedBulkUrl,
} from "@/lib/bookmarks/website/normalize-bulk-urls";

const addBulkWebsiteBookmarksInputSchema = z.object({
  urls: z
    .array(z.string())
    .min(1, "At least one URL is required")
    .max(BULK_WEBSITE_MAX_URLS, `Maximum ${BULK_WEBSITE_MAX_URLS} URLs allowed`),
  tags: z.array(z.string()).optional(),
  collectionId: z.string().optional(),
});

export type AddBulkWebsiteBookmarksInput = z.infer<typeof addBulkWebsiteBookmarksInputSchema>;

export type AddBulkWebsiteBookmarksResult = {
  ok: true;
  bookmarks: CreatedBulkBookmark[];
  rejected: RejectedBulkUrl[];
  duplicates: string[];
};

export async function addBulkWebsiteBookmarks(
  input: AddBulkWebsiteBookmarksInput,
): Promise<AddBulkWebsiteBookmarksResult> {
  const userId = await requireAuthenticatedUserId();

  const parsed = addBulkWebsiteBookmarksInputSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message ?? "Invalid input");
  }

  const {urls: rawUrls, tags, collectionId} = parsed.data;

  const {accepted, rejected, duplicates} = normalizeBulkWebsiteUrls(rawUrls);

  if (accepted.length === 0) {
    throw new Error(
      rejected.length === 1
        ? `URL is invalid: ${rejected[0]!.reason}`
        : `All ${rejected.length} URLs are invalid. Please check each URL and try again.`,
    );
  }

  const {createdBookmarks} = await createBulkWebsiteBookmarks({
    normalizedUrls: accepted,
    userId,
    tags,
    collectionId,
  });

  const bookmarkIds = createdBookmarks.map((b) => b.id);

  try {
    await queueWebsiteBookmarkBatch(bookmarkIds, {
      deduplicationId: `bulk-website-batch-${bookmarkIds[0]}`,
    });
  } catch (error) {
    logger.error("Failed to queue bulk website bookmark batch — bookmarks remain pending", {
      bookmarkIds,
      error: toLogError(error),
    });
  }

  return {ok: true, bookmarks: createdBookmarks, rejected, duplicates};
}
