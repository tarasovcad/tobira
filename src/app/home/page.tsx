import {Suspense} from "react";
import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import type {SearchParams, SortMode, TypeFilter} from "./_types";
import {BookmarksDataWrapper} from "./_components/BookmarksDataWrapper";
import {BookmarksLoader} from "./_components/skeletons/BookmarksLoader";
import {SidebarSkeleton} from "./_components/skeletons/SidebarSkeleton";
import {HomeClient} from "./_components/HomeClient";
import {SidebarDataWrapper} from "./_components/SidebarDataWrapper";

const AllItems = async (props: {searchParams?: Promise<SearchParams>}) => {
  const searchParams = await props.searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return (
      <AppShell session={session}>
        <HomeClient userId={null} initialBookmarks={[]} initialActiveTag={null} totalCount={0} />
      </AppShell>
    );
  }

  const userId = session.user.id;
  const tagFilter = searchParams?.tag?.trim() || null;
  const collectionFilter = searchParams?.collection ?? null;
  const typeFilter = (searchParams?.type === "media" ? "media" : "website") as TypeFilter;
  const sortFilter = resolveSortFilter(searchParams?.sort);

  const filterParams = {
    tagFilter,
    collectionFilter,
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
          />
        }>
        <BookmarksDataWrapper userId={userId} params={filterParams} />
      </Suspense>
    </AppShell>
  );
};

const resolveSortFilter = (sortParam?: string): SortMode => {
  if (sortParam === "oldest" || sortParam === "az") return sortParam;
  return "recent";
};

export default AllItems;
