import {getInitialBookmarks} from "@/app/actions/bookmarks/getInitialBookmarks";
import {getBookmarksCount} from "@/app/actions/bookmarks/getBookmarksCount";
import {getCollectionById} from "@/app/actions/collections";
import {getTagById} from "@/app/actions/tags";
import {BookmarkWorkspaceClient} from "./BookmarkWorkspaceClient";
import {BookmarksLoadError} from "./BookmarksLoadError";
import {isAppError} from "@/lib/shared/errors";
import {logger} from "@/lib/shared/logger";
import {
  getBookmarkWorkspaceFilters,
  type BookmarkWorkspaceScope,
  type SortMode,
  type TypeFilter,
} from "@/features/home/types";

export async function BookmarkWorkspaceDataWrapper({
  userId,
  params,
}: {
  userId: string;
  params: {
    scope: BookmarkWorkspaceScope;
    typeFilter: TypeFilter;
    sortFilter: SortMode;
  };
}) {
  let fetchedData = null;
  let errorData = null;
  const {tagFilter, collectionFilter} = getBookmarkWorkspaceFilters(params.scope);

  try {
    const [bookmarksResult, totalCount, activeTag, activeCollection] = await Promise.all([
      getInitialBookmarks({
        userId,
        tagFilter,
        collectionFilter,
        typeFilter: params.typeFilter,
        sort: params.sortFilter,
      }),
      getBookmarksCount({
        userId,
        tagFilter,
        collectionFilter,
        typeFilter: params.typeFilter,
      }),
      params.scope.kind === "tag" ? getTagById(params.scope.id, userId) : Promise.resolve(null),
      params.scope.kind === "collection"
        ? getCollectionById(params.scope.id, userId)
        : Promise.resolve(null),
    ]);

    fetchedData = {bookmarksResult, totalCount, activeTag, activeCollection};
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
    <BookmarkWorkspaceClient
      userId={userId}
      initialBookmarks={fetchedData.bookmarksResult.initialBookmarks}
      initialActiveCollection={fetchedData.activeCollection}
      initialActiveTag={fetchedData.activeTag}
      totalCount={fetchedData.totalCount}
      scope={params.scope}
      serverFilters={params}
    />
  );
}
