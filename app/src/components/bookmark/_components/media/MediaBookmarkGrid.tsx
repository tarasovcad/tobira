"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import MediaPreview from "@/features/media/components/MediaPreview";
import type {WebsiteOrMediaMetadata} from "@/components/bookmark/types/metadata";
import type {BookmarkItemProps} from "@/components/bookmark/types";
import {
  getBookmarkMediaPreviewSizeForColumnSize,
  getBookmarkMediaQualityForColumnSize,
  getBookmarkMediaSizesForColumnSize,
  getBookmarkMediaPreviewItem,
} from "@/features/media/components/bookmark/bookmark-images";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import MediaBookmarkHoverAction from "./MediaBookmarkHoverAction";

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

export default function MediaBookmarkGrid({
  item,
  onOpenMenu,
  className,
  mediaIndex = 0,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
  const {borderRadius, columnSize, gridGap} = useViewOptionsStore();
  const previewSize = getBookmarkMediaPreviewSizeForColumnSize(columnSize);
  const imageSizes = getBookmarkMediaSizesForColumnSize(columnSize);
  const imageQuality = getBookmarkMediaQualityForColumnSize(columnSize);
  const previewItem = getBookmarkMediaPreviewItem(item, mediaIndex, previewSize);
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
      <MediaBookmarkHoverAction
        variant="glass"
        className={selectionModeHoverActionsClass}
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
            sizes={imageSizes}
            quality={imageQuality}
            loading="lazy"
            className="h-full w-full object-cover"
            buttonClassName="h-full w-full"
          />
        </div>
      ) : null}
    </div>
  );
}
