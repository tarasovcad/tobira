"use client";

import {cn} from "@/lib/utils";
import ViewOptionsMenu from "@/features/all-items/components/ViewOptionsMenu";
import type {TypeFilter, SortMode} from "@/features/home/types";
import {TypeSelect, SortSelect} from "@/features/all-items/components/AllItemsToolbar";
import {SelectionModeButton} from "@/components/bookmark/SelectionModeButton";

interface HomeToolbarProps {
  typeFilter: TypeFilter;
  onTypeChange: (nextType: TypeFilter) => void;
  sort: SortMode;
  onSortChange: (nextSort: SortMode) => void;
  selectionMode: boolean;
  onSelectionEnabledChange?: (enabled: boolean) => void;
}

export function HomeToolbar({
  typeFilter,
  onTypeChange,
  sort,
  onSortChange,
  selectionMode,
  onSelectionEnabledChange,
}: HomeToolbarProps) {
  return (
    <div className={cn("bg-background/90 sticky top-0 z-10 border-b px-6 py-3 backdrop-blur")}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TypeSelect value={typeFilter} onChange={onTypeChange} />
          <SortSelect value={sort} onChange={onSortChange} />
        </div>
        <div className="flex items-center gap-2">
          <SelectionModeButton
            selectionMode={selectionMode}
            onSelectionEnabledChange={onSelectionEnabledChange}
          />
          <ViewOptionsMenu typeFilter={typeFilter} />
        </div>
      </div>
    </div>
  );
}
