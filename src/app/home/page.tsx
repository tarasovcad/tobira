import {createClient} from "@/components/utils/supabase/server";
import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {redirect} from "next/navigation";
import {headers} from "next/headers";
import {AllItemsClient} from "./_components/AllItemsClient";
import {BookmarksLoadError} from "./_components/BookmarksLoadError";
import {getCollections} from "@/app/actions/collections";
import {getInitialBookmarks} from "./_lib/getInitialBookmarks";
import {normalizeTagParam} from "@/lib/utils";
import type {SearchParams, TagsWithCountsRow} from "./_types";

const AllItems = async (props: {searchParams?: Promise<SearchParams>}) => {
  const searchParams = await props.searchParams;
  const tagFilter = normalizeTagParam(searchParams?.tag ?? searchParams?.tab);
  const collectionFilter = searchParams?.collection ?? null;

  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data?.user?.id) {
    redirect("/login");
  }

  const userId = data.user.id;
  const supabase = await createClient();

  const {initialBookmarks, totalCount, bookmarksError, tagsData, tagsError} =
    await getInitialBookmarks({userId, tagFilter, collectionFilter, supabase});

  const collections = await getCollections();

  if (tagsError) console.error("Failed to fetch tags with counts:", tagsError);

  const tags = ((tagsData ?? []) as TagsWithCountsRow[]).map((t) => ({
    id: t.id,
    name: t.name,
    count: typeof t.count === "string" ? Number(t.count) : (t.count ?? 0),
  }));

  if (bookmarksError) {
    return (
      <AppShell session={data} collections={collections}>
        <BookmarksLoadError error={bookmarksError} />
      </AppShell>
    );
  }

  return (
    <AppShell session={data} tags={tags} collections={collections}>
      <AllItemsClient
        userId={userId}
        initialBookmarks={initialBookmarks}
        totalCount={totalCount ?? 0}
      />
    </AppShell>
  );
};

export default AllItems;
