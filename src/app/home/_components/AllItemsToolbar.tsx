"use client";

import {cn} from "@/lib/utils";
import {Select, SelectItem, SelectPopup, SelectTrigger} from "@/components/coss-ui/select";

export type ViewMode = "grid" | "list";
export type TypeFilter = "website" | "media";
export type SortMode = "recent" | "oldest" | "az";

function getTypeLabel(value: TypeFilter) {
  switch (value) {
    case "website":
      return "Websites";
    case "media":
      return "Media";
  }
}

function getSortLabel(value: SortMode) {
  switch (value) {
    case "recent":
      return "Sort: Recent";
    case "oldest":
      return "Sort: Oldest";
    case "az":
      return "Sort: A–Z";
  }
}

export function ViewToggle({value, onChange}: {value: ViewMode; onChange: (v: ViewMode) => void}) {
  const gridActive = value === "grid";
  const listActive = value === "list";

  return (
    <div
      className={cn(
        "ring-border relative isolate flex h-8 gap-0.5 rounded-md bg-[rgba(255,255,255,0)] p-0.5",
        "shadow-[0_2px_4px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.06)] ring-1",
      )}>
      <button
        type="button"
        aria-label="Grid view"
        aria-pressed={gridActive}
        onClick={() => onChange("grid")}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md transition-colors duration-150 ease-out",
          "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
          gridActive
            ? "dark:text-foreground bg-[#F0F0F0] text-[#202020] dark:bg-[#181717]"
            : "hover:bg-muted/40 bg-transparent text-[#BBBBBB] dark:text-[#606060]",
        )}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3.16667 2C2.52233 2 2 2.52233 2 3.16667C2 3.811 2.52233 4.33333 3.16667 4.33333C3.811 4.33333 4.33333 3.811 4.33333 3.16667C4.33333 2.52233 3.811 2 3.16667 2Z"
            fill="currentColor"
          />
          <path
            d="M8.00016 2C7.35583 2 6.8335 2.52233 6.8335 3.16667C6.8335 3.811 7.35583 4.33333 8.00016 4.33333C8.6445 4.33333 9.16683 3.811 9.16683 3.16667C9.16683 2.52233 8.6445 2 8.00016 2Z"
            fill="currentColor"
          />
          <path
            d="M12.8332 2C12.1888 2 11.6665 2.52233 11.6665 3.16667C11.6665 3.811 12.1888 4.33333 12.8332 4.33333C13.4775 4.33333 13.9998 3.811 13.9998 3.16667C13.9998 2.52233 13.4775 2 12.8332 2Z"
            fill="currentColor"
          />
          <path
            d="M3.16667 6.8335C2.52233 6.8335 2 7.35583 2 8.00016C2 8.6445 2.52233 9.16683 3.16667 9.16683C3.811 9.16683 4.33333 8.6445 4.33333 8.00016C4.33333 7.35583 3.811 6.8335 3.16667 6.8335Z"
            fill="currentColor"
          />
          <path
            d="M8.00016 6.8335C7.35583 6.8335 6.8335 7.35583 6.8335 8.00016C6.8335 8.6445 7.35583 9.16683 8.00016 9.16683C8.6445 9.16683 9.16683 8.6445 9.16683 8.00016C9.16683 7.35583 8.6445 6.8335 8.00016 6.8335Z"
            fill="currentColor"
          />
          <path
            d="M12.8332 6.8335C12.1888 6.8335 11.6665 7.35583 11.6665 8.00016C11.6665 8.6445 12.1888 9.16683 12.8332 9.16683C13.4775 9.16683 13.9998 8.6445 13.9998 8.00016C13.9998 7.35583 13.4775 6.8335 12.8332 6.8335Z"
            fill="currentColor"
          />
          <path
            d="M3.16667 11.6665C2.52233 11.6665 2 12.1888 2 12.8332C2 13.4775 2.52233 13.9998 3.16667 13.9998C3.811 13.9998 4.33333 13.4775 4.33333 12.8332C4.33333 12.1888 3.811 11.6665 3.16667 11.6665Z"
            fill="currentColor"
          />
          <path
            d="M8.00016 11.6665C7.35583 11.6665 6.8335 12.1888 6.8335 12.8332C6.8335 13.4775 7.35583 13.9998 8.00016 13.9998C8.6445 13.9998 9.16683 13.4775 9.16683 12.8332C9.16683 12.1888 8.6445 11.6665 8.00016 11.6665Z"
            fill="currentColor"
          />
          <path
            d="M12.8332 11.6665C12.1888 11.6665 11.6665 12.1888 11.6665 12.8332C11.6665 13.4775 12.1888 13.9998 12.8332 13.9998C13.4775 13.9998 13.9998 13.4775 13.9998 12.8332C13.9998 12.1888 13.4775 11.6665 12.8332 11.6665Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label="List view"
        aria-pressed={listActive}
        onClick={() => onChange("list")}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md transition-colors duration-150 ease-out",
          "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
          listActive
            ? "dark:text-foreground bg-[#F0F0F0] text-[#202020] dark:bg-[#181717]"
            : "hover:bg-muted/40 bg-transparent text-[#BBBBBB] dark:text-[#606060]",
        )}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1.3335 3.8335C1.3335 3.55736 1.55736 3.3335 1.8335 3.3335H14.1668C14.443 3.3335 14.6668 3.55736 14.6668 3.8335C14.6668 4.10964 14.443 4.3335 14.1668 4.3335H1.8335C1.55736 4.3335 1.3335 4.10964 1.3335 3.8335ZM1.3335 8.00016C1.3335 7.72403 1.55736 7.50016 1.8335 7.50016H14.1668C14.443 7.50016 14.6668 7.72403 14.6668 8.00016C14.6668 8.2763 14.443 8.50016 14.1668 8.50016H1.8335C1.55736 8.50016 1.3335 8.2763 1.3335 8.00016ZM1.3335 12.1668C1.3335 11.8907 1.55736 11.6668 1.8335 11.6668H14.1668C14.443 11.6668 14.6668 11.8907 14.6668 12.1668C14.6668 12.443 14.443 12.6668 14.1668 12.6668H1.8335C1.55736 12.6668 1.3335 12.443 1.3335 12.1668Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

export function TypeSelect({
  value,
  onChange,
}: {
  value: TypeFilter;
  onChange: (v: TypeFilter) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TypeFilter)}>
      <SelectTrigger aria-label="Filter by type" size="sm" className="min-w-36 rounded-md">
        <span className="text-muted-foreground sr-only">Filter by type</span>
        <span className="flex-1 truncate">{getTypeLabel(value)}</span>
      </SelectTrigger>
      <SelectPopup>
        <SelectItem value="website">Websites</SelectItem>
        <SelectItem value="media">Media</SelectItem>
      </SelectPopup>
    </Select>
  );
}

export function SortSelect({value, onChange}: {value: SortMode; onChange: (v: SortMode) => void}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortMode)}>
      <SelectTrigger aria-label="Sort" size="sm" className="min-w-40 rounded-md">
        <span className="text-muted-foreground sr-only">Sort</span>
        <span className="flex-1 truncate">{getSortLabel(value)}</span>
      </SelectTrigger>
      <SelectPopup>
        <SelectItem value="recent">Sort: Recent</SelectItem>
        <SelectItem value="oldest">Sort: Oldest</SelectItem>
        <SelectItem value="az">Sort: A–Z</SelectItem>
      </SelectPopup>
    </Select>
  );
}
