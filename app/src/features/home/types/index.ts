import type {Bookmark} from "@/components/bookmark/types";
import type {Collection} from "@/app/actions/collections";

export type TypeFilter = "website" | "media" | "post";
export type SortMode = "recent" | "oldest" | "az";
export type {BookmarkMetadata} from "@/components/bookmark/types/metadata";

export type BookmarkWorkspaceScope =
  | {kind: "all"}
  | {kind: "collection"; id: string}
  | {kind: "tag"; id: string};

export function getBookmarkWorkspaceScope({
  tagFilter,
  collectionFilter,
}: {
  tagFilter: string | null;
  collectionFilter: string | null;
}): BookmarkWorkspaceScope {
  if (collectionFilter) {
    return {kind: "collection", id: collectionFilter};
  }

  if (tagFilter) {
    return {kind: "tag", id: tagFilter};
  }

  return {kind: "all"};
}

export function getBookmarkWorkspaceFilters(scope: BookmarkWorkspaceScope): {
  tagFilter: string | null;
  collectionFilter: string | null;
} {
  if (scope.kind === "collection") {
    return {tagFilter: null, collectionFilter: scope.id};
  }

  if (scope.kind === "tag") {
    return {tagFilter: scope.id, collectionFilter: null};
  }

  return {tagFilter: null, collectionFilter: null};
}

export function areBookmarkWorkspaceScopesEqual(
  left: BookmarkWorkspaceScope,
  right: BookmarkWorkspaceScope,
) {
  switch (left.kind) {
    case "all":
      return right.kind === "all";
    case "collection":
      return right.kind === "collection" && left.id === right.id;
    case "tag":
      return right.kind === "tag" && left.id === right.id;
  }
}

export type SearchParams = {
  type?: TypeFilter;
  sort?: SortMode;
};

export type TagWithCount = {
  id: string;
  name: string;
  count: number;
  description: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type SidebarTag = Pick<TagWithCount, "id" | "name" | "count" | "is_pinned">;

export interface UseBookmarksQueryProps {
  userId: string | null;
  initialBookmarks: Bookmark[];
  initialActiveCollection: Collection | null;
  initialActiveTag: TagWithCount | null;
  initialTotalCount: number;
  scope: BookmarkWorkspaceScope;
  sort: SortMode;
  typeFilter: TypeFilter;
  isServerDataMatching?: boolean;
}
