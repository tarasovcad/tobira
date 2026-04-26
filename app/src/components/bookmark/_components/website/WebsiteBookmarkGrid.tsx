"use client";

import Link from "next/link";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {WebsiteBookmark} from "@/components/bookmark/types";
import {useState} from "react";
import WebsiteBookmarkHoverActions from "./WebsiteBookmarkHoverActions";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import WebsiteBookmarkMeta from "./WebsiteBookmarkMeta";
import WebsiteBookmarkGridImage from "./WebsiteBookmarkGridImage";

interface BookmarkItemProps {
  item: WebsiteBookmark;
  onOpenMenu?: (item: WebsiteBookmark) => void;
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
}

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

export default function WebsiteBookmarkGrid({
  item,
  onOpenMenu,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
  const {borderRadius, contentToggles, gridGap} = useViewOptionsStore();
  const [previewOpenSignal, setPreviewOpenSignal] = useState(0);
  const zeroGap = gridGap === "none";

  const onlyTitle =
    !contentToggles.source &&
    !contentToggles.savedDate &&
    !(contentToggles.description && item.description) &&
    !(contentToggles.tags && item.tags && item.tags.length > 0);

  const radiusClass = (() => {
    if (zeroGap) return "rounded-none";

    switch (borderRadius) {
      case "none":
        return "rounded-none";
      case "sm":
        return "rounded-sm";
      case "md":
        return "rounded-md";
      default:
        return "rounded-lg";
    }
  })();

  return (
    <Link
      href={item.url}
      className={cn(
        "group bg-background relative flex h-full w-full cursor-pointer flex-col overflow-hidden text-left",
        zeroGap ? "border-r border-b" : "border",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        isSelected && "bg-muted",
        radiusClass,
        "transition-none!",
      )}>
      <div className="bg-muted relative aspect-16/10 w-full shrink-0">
        <WebsiteBookmarkHoverActions
          variant="glass"
          className={selectionModeHoverActionsClass}
          onExpand={() => {
            setPreviewOpenSignal((current) => current + 1);
          }}
          onOptions={() => onOpenMenu?.(item)}
        />
        <BookmarkSelectionCheckbox
          itemId={item.id}
          title={item.title}
          checked={isSelected}
          selectionIndex={selectionIndex}
          onCheckedChange={setSelected}
          variant="overlay"
          delayStepMs={15}
        />
        <WebsiteBookmarkGridImage item={item} previewOpenSignal={previewOpenSignal} />
      </div>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col px-4",
          onlyTitle ? "py-3" : "pt-3 pb-4",
        )}>
        <WebsiteBookmarkMeta
          title={item.title}
          url={item.url}
          createdAt={item.created_at}
          description={item.description}
          tags={item.tags}
          showSource={contentToggles.source}
          showSavedDate={contentToggles.savedDate}
          showDescription={contentToggles.description}
          showTags={contentToggles.tags}
          titleClassName="text-foreground line-clamp-1 text-[15px] font-[550]"
          sourceRowClassName="text-muted-foreground mt-1 min-w-0 text-[13px] whitespace-nowrap"
          descriptionClassName="text-muted-foreground line-clamp-2 text-[13px]"
          tagsWrapperClassName="mt-2 flex flex-wrap gap-1"
          tagClassName="text-muted-foreground text-[12px]"
        />
      </div>
    </Link>
  );
}
