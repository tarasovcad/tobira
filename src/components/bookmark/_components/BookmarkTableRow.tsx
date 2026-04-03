"use client";

import * as React from "react";
import Link from "next/link";
import {cn} from "@/lib/utils/classnames";
import {useViewOptionsStore} from "@/store/use-view-options";
import {BookmarkAvatar} from "./BookmarkAvatar";
import {BookmarkHoverActions} from "./BookmarkHoverActions";
import {getDomainName} from "./BookmarkMeta";
import {BookmarkSelectionControl} from "./BookmarkSelectionControl";
import type {BookmarkItemProps} from "./bookmark-item-props";
import {formatDateAbsolute} from "@/lib/utils/dates";

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

export function getTableBookmarkColumnsClass(showSource: boolean, showSavedDate: boolean): string {
  if (showSource && showSavedDate) {
    return "md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_auto]";
  }

  if (showSource) {
    return "md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)]";
  }

  if (showSavedDate) {
    return "md:grid-cols-[auto_minmax(0,2fr)_auto]";
  }

  return "md:grid-cols-[auto_minmax(0,1fr)]";
}

function BookmarkTableRowImpl({
  item,
  onOpenMenu,
  className,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
  const {contentToggles} = useViewOptionsStore();
  const showSource = contentToggles.source;
  const showSavedDate = contentToggles.savedDate;

  return (
    <Link
      href={item.url}
      target="_blank"
      className={cn(
        "group relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b px-4 py-3 pr-14 text-left",
        getTableBookmarkColumnsClass(showSource, showSavedDate),
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        isSelected && "bg-muted",
        className,
        "transition-none!",
      )}>
      <BookmarkHoverActions
        className={cn("top-2.5 right-2", selectionModeHoverActionsClass)}
        onOptions={() => onOpenMenu?.(item)}
      />

      <div className="flex items-center">
        <BookmarkSelectionControl
          itemId={item.id}
          title={item.title}
          checked={isSelected}
          selectionIndex={selectionIndex}
          onCheckedChange={setSelected}
          paddingClassName="pr-2"
        />
        <BookmarkAvatar
          item={item}
          className="size-8"
          imageClassName="h-4 w-4 object-contain"
          height={16}
          width={16}
          iconSize={16}
        />
      </div>

      <div className="min-w-0">
        <div className="text-foreground truncate text-sm font-medium">{item.title}</div>
        <div className="text-muted-foreground mt-0.5 truncate text-xs md:hidden">
          {getDomainName(item.url)}
        </div>
      </div>

      {showSource ? (
        <div className="text-muted-foreground hidden min-w-0 truncate text-sm md:block">
          {getDomainName(item.url)}
        </div>
      ) : null}

      {showSavedDate ? (
        <div className="text-muted-foreground hidden shrink-0 text-sm md:block">
          {formatDateAbsolute(item.created_at)}
        </div>
      ) : null}
    </Link>
  );
}

export const TableItemRow = React.memo(BookmarkTableRowImpl);
