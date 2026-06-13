"use client";

import {useQueryStates} from "nuqs";
import {useViewOptionsStore} from "@/store/use-view-options";
import {getBookmarkWorkspaceScope, type SortMode, type TypeFilter} from "@/features/home/types";
import {getDefaultAllItemsView} from "@/features/all-items/components/all-items-list-view-options";
import {homeFilterParsers} from "@/lib/query-params";

export function useHomeFilters() {
  const resetViewOptions = useViewOptionsStore((state) => state.resetViewOptions);
  const [{tag, collection, type, sort}, setHomeFilters] = useQueryStates(homeFilterParsers);

  const tagFilter = tag?.trim() || null;
  const collectionFilter = collection;
  const scope = getBookmarkWorkspaceScope({tagFilter, collectionFilter});
  const typeFilter = type;

  const handleTypeChange = (nextType: TypeFilter) => {
    void setHomeFilters({type: nextType, id: null});
    resetViewOptions(getDefaultAllItemsView(nextType));
  };

  const handleSortChange = (nextSort: SortMode) => {
    void setHomeFilters({sort: nextSort, id: null});
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
