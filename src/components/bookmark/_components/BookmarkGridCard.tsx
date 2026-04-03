"use client";

import * as React from "react";
import Link from "next/link";
import {cn} from "@/lib/utils/classnames";
import {useViewOptionsStore} from "@/store/use-view-options";
import {BookmarkHoverActions} from "./BookmarkHoverActions";
import {BookmarkImage} from "./BookmarkImage";
import {BookmarkMeta} from "./BookmarkMeta";
import {BookmarkSelectionControl} from "./BookmarkSelectionControl";
import type {BookmarkItemProps} from "./bookmark-item-props";

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

function BookmarkGridCardImpl({
  item,
  onOpenMenu,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
  const {borderRadius, contentToggles, gridGap} = useViewOptionsStore();
  const [previewOpenSignal, setPreviewOpenSignal] = React.useState(0);
  const zeroGap = gridGap === "none";
  const onlyTitle =
    !contentToggles.source &&
    !contentToggles.savedDate &&
    !(contentToggles.description && item.description) &&
    !(contentToggles.tags && item.tags && item.tags.length > 0);

  const radiusClass =
    borderRadius === "none" || zeroGap
      ? "rounded-none"
      : borderRadius === "sm"
        ? "rounded-sm"
        : borderRadius === "md"
          ? "rounded-md"
          : "rounded-lg";

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
        <BookmarkHoverActions
          variant="glass"
          className={selectionModeHoverActionsClass}
          onExpand={() => {
            setPreviewOpenSignal((current) => current + 1);
          }}
          onOptions={() => onOpenMenu?.(item)}
        />

        <BookmarkSelectionControl
          itemId={item.id}
          title={item.title}
          checked={isSelected}
          selectionIndex={selectionIndex}
          onCheckedChange={setSelected}
          variant="overlay"
          delayStepMs={15}
        />

        <BookmarkImage
          bookmark_id={item.id}
          item={item}
          type="preview"
          fill={true}
          previewOpenSignal={previewOpenSignal}
          disablePreviewOnClick={true}
          imageClassName="h-full w-full object-cover"
        />
      </div>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col px-4",
          onlyTitle ? "py-3" : "pt-3 pb-4",
        )}>
        <BookmarkMeta
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

export const GridCard = React.memo(BookmarkGridCardImpl);
