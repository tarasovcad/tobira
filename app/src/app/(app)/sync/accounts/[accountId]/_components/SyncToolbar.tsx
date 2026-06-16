"use client";

import {cn} from "@/lib/utils";
import ViewOptionsMenu from "@/features/all-items/components/ViewOptionsMenu";
import {SortSelect} from "@/features/all-items/components/AllItemsToolbar";
import {Select, SelectItem, SelectPopup, SelectTrigger} from "@/components/ui/coss/select";
import {SelectionModeButton} from "@/components/bookmark/SelectionModeButton";
import type {SortMode, TypeFilter} from "@/features/home/types";
import type {SyncStatusFilter} from "../_types";

const STATUS_LABELS: Record<SyncStatusFilter, string> = {
  all: "All",
  unsaved: "Unsaved",
  added: "Added",
  errors: "Errors",
  duplicates: "Duplicates",
};

interface SyncToolbarProps {
  typeFilter: TypeFilter;
  statusFilter: SyncStatusFilter;
  onStatusFilterChange: (filter: SyncStatusFilter) => void;
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
  selectionMode: boolean;
  onSelectionEnabledChange: (enabled: boolean) => void;
}

export function SyncToolbar({
  typeFilter,
  statusFilter,
  onStatusFilterChange,
  sort,
  onSortChange,
  selectionMode,
  onSelectionEnabledChange,
}: SyncToolbarProps) {
  return (
    <div className={cn("bg-background/90 sticky top-0 z-10 border-b px-6 py-3 backdrop-blur")}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as SyncStatusFilter)}>
            <SelectTrigger aria-label="Filter by status" size="sm" className="min-w-36 rounded-md">
              <span className="flex-1 truncate">{STATUS_LABELS[statusFilter]}</span>
            </SelectTrigger>
            <SelectPopup>
              {(Object.keys(STATUS_LABELS) as SyncStatusFilter[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {STATUS_LABELS[key]}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

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
