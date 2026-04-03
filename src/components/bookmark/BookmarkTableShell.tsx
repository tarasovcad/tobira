"use client";

import * as React from "react";
import {cn} from "@/lib/utils/classnames";
import {useViewOptionsStore} from "@/store/use-view-options";
import {getTableBookmarkColumnsClass} from "./_components/BookmarkTableRow";

export function BookmarkTableShell({children}: {children: React.ReactNode}) {
  const contentToggles = useViewOptionsStore((state) => state.contentToggles);
  const showSourceColumn = contentToggles.source;
  const showSavedDateColumn = contentToggles.savedDate;
  const tableColumnsClass = getTableBookmarkColumnsClass(showSourceColumn, showSavedDateColumn);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div
        className={cn(
          "bg-muted/40 text-muted-foreground grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b px-4 py-2 text-xs font-medium tracking-wide uppercase",
          tableColumnsClass,
        )}>
        <div className="w-8 shrink-0" />
        <div>Title</div>
        {showSourceColumn && <div className="hidden min-w-0 truncate md:block">Source</div>}
        {showSavedDateColumn && <div className="hidden shrink-0 md:block">Saved</div>}
      </div>

      {children}
    </div>
  );
}
