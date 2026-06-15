import {Suspense} from "react";
import AppShell from "@/components/app-shell/AppShell";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {BookmarkWorkspaceDataWrapper} from "@/features/home/components/BookmarkWorkspaceDataWrapper";
import {BookmarksLoader} from "@/features/home/components/BookmarksLoader";
import {SidebarSkeleton} from "@/components/app-shell/sidebar/SidebarSkeleton";
import {BookmarkWorkspaceClient} from "@/features/home/components/BookmarkWorkspaceClient";
import {SidebarDataWrapper} from "@/components/app-shell/sidebar/SidebarDataWrapper";
import type {SearchParams, SortMode, TypeFilter} from "@/features/home/types";

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
  description: "Browse bookmarks in a Tobira collection.",
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
      <AppShell session={session}>
        <BookmarkWorkspaceClient
          userId={null}
          initialBookmarks={[]}
          initialActiveCollection={null}
          initialActiveTag={null}
          totalCount={0}
          scope={scope}
        />
      </AppShell>
    );
  }

  const userId = session.user.id;
  const filterParams = {
    scope,
    typeFilter,
    sortFilter,
  };

  return (
    <AppShell
      session={session}
      displayAddBookmarkDialog={true}
      sidebar={
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarDataWrapper userId={userId} />
        </Suspense>
      }>
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
    </AppShell>
  );
};

export default CollectionItemsPage;
