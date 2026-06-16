import {Suspense} from "react";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {BookmarkWorkspaceDataWrapper} from "@/features/home/components/BookmarkWorkspaceDataWrapper";
import {BookmarksLoader} from "@/features/home/components/BookmarksLoader";
import {BookmarkWorkspaceClient} from "@/features/home/components/BookmarkWorkspaceClient";
import type {SearchParams, SortMode, TypeFilter} from "@/features/home/types";
import {AddBookmarkDialog} from "@/features/add-item/AddBookmarkDialog";
import {getTagById} from "@/app/actions/tags";

const resolveSortFilter = (sortParam?: string): SortMode => {
  if (sortParam === "oldest" || sortParam === "az") return sortParam;
  return "recent";
};

const resolveTypeFilter = (typeParam?: string): TypeFilter => {
  if (typeParam === "media" || typeParam === "post") return typeParam;
  return "website";
};

export const metadata = {
  title: "Tag - Tobira",
  description: "Browse bookmarks with a Tobira tag.",
};

const TagItemsPage = async (props: {
  params: Promise<{id: string}>;
  searchParams?: Promise<SearchParams>;
}) => {
  const [{id}, searchParams] = await Promise.all([props.params, props.searchParams]);
  const tagId = id.trim();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const scope = {kind: "tag", id: tagId} as const;
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
  const activeTag = await getTagById(tagId, userId);
  const filterParams = {
    scope,
    typeFilter,
    sortFilter,
  };

  return (
    <>
      <AddBookmarkDialog
        isAuthenticated
        user={session.user}
        defaultTagNames={activeTag ? [activeTag.name] : undefined}
      />
      <Suspense
        fallback={
          <BookmarksLoader
            showCount={false}
            typeFilter={typeFilter}
            sort={sortFilter}
            tagFilter={tagId}
            collectionFilter={null}
          />
        }>
        <BookmarkWorkspaceDataWrapper userId={userId} params={filterParams} />
      </Suspense>
    </>
  );
};

export default TagItemsPage;
