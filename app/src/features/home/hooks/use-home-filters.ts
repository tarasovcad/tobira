"use client";

import {useQueryStates} from "nuqs";
import {usePathname} from "next/navigation";
import {useViewOptionsStore} from "@/store/use-view-options";
import {getBookmarkWorkspaceScope, type SortMode, type TypeFilter} from "@/features/home/types";
import {getDefaultAllItemsView} from "@/features/all-items/components/all-items-list-view-options";
import {binFilterParsers, homeFilterParsers} from "@/lib/query-params";

export function useHomeFilters({bin = false}: {bin?: boolean} = {}) {
  const pathname = usePathname();
  const resetViewOptions = useViewOptionsStore((state) => state.resetViewOptions);
  const parsers = bin ? binFilterParsers : homeFilterParsers;
  const [{type, sort}, setHomeFilters] = useQueryStates({
    type: parsers.type,
    sort: parsers.sort,
  });

  const pathCollectionId = pathname.startsWith("/collections/")
    ? decodeURIComponent(pathname.split("/")[2] ?? "") || null
    : null;
  const pathTagId = pathname.startsWith("/tags/")
    ? decodeURIComponent(pathname.split("/")[2] ?? "") || null
    : null;

  const tagFilter = pathCollectionId ? null : pathTagId;
  const collectionFilter = pathCollectionId;
  const scope = getBookmarkWorkspaceScope({tagFilter, collectionFilter});
  const typeFilter = type;

  const handleTypeChange = (nextType: TypeFilter) => {
    void setHomeFilters({type: nextType});
    resetViewOptions(getDefaultAllItemsView(nextType));
  };

  const handleSortChange = (nextSort: SortMode) => {
    void setHomeFilters({sort: nextSort});
  };

  return {
    tagFilter,
    collectionFilter,
    scope,
    typeFilter,
    sort,
    handleTypeChange,
    handleSortChange,
  };
}
