import {Suspense} from "react";
import AppShell from "@/components/app-shell/AppShell";
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
import {SidebarSkeleton} from "@/components/app-shell/sidebar/SidebarSkeleton";
import {BookmarkWorkspaceClient} from "@/features/home/components/BookmarkWorkspaceClient";
import {SidebarDataWrapper} from "@/components/app-shell/sidebar/SidebarDataWrapper";

const AllItems = async (props: {searchParams?: Promise<SearchParams>}) => {
  const searchParams = await props.searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return (
      <AppShell session={session}>
        <BookmarkWorkspaceClient
          userId={null}
          initialBookmarks={[]}
          initialActiveCollection={null}
          initialActiveTag={null}
          totalCount={0}
          scope={{kind: "all"}}
        />
      </AppShell>
    );
  }

  const userId = session.user.id;
  const tagFilter = searchParams?.tag?.trim() || null;
  const collectionFilter = searchParams?.collection ?? null;
  const scope = getBookmarkWorkspaceScope({tagFilter, collectionFilter});
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
            showCount={!collectionFilter && !tagFilter}
            typeFilter={typeFilter}
            sort={sortFilter}
            tagFilter={tagFilter}
            collectionFilter={collectionFilter}
          />
        }>
        <BookmarkWorkspaceDataWrapper userId={userId} params={filterParams} />
      </Suspense>
    </AppShell>
  );
};

const resolveSortFilter = (sortParam?: string): SortMode => {
  if (sortParam === "oldest" || sortParam === "az") return sortParam;
  return "recent";
};

export default AllItems;
