import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {HomeClient} from "./_components/HomeClient";
import {BookmarksLoadError} from "./_components/BookmarksLoadError";
import {getCollections} from "@/app/actions/collections";
import {getInitialBookmarks} from "./_lib/getInitialBookmarks";
import {normalizeTagParam} from "@/lib/utils";
import type {SearchParams} from "./_types";
import type {SortMode, TypeFilter} from "./_components/AllItemsToolbar";

const resolveSortFilter = (sortParam?: string): SortMode => {
  if (sortParam === "oldest" || sortParam === "az") return sortParam;
  return "recent";
};

const AllItems = async (props: {searchParams?: Promise<SearchParams>}) => {
  const searchParams = await props.searchParams;

  const data = await auth.api.getSession({
    headers: await headers(),
  });
  if (!data?.user?.id) {
    return (
      <AppShell session={data} tags={[]} collections={[]}>
        <HomeClient userId={null} initialBookmarks={[]} initialTags={[]} totalCount={0} />
      </AppShell>
    );
  }

  const userId = data.user.id;
  const tagFilter = normalizeTagParam(searchParams?.tag);
  const collectionFilter = searchParams?.collection ?? null;
  const typeFilter = (searchParams?.type === "media" ? "media" : "website") as TypeFilter;
  const sortFilter = resolveSortFilter(searchParams?.sort);

  let bookmarksResult: Awaited<ReturnType<typeof getInitialBookmarks>>;
  let collections: Awaited<ReturnType<typeof getCollections>>;

  try {
    [bookmarksResult, collections] = await Promise.all([
      getInitialBookmarks({userId, tagFilter, collectionFilter, typeFilter, sort: sortFilter}),
      getCollections(),
    ]);
  } catch (err) {
    const fallbackCollections = await getCollections().catch(() => []);
    return (
      <AppShell session={data} collections={fallbackCollections}>
        <BookmarksLoadError error={err instanceof Error ? err : null} />
      </AppShell>
    );
  }

  const {initialBookmarks, totalCount, tags} = bookmarksResult;

  return (
    <AppShell session={data} tags={tags ?? []} collections={collections}>
      <HomeClient
        userId={userId}
        initialBookmarks={initialBookmarks}
        initialTags={tags ?? []}
        totalCount={totalCount ?? 0}
        serverFilters={{
          tagFilter,
          collectionFilter,
          typeFilter,
          sortFilter,
        }}
      />
    </AppShell>
  );
};

export default AllItems;
