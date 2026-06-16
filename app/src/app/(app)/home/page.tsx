import {Suspense} from "react";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {
  getBookmarkWorkspaceScope,
  type SearchParams,
  type SortMode,
  type TypeFilter,
} from "@/features/home/types";
import {BookmarkWorkspaceDataWrapper} from "@/features/home/components/BookmarkWorkspaceDataWrapper";
import {BookmarksLoader} from "@/features/home/components/BookmarksLoader";
import {BookmarkWorkspaceClient} from "@/features/home/components/BookmarkWorkspaceClient";
import {AddBookmarkDialog} from "@/features/add-item/AddBookmarkDialog";

const AllItems = async (props: {searchParams?: Promise<SearchParams>}) => {
  const searchParams = await props.searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return (
      <BookmarkWorkspaceClient
        userId={null}
        initialBookmarks={[]}
        initialActiveCollection={null}
        initialActiveTag={null}
        totalCount={0}
        scope={{kind: "all"}}
      />
    );
  }

  const userId = session.user.id;
  const tagFilter = searchParams?.tag?.trim() || null;
  const scope = getBookmarkWorkspaceScope({tagFilter, collectionFilter: null});
  const typeFilter = (
    searchParams?.type === "media" ? "media" : searchParams?.type === "post" ? "post" : "website"
  ) as TypeFilter;
  const sortFilter = resolveSortFilter(searchParams?.sort);

  const filterParams = {
    scope,
    typeFilter,
    sortFilter,
  };

  return (
    <>
      <AddBookmarkDialog isAuthenticated user={session.user} />
      <Suspense
        fallback={
          <BookmarksLoader
            showCount={!tagFilter}
            typeFilter={typeFilter}
            sort={sortFilter}
            tagFilter={tagFilter}
            collectionFilter={null}
          />
        }>
        <BookmarkWorkspaceDataWrapper userId={userId} params={filterParams} />
      </Suspense>
    </>
  );
};

const resolveSortFilter = (sortParam?: string): SortMode => {
  if (sortParam === "oldest" || sortParam === "az") return sortParam;
  return "recent";
};

export default AllItems;
