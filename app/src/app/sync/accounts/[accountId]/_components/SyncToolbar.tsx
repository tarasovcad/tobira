"use client";

import {cn} from "@/lib/utils";
import ViewOptionsMenu from "@/features/all-items/components/ViewOptionsMenu";
import {SortSelect} from "@/features/all-items/components/AllItemsToolbar";
import {Select, SelectItem, SelectPopup, SelectTrigger} from "@/components/coss-ui/select";
import {Button} from "@/components/coss-ui/button";
import {AnimatePresence, motion} from "framer-motion";
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
          <Button
            variant="outline"
            size="icon"
            aria-pressed={selectionMode}
            onClick={() => onSelectionEnabledChange(!selectionMode)}
            className={cn(
              "group/selection-button",
              selectionMode
                ? "dark:text-foreground bg-[#F0F0F0] text-[#202020] dark:bg-[#181717]"
                : "hover:bg-muted/40 bg-transparent text-[#BBBBBB] dark:text-[#606060]",
            )}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.73551 1.72971C2.493 1.30486 1.30461 2.49323 1.72947 3.73574L4.803 12.7245C5.27259 14.0978 7.19007 14.1644 7.75376 12.8269L9.21113 9.36869C9.24101 9.29775 9.29751 9.24125 9.36844 9.21137L12.8266 7.754C14.1641 7.19031 14.0976 5.27283 12.7243 4.80324L3.73551 1.72971Z"
                fill="currentColor"
              />
              <AnimatePresence initial={false}>
                {!selectionMode && (
                  <motion.g key="cross-line" initial="hidden" animate="visible" exit="hidden">
                    <motion.line
                      x1="2.5"
                      y1="11.1"
                      x2="11.1"
                      y2="2.5"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      strokeDasharray="13"
                      variants={{
                        hidden: {
                          strokeDashoffset: 13,
                          transition: {duration: 0.075, ease: "easeIn"},
                        },
                        visible: {
                          strokeDashoffset: 0,
                          transition: {duration: 0.1, ease: "easeOut"},
                        },
                      }}
                      className={cn(
                        "stroke-background dark:stroke-[#181717]",
                        "group-hover/selection-button:stroke-[#F5F5F5]",
                        "group-hover/selection-button:dark:stroke-[#212121]",
                      )}
                    />
                    <motion.line
                      x1="2.5"
                      y1="11.1"
                      x2="11.1"
                      y2="2.5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeDasharray="13"
                      variants={{
                        hidden: {
                          strokeDashoffset: 13,
                          transition: {duration: 0.075, ease: "easeIn"},
                        },
                        visible: {
                          strokeDashoffset: 0,
                          transition: {duration: 0.1, ease: "easeOut"},
                        },
                      }}
                    />
                  </motion.g>
                )}
              </AnimatePresence>
            </svg>
          </Button>
          <ViewOptionsMenu typeFilter={typeFilter} />
        </div>
      </div>
    </div>
  );
}
