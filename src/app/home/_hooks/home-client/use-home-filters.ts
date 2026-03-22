"use client";

import {useState} from "react";
import {useSearchParams, useRouter, usePathname} from "next/navigation";
import {normalizeTagParam} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {TypeFilter, SortMode} from "../../_components/AllItemsToolbar";
import {getDefaultAllItemsView} from "../../_components/all-items-list-view-options";

const resolveSortFilter = (sortParam: string | null): SortMode => {
  if (sortParam === "oldest" || sortParam === "az") return sortParam;
  return "recent";
};

export function useHomeFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const resetViewOptions = useViewOptionsStore((state) => state.resetViewOptions);

  const tagFilter = normalizeTagParam(searchParams.get("tag") ?? searchParams.get("tab"));
  const collectionFilter = searchParams.get("collection");
  const initialTypeFilter = (
    searchParams.get("type") === "media" ? "media" : "website"
  ) as TypeFilter;
  const initialSort = resolveSortFilter(searchParams.get("sort"));

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(initialTypeFilter);
  const [sort, setSort] = useState<SortMode>(initialSort);

  const updateUrlParam = (key: "type" | "sort", value: TypeFilter | SortMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const handleTypeChange = (nextType: TypeFilter) => {
    setTypeFilter(nextType);
    resetViewOptions(getDefaultAllItemsView(nextType));
    updateUrlParam("type", nextType);
  };

  const handleSortChange = (nextSort: SortMode) => {
    setSort(nextSort);
    updateUrlParam("sort", nextSort);
  };

  return {
    tagFilter,
    collectionFilter,
    typeFilter,
    sort,
    handleTypeChange,
    handleSortChange,
  };
}
