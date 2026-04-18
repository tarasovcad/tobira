"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import {BookmarkImage} from "./BookmarkImage";
import type {WebsiteOrMediaMetadata} from "@/app/home/_types/bookmark-metadata";
import {BookmarkHoverActions} from "@/components/bookmark/_components/BookmarkHoverActions";
import {BookmarkSelectionControl} from "@/components/bookmark/_components/BookmarkSelectionControl";
import type {BookmarkItemProps} from "@/components/bookmark/_components/bookmark-item-props";

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

function BookmarkMediaCardImpl({
  item,
  onOpenMenu,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
  const {borderRadius, gridGap} = useViewOptionsStore();
  const radiusClass =
    borderRadius === "none"
      ? "rounded-none"
      : borderRadius === "sm"
        ? "rounded-sm"
        : borderRadius === "md"
          ? "rounded-md"
          : "rounded-lg";

  const meta = item.metadata as WebsiteOrMediaMetadata | undefined;
  const hasDimensions = meta?.width && meta?.height;
  const aspectRatio = hasDimensions ? `${meta!.width} / ${meta!.height}` : "16/9";

  return (
    <div
      className={cn(
        "group bg-background relative block w-full cursor-pointer overflow-hidden text-left",
        gridGap !== "none" && "border",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! focus-visible:outline-none",
        isSelected && "bg-muted",
        radiusClass,
        "transition-none!",
      )}
      style={{aspectRatio}}>
      <BookmarkHoverActions
        variant="glass"
        className={selectionModeHoverActionsClass}
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
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        quality={50}
        loading="lazy"
        width={meta?.width ?? 1200}
        height={meta?.height ?? 1200}
        imageClassName="h-full w-full object-cover"
      />
    </div>
  );
}

export const MediaCard = React.memo(BookmarkMediaCardImpl);
