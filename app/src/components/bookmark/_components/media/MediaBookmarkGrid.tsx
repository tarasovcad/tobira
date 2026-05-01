"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import MediaPreview from "@/features/media/components/MediaPreview";
import {MediaGalleryTilePreview} from "@/features/media/components/MediaGalleryTilePreview";
import {
  getBookmarkMediaPreviewSizeForColumnSize,
  getBookmarkMediaQualityForColumnSize,
  getBookmarkMediaSizesForColumnSize,
} from "@/components/bookmark/_utils/media-grid-image-config";
import {getMediaBookmarkGridPreviewItem} from "@/components/bookmark/_utils/media-bookmark-preview";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import {MediaBookmark} from "../../types";
import BookmarkHoverActions from "../shared/BookmarkHoverActions";
import type {MediaGalleryController} from "@/features/media/hooks/useMediaGalleryController";

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

interface MediaBookmarkGridProps {
  item: MediaBookmark;
  onOpenMenu?: (item: MediaBookmark) => void;
  className?: string;
  renderId?: string;
  mediaIndex?: number;
  galleryItem?: {
    index: number;
    renderId: string;
    controller: MediaGalleryController;
  };
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
  className,
  mediaIndex = 0,
  galleryItem,
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
  const canOpenGallery = galleryItem !== undefined;

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
          className={cn(canOpenGallery && "focus-visible:ring-ring focus-visible:ring-2")}>
          {galleryItem ? (
            <MediaGalleryTilePreview
              controller={galleryItem.controller}
              index={galleryItem.index}
              renderId={galleryItem.renderId}
              src={previewItem.src}
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
          ) : (
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
          )}
        </div>
      ) : null}
    </div>
  );
}
