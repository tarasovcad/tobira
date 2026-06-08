"use client";

import {useState} from "react";
import {useSearchParams, useRouter, usePathname} from "next/navigation";
import {parseAsStringLiteral, useQueryState} from "nuqs";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {TypeFilter, SortMode} from "@/features/home/types";
import {getDefaultAllItemsView} from "@/features/all-items/components/all-items-list-view-options";

const typeFilterParser = parseAsStringLiteral(["website", "media", "post"] as const).withDefault(
  "website",
);

const resolveSortFilter = (sortParam: string | null): SortMode => {
  if (sortParam === "oldest" || sortParam === "az") return sortParam;
  return "recent";
};

export function useHomeFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const resetViewOptions = useViewOptionsStore((state) => state.resetViewOptions);

  const tagFilter = searchParams.get("tag")?.trim() || null;
  const collectionFilter = searchParams.get("collection");
  const initialSort = resolveSortFilter(searchParams.get("sort"));

  const [typeFilter, setTypeFilter] = useQueryState("type", typeFilterParser);
  const [sort, setSort] = useState<SortMode>(initialSort);

  const updateUrlParam = (key: "sort", value: SortMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const handleTypeChange = (nextType: TypeFilter) => {
    void setTypeFilter(nextType);
    resetViewOptions(getDefaultAllItemsView(nextType));
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
