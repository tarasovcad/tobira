import {createClient} from "@/components/utils/supabase/server";
import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {redirect} from "next/navigation";
import {headers} from "next/headers";
import {HomeClient} from "./_components/HomeClient";
import {BookmarksLoadError} from "./_components/BookmarksLoadError";
import {getCollections} from "@/app/actions/collections";
import {getInitialBookmarks} from "./_lib/getInitialBookmarks";
import {normalizeTagParam} from "@/lib/utils";
import type {SearchParams} from "./_types";

const AllItems = async (props: {searchParams?: Promise<SearchParams>}) => {
  const searchParams = await props.searchParams;

  const data = await auth.api.getSession({
    headers: await headers(),
  });
  if (!data?.user?.id) {
    redirect("/login");
  }

  const userId = data.user.id;
  const tagFilter = normalizeTagParam(searchParams?.tag ?? searchParams?.tab);
  const collectionFilter = searchParams?.collection ?? null;
  const supabase = await createClient();

  const [bookmarksResult, collections] = await Promise.all([
    getInitialBookmarks({userId, tagFilter, collectionFilter, supabase}),
    getCollections(),
  ]);

  const {initialBookmarks, totalCount, bookmarksError, tags, tagsError} = bookmarksResult;

  if (tagsError) console.error("Failed to fetch tags with counts:", tagsError);

  if (bookmarksError || tagsError) {
    return (
      <AppShell session={data} collections={collections}>
        <BookmarksLoadError error={bookmarksError} />
      </AppShell>
    );
  }

  return (
    <AppShell session={data} tags={tags ?? []} collections={collections}>
      <HomeClient
        userId={userId}
        initialBookmarks={initialBookmarks}
        totalCount={totalCount ?? 0}
      />
    </AppShell>
  );
};

export default AllItems;
