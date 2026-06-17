import {Suspense} from "react";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {BookmarkWorkspaceDataWrapper} from "@/features/home/components/BookmarkWorkspaceDataWrapper";
import {BookmarksLoader} from "@/features/home/components/BookmarksLoader";
import {BookmarkWorkspaceClient} from "@/features/home/components/BookmarkWorkspaceClient";
import type {SearchParams, SortMode, TypeFilter} from "@/features/home/types";
import {AddBookmarkDialog} from "@/features/add-item/AddBookmarkDialog";

const resolveSortFilter = (sortParam?: string): SortMode => {
  if (sortParam === "oldest" || sortParam === "az") return sortParam;
  return "recent";
};

const resolveTypeFilter = (typeParam?: string): TypeFilter => {
  if (typeParam === "media" || typeParam === "post") return typeParam;
  return "website";
};

export const metadata = {
  title: "Collection - Tobira",
  description: "Explore and manage bookmarks within this collection.",
};

const CollectionItemsPage = async (props: {
  params: Promise<{id: string}>;
  searchParams?: Promise<SearchParams>;
}) => {
  const [{id}, searchParams] = await Promise.all([props.params, props.searchParams]);
  const collectionId = id.trim();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const scope = {kind: "collection", id: collectionId} as const;
  const typeFilter = resolveTypeFilter(searchParams?.type);
  const sortFilter = resolveSortFilter(searchParams?.sort);

  if (!session?.user?.id) {
    return (
      <BookmarkWorkspaceClient
        userId={null}
        initialBookmarks={[]}
        initialActiveCollection={null}
        initialActiveTag={null}
        totalCount={0}
        scope={scope}
      />
    );
  }

  const userId = session.user.id;
  const filterParams = {
    scope,
    typeFilter,
    sortFilter,
  };

  return (
    <>
      <AddBookmarkDialog isAuthenticated user={session.user} defaultCollectionId={collectionId} />
      <Suspense
        fallback={
          <BookmarksLoader
            showCount={false}
            typeFilter={typeFilter}
            sort={sortFilter}
            tagFilter={null}
            collectionFilter={collectionId}
          />
        }>
        <BookmarkWorkspaceDataWrapper userId={userId} params={filterParams} />
      </Suspense>
    </>
  );
};

export default CollectionItemsPage;
