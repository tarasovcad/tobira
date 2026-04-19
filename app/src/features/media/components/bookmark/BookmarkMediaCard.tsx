"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import MediaPreview from "@/features/media/components/MediaPreview";
import type {WebsiteOrMediaMetadata} from "@/app/home/_types/bookmark-metadata";
import {BookmarkHoverActions} from "@/components/bookmark/_components/BookmarkHoverActions";
import {BookmarkSelectionControl} from "@/components/bookmark/_components/BookmarkSelectionControl";
import type {BookmarkItemProps} from "@/components/bookmark/_components/bookmark-item-props";
import {getBookmarkMediaPreviewItem} from "./bookmark-images";

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

function BookmarkMediaCardImpl({
  item,
  onOpenMenu,
  className,
  mediaIndex = 0,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
  const {borderRadius, gridGap} = useViewOptionsStore();
  const previewItem = getBookmarkMediaPreviewItem(item, mediaIndex);
  const radiusClass =
    borderRadius === "none"
      ? "rounded-none"
      : borderRadius === "sm"
        ? "rounded-sm"
        : borderRadius === "md"
          ? "rounded-md"
          : "rounded-lg";

  const meta = item.metadata as WebsiteOrMediaMetadata | undefined;
  const width = previewItem?.width ?? meta?.width ?? 1200;
  const height = previewItem?.height ?? meta?.height ?? 1200;
  const aspectRatio = width > 0 && height > 0 ? `${width} / ${height}` : "16/9";

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
        className,
      )}>
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

      {previewItem ? (
        <div style={{aspectRatio}}>
          <MediaPreview
            src={previewItem.src}
            fullSizeSrc={previewItem.type === "image" ? previewItem.fullSizeSrc : undefined}
            alt={previewItem.alt}
            width={previewItem.width}
            height={previewItem.height}
            poster={previewItem.poster}
            type={previewItem.type}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            quality={50}
            loading="lazy"
            className="h-full w-full object-cover"
            buttonClassName="h-full w-full"
          />
        </div>
      ) : null}
    </div>
  );
}

export const MediaCard = React.memo(BookmarkMediaCardImpl);
