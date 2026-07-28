"use client";

import {cn} from "@/lib/utils";

const PLACEHOLDER_ROW_WIDTHS = ["w-28", "w-36", "w-24", "w-32", "w-20", "w-28"] as const;

export function ChromeFolderListLoading() {
  return (
    <div className="border-border overflow-hidden rounded-[10px] border" aria-hidden="true">
      <div className="divide-border divide-y">
        {PLACEHOLDER_ROW_WIDTHS.map((width, index) => (
          <div key={index} className="flex items-center gap-3 px-3.5 py-3">
            <div className="bg-muted size-3.5 shrink-0 animate-pulse rounded-[3px]" />
            <div className={cn("bg-muted h-4 animate-pulse rounded", width)} />
          </div>
        ))}
      </div>
    </div>
  );
}
