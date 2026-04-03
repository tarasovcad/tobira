import {getInitialBookmarks} from "@/app/actions/bookmarks/getInitialBookmarks";
import {getBookmarksCount} from "@/app/actions/bookmarks/getBookmarksCount";
import {getTagById} from "@/app/actions/tags";
import {HomeClient} from "./HomeClient";
import {BookmarksLoadError} from "./BookmarksLoadError";
import {isAppError} from "@/lib/shared/errors";
import {logger} from "@/lib/shared/logger";
import type {TypeFilter, SortMode} from "../_types";

export async function BookmarksDataWrapper({
  userId,
  params,
}: {
  userId: string;
  params: {
    tagFilter: string | null;
    collectionFilter: string | null;
    typeFilter: TypeFilter;
    sortFilter: SortMode;
  };
}) {
  let fetchedData = null;
  let errorData = null;

  try {
    const [bookmarksResult, totalCount, activeTag] = await Promise.all([
      getInitialBookmarks({
        userId,
        tagFilter: params.tagFilter,
        collectionFilter: params.collectionFilter,
        typeFilter: params.typeFilter,
        sort: params.sortFilter,
      }),
      getBookmarksCount({
        userId,
        tagFilter: params.tagFilter,
        collectionFilter: params.collectionFilter,
        typeFilter: params.typeFilter,
      }),
      params.tagFilter ? getTagById(params.tagFilter, userId) : Promise.resolve(null),
    ]);

    fetchedData = {bookmarksResult, totalCount, activeTag};
  } catch (err) {
    logger.error("home: failed to load bookmarks", {
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
    <HomeClient
      userId={userId}
      initialBookmarks={fetchedData.bookmarksResult.initialBookmarks}
      initialActiveTag={fetchedData.activeTag}
      totalCount={fetchedData.totalCount}
      serverFilters={params}
    />
  );
}
