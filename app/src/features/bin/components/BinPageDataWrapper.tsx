import {getDeletedBookmarksStats} from "@/app/actions/bookmarks/getDeletedBookmarksStats";
import {BookmarksLoadError} from "@/features/home/components/BookmarksLoadError";
import {BinPageClient} from "@/features/bin/components/BinPageClient";
import {PAGE_SIZE} from "@/features/home/constants";
import type {SortMode, TypeFilter} from "@/features/home/types";
import fetchDeletedBookmarksPageAction from "@/features/bin/queries/fetchDeletedBookmarksPageAction";
import {isAppError} from "@/lib/shared/errors";
import {logger} from "@/lib/shared/logger";

export async function BinPageDataWrapper({
  userId,
  params,
}: {
  userId: string;
  params: {
    typeFilter: TypeFilter;
    sortFilter: SortMode;
  };
}) {
  let fetchedData = null;
  let errorData = null;

  try {
    const [stats, initialBookmarksResult] = await Promise.all([
      getDeletedBookmarksStats(userId),
      fetchDeletedBookmarksPageAction({
        userId,
        offset: 0,
        limit: PAGE_SIZE,
        sort: params.sortFilter,
        typeFilter: params.typeFilter,
      }),
    ]);

    fetchedData = {stats, initialBookmarks: initialBookmarksResult.data};
  } catch (err) {
    logger.error("bin: failed to load deleted bookmarks", {
      err: err instanceof Error ? {message: err.message, stack: err.stack} : String(err),
      userId,
    });

    const safeMessage = isAppError(err)
      ? err.message
      : "Something went wrong. Please try refreshing the page.";
    const safeCode = isAppError(err) ? err.code : undefined;

    errorData = {message: safeMessage, details: safeCode};
  }

  if (errorData) {
    return <BookmarksLoadError error={errorData} />;
  }

  if (!fetchedData) return null;

  return (
    <BinPageClient
      userId={userId}
      stats={fetchedData.stats}
      initialBookmarks={fetchedData.initialBookmarks}
      initialTypeFilter={params.typeFilter}
      initialSort={params.sortFilter}
    />
  );
}
