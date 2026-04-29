"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import MediaPreview from "@/features/media/components/MediaPreview";
import {
  getBookmarkMediaPreviewSizeForColumnSize,
  getBookmarkMediaQualityForColumnSize,
  getBookmarkMediaSizesForColumnSize,
} from "@/components/bookmark/_utils/media-grid-image-config";
import {getMediaBookmarkGridPreviewItem} from "@/components/bookmark/_utils/media-bookmark-preview";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import {MediaBookmark} from "../../types";
import BookmarkHoverActions from "../shared/BookmarkHoverActions";

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

interface MediaBookmarkGridProps {
  item: MediaBookmark;
  onOpenMenu?: (item: MediaBookmark) => void;
  onOpenGallery?: (galleryIndex: number, triggerElement: HTMLDivElement) => void;
  className?: string;
  galleryIndex?: number;
  mediaIndex?: number;
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
}

function getRadiusClass(borderRadius: string): string {
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
}

export default function MediaBookmarkGrid({
  item,
  onOpenMenu,
  onOpenGallery,
  className,
  galleryIndex,
  mediaIndex = 0,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: MediaBookmarkGridProps) {
  const {borderRadius, columnSize, gridGap} = useViewOptionsStore();
  const previewSize = getBookmarkMediaPreviewSizeForColumnSize(columnSize);
  const imageSizes = getBookmarkMediaSizesForColumnSize(columnSize);
  const imageQuality = getBookmarkMediaQualityForColumnSize(columnSize);
  const previewItem = getMediaBookmarkGridPreviewItem(item, mediaIndex, previewSize);
  const radiusClass = getRadiusClass(borderRadius);

  const meta = item.metadata;
  const width = previewItem?.width ?? meta?.width ?? 1200;
  const height = previewItem?.height ?? meta?.height ?? 1200;
  const aspectRatio = width > 0 && height > 0 ? `${width} / ${height}` : "16/9";
  const canOpenGallery = galleryIndex !== undefined && !!onOpenGallery;

  const handleOpenGallery = React.useCallback(
    (triggerElement: HTMLDivElement) => {
      if (!onOpenGallery || galleryIndex === undefined) {
        return;
      }

      onOpenGallery(galleryIndex, triggerElement);
    },
    [galleryIndex, onOpenGallery],
  );

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

      <BookmarkSelectionCheckbox
        itemId={item.id}
        title={item.title}
        checked={isSelected}
        selectionIndex={selectionIndex}
        onCheckedChange={setSelected}
        variant="overlay"
        size="large"
        delayStepMs={15}
      />

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-10 bg-black/15 opacity-0 transition-opacity duration-200 group-data-[selection-mode=true]/bookmark-row:opacity-100",
          isSelected && "bg-black/25",
        )}
      />

      {previewItem ? (
        <div
          style={{aspectRatio}}
          role={canOpenGallery ? "button" : undefined}
          tabIndex={canOpenGallery ? 0 : undefined}
          className={cn(canOpenGallery && "focus-visible:ring-ring focus-visible:ring-2")}
          onClickCapture={(event) => {
            if (!canOpenGallery) {
              return;
            }

            handleOpenGallery(event.currentTarget);
          }}
          onKeyDown={(event) => {
            if (!canOpenGallery || (event.key !== "Enter" && event.key !== " ")) {
              return;
            }

            event.preventDefault();
            handleOpenGallery(event.currentTarget);
          }}>
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
            disableClickToOpen={canOpenGallery}
            className="h-full w-full object-cover"
            buttonClassName="h-full w-full"
          />
        </div>
      ) : null}
    </div>
  );
}
