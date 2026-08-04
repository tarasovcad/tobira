import {Suspense} from "react";
import {redirect} from "next/navigation";
import {headers} from "next/headers";

import {BinPageDataWrapper} from "@/features/bin/components/BinPageDataWrapper";
import {BinPageSkeleton} from "@/features/bin/components/BinPageSkeleton";
import {type SearchParams, type SortMode, type TypeFilter} from "@/features/home/types";
import {auth} from "@/lib/auth/auth";

export const metadata = {
  title: "Bin - Tobira",
  description: "Restore or permanently remove deleted Tobira bookmarks.",
};

const resolveSortFilter = (sortParam?: string): SortMode => {
  if (sortParam === "recent" || sortParam === "az") return sortParam;
  return "oldest";
};

const resolveTypeFilter = (typeParam?: string): TypeFilter => {
  if (typeParam === "media" || typeParam === "post") return typeParam;
  return "website";
};

export default async function BinPage(props: {searchParams?: Promise<SearchParams>}) {
  const searchParams = await props.searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const filterParams = {
    typeFilter: resolveTypeFilter(searchParams?.type),
    sortFilter: resolveSortFilter(searchParams?.sort),
  };

  return (
    <Suspense
      fallback={
        <BinPageSkeleton typeFilter={filterParams.typeFilter} sort={filterParams.sortFilter} />
      }>
      <BinPageDataWrapper userId={session.user.id} params={filterParams} />
    </Suspense>
  );
}
