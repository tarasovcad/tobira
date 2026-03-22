"use client";

import {cn} from "@/lib/utils";
import {TypeSelect, SortSelect} from "../AllItemsToolbar";
import ViewOptionsMenu from "../ViewOptionsMenu";
import type {TypeFilter, SortMode} from "../AllItemsToolbar";
import type {Collection} from "@/app/actions/collections";

interface HomeToolbarProps {
  activeCollection: Collection | null;
  typeFilter: TypeFilter;
  onTypeChange: (nextType: TypeFilter) => void;
  sort: SortMode;
  onSortChange: (nextSort: SortMode) => void;
  selectionMode: boolean;
  onSelectionEnabledChange: (enabled: boolean) => void;
}

export function HomeToolbar({
  activeCollection,
  typeFilter,
  onTypeChange,
  sort,
  onSortChange,
  selectionMode,
  onSelectionEnabledChange,
}: HomeToolbarProps) {
  return (
    <div
      className={cn(
        "bg-background/90 sticky top-0 z-10 px-6 py-3 backdrop-blur",
        activeCollection ? "" : "border-b",
      )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TypeSelect value={typeFilter} onChange={onTypeChange} />
          <SortSelect value={sort} onChange={onSortChange} />
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "ring-border relative isolate flex h-8 gap-0.5 rounded-md bg-[rgba(255,255,255,0)] p-0.5",
              "shadow-[0_2px_4px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.06)] ring-1",
            )}>
            <button
              type="button"
              aria-pressed={selectionMode}
              onClick={() => onSelectionEnabledChange(!selectionMode)}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-md transition-colors duration-150 ease-out",
                "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
                selectionMode
                  ? "dark:text-foreground bg-[#F0F0F0] text-[#202020] dark:bg-[#181717]"
                  : "hover:bg-muted/40 bg-transparent text-[#BBBBBB] dark:text-[#606060]",
              )}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8.2476 10.8106L7.8498 11.2084C7.95533 11.3139 8.09843 11.3731 8.2476 11.3731C8.39678 11.3731 8.53987 11.3139 8.64532 11.2084L8.2476 10.8106ZM12.0203 7.83338C12.24 7.6137 12.24 7.25757 12.0203 7.0379C11.8006 6.81823 11.4445 6.81823 11.2248 7.0379L12.0203 7.83338ZM7.14533 8.91292C6.92566 8.69325 6.56951 8.69325 6.34984 8.91292C6.13016 9.1326 6.13016 9.4887 6.34984 9.70837L7.14533 8.91292ZM14.625 6.4125V11.5875H15.75V6.4125H14.625ZM11.5875 14.625H6.4125V15.75H11.5875V14.625ZM3.375 11.5875V6.4125H2.25V11.5875H3.375ZM6.4125 3.375H11.5875V2.25H6.4125V3.375ZM6.4125 14.625C5.77316 14.625 5.32748 14.6245 4.98051 14.5962C4.6401 14.5684 4.44453 14.5166 4.29639 14.4411L3.78566 15.4435C4.11881 15.6132 4.47892 15.684 4.8889 15.7175C5.29231 15.7505 5.79173 15.75 6.4125 15.75V14.625ZM2.25 11.5875C2.25 12.2083 2.24957 12.7077 2.28252 13.1111C2.31602 13.5211 2.38679 13.8811 2.55655 14.2144L3.55893 13.7036C3.48345 13.5555 3.4316 13.3599 3.40379 13.0195C3.37544 12.6725 3.375 12.2269 3.375 11.5875H2.25ZM4.29639 14.4411C3.97887 14.2793 3.72071 14.0211 3.55893 13.7036L2.55655 14.2144C2.82619 14.7436 3.25645 15.1738 3.78566 15.4435L4.29639 14.4411ZM14.625 11.5875C14.625 12.2269 14.6245 12.6725 14.5962 13.0195C14.5684 13.3599 14.5166 13.5555 14.4411 13.7036L15.4435 14.2144C15.6132 13.8811 15.684 13.5211 15.7175 13.1111C15.7505 12.7077 15.75 12.2083 15.75 11.5875H14.625ZM11.5875 15.75C12.2083 15.75 12.7077 15.7505 13.1111 15.7175C13.5211 15.684 13.8811 15.6132 14.2144 15.4435L13.7036 14.4411C13.5555 14.5166 13.3599 14.5684 13.0195 14.5962C12.6725 14.6245 12.2269 14.625 11.5875 14.625V15.75ZM14.4411 13.7036C14.2793 14.0211 14.0211 14.2793 13.7036 14.4411L14.2144 15.4435C14.7436 15.1738 15.1738 14.7436 15.4435 14.2144L14.4411 13.7036ZM15.75 6.4125C15.75 5.79173 15.7505 5.29231 15.7175 4.8889C15.684 4.47892 15.6132 4.11881 15.4435 3.78566L14.4411 4.29639C14.5166 4.44453 14.5684 4.6401 14.5962 4.98051C14.6245 5.32748 14.625 5.77316 14.625 6.4125H15.75ZM11.5875 3.375C12.2269 3.375 12.6725 3.37544 13.0195 3.40379C13.3599 3.4316 13.5555 3.48345 13.7036 3.55893L14.2144 2.55655C13.8811 2.38679 13.5211 2.31602 13.1111 2.28252C12.7077 2.24957 12.2083 2.25 11.5875 2.25V3.375ZM15.4435 3.78566C15.1738 3.25645 14.7436 2.82619 14.2144 2.55655L13.7036 3.55893C14.0211 3.72071 14.2793 3.97887 14.4411 4.29639L15.4435 3.78566ZM3.375 6.4125C3.375 5.77316 3.37544 5.32748 3.40379 4.98051C3.4316 4.6401 3.48345 4.44453 3.55893 4.29639L2.55655 3.78566C2.38679 4.11881 2.31602 4.47892 2.28252 4.8889C2.24957 5.29231 2.25 5.79173 2.25 6.4125H3.375ZM6.4125 2.25C5.79173 2.25 5.29231 2.24957 4.8889 2.28252C4.47892 2.31602 4.11881 2.38679 3.78566 2.55655L4.29639 3.55893C4.44453 3.48345 4.6401 3.4316 4.98051 3.40379C5.32748 3.37544 5.77316 3.375 6.4125 3.375V2.25ZM3.55893 4.29639C3.72071 3.97887 3.97887 3.72071 4.29639 3.55893L3.78566 2.55655C3.25645 2.82619 2.82619 3.25645 2.55655 3.78566L3.55893 4.29639ZM8.64532 11.2084L12.0203 7.83338L11.2248 7.0379L7.8498 10.4129L8.64532 11.2084ZM6.34984 9.70837L7.8498 11.2084L8.64532 10.4129L7.14533 8.91292L6.34984 9.70837Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          <ViewOptionsMenu typeFilter={typeFilter} />
        </div>
      </div>
    </div>
  );
}
