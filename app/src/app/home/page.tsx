import {Suspense} from "react";
import AppShell from "@/components/app-shell/AppShell";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import type {SearchParams, SortMode, TypeFilter} from "@/features/home/types";
import {BookmarksDataWrapper} from "@/features/home/components/BookmarksDataWrapper";
import {BookmarksLoader} from "@/features/home/components/BookmarksLoader";
import {SidebarSkeleton} from "@/components/app-shell/sidebar/SidebarSkeleton";
import {HomeClient} from "@/features/home/components/HomeClient";
import {SidebarDataWrapper} from "@/components/app-shell/sidebar/SidebarDataWrapper";

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
  const typeFilter = (
    searchParams?.type === "media" ? "media" : searchParams?.type === "post" ? "post" : "website"
  ) as TypeFilter;
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
