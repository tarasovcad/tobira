"use client";

import {type MouseEvent} from "react";
import {RotateCcwIcon, Trash2Icon} from "lucide-react";

import {
  getBookmarkMediaPreviewSizeForColumnSize,
  getBookmarkMediaQualityForColumnSize,
  getBookmarkMediaSizesForColumnSize,
} from "@/components/bookmark/_utils/media-grid-image-config";
import {getMediaBookmarkGridPreviewItem} from "@/components/bookmark/_utils/media-bookmark-preview";
import BookmarkSelectionCheckbox from "@/components/bookmark/_components/shared/BookmarkSelectionCheckbox";
import type {MediaBookmark} from "@/components/bookmark/types";
import {Badge} from "@/components/ui/coss/badge";
import MediaPreview from "@/features/media/components/MediaPreview";
import {MediaGalleryTilePreview} from "@/features/media/components/MediaGalleryTilePreview";
import type {MediaGalleryController} from "@/features/media/hooks/useMediaGalleryController";
import {cn} from "@/lib/utils";
import {formatDateAbsolute, normalizeUtcTimestamp} from "@/lib/utils/dates";
import {useViewOptionsStore} from "@/store/use-view-options";

const BIN_RETENTION_DAYS = 40;

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

interface BinMediaBookmarkGridProps {
  item: MediaBookmark;
  className?: string;
  mediaIndex?: number;
  galleryItem?: {
    index: number;
    renderId: string;
    controller: MediaGalleryController;
  };
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
  onRestore?: (item: MediaBookmark) => void;
  onDeleteForever?: (item: MediaBookmark) => void;
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

export default function BinMediaBookmarkGrid({
  item,
  className,
  mediaIndex = 0,
  galleryItem,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
  onRestore,
  onDeleteForever,
}: BinMediaBookmarkGridProps) {
  const {borderRadius, columnSize, gridGap} = useViewOptionsStore(
    (state) => state.viewOptionsByLayout.grid,
  );
  const previewSize = getBookmarkMediaPreviewSizeForColumnSize(columnSize);
  const imageSizes = getBookmarkMediaSizesForColumnSize(columnSize);
  const imageQuality = getBookmarkMediaQualityForColumnSize(columnSize);
  const previewItem = getMediaBookmarkGridPreviewItem(item, mediaIndex, previewSize);
  const radiusClass = getRadiusClass(borderRadius);
  const deletionInfo = getDeletionInfo(item.deleted_at);

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
      <BinMediaGridActions
        className={selectionModeHoverActionsClass}
        onRestore={() => onRestore?.(item)}
        onDeleteForever={() => onDeleteForever?.(item)}
      />

      <div
        className={cn(
          "pointer-events-none absolute top-2 left-2 z-20 transition-opacity",
          "group-data-[selection-mode=true]/bookmark-row:opacity-0",
        )}
        title={deletionInfo.deletedTitle}>
        <Badge
          size="lg"
          variant={deletionInfo.isExpired ? "error" : "outline"}
          className={cn(
            "bg-background/90 text-[13px]! font-normal shadow-xs backdrop-blur-sm",
            !deletionInfo.isExpired && "text-muted-foreground",
          )}>
          {deletionInfo.label}
        </Badge>
      </div>

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

function getDeletionInfo(deletedAt: string) {
  if (!deletedAt) {
    return {
      label: "Scheduled for deletion",
      deletedTitle: "Deletion date unavailable",
      isExpired: false,
    };
  }

  const deletedDate = new Date(normalizeUtcTimestamp(deletedAt));
  const expiresAt = new Date(deletedDate);
  expiresAt.setDate(expiresAt.getDate() + BIN_RETENTION_DAYS);

  const msUntilExpiry = expiresAt.getTime() - Date.now();
  const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));
  const deletedTitle = `Deleted ${formatDateAbsolute(deletedAt)}`;

  if (daysUntilExpiry <= 0) {
    return {
      label: "Pending permanent deletion",
      deletedTitle,
      isExpired: true,
    };
  }

  if (daysUntilExpiry === 1) {
    return {
      label: "Deletes tomorrow",
      deletedTitle,
      isExpired: false,
    };
  }

  return {
    label: `Deletes in ${daysUntilExpiry} days`,
    deletedTitle,
    isExpired: false,
  };
}

function BinMediaGridActions({
  className,
  onRestore,
  onDeleteForever,
}: {
  className?: string;
  onRestore?: () => void;
  onDeleteForever?: () => void;
}) {
  const stopNav = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleRestore = (event: MouseEvent<HTMLButtonElement>) => {
    stopNav(event);
    onRestore?.();
  };

  const handleDeleteForever = (event: MouseEvent<HTMLButtonElement>) => {
    stopNav(event);
    onDeleteForever?.();
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-2 right-2 z-20 flex items-center overflow-hidden rounded-md border border-white/10 bg-black/40 opacity-100 shadow-xl backdrop-blur-md",
        className,
      )}>
      <button
        type="button"
        aria-label="Restore"
        className={getGlassActionButtonClassName(true)}
        onClick={handleRestore}>
        <RotateCcwIcon className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Delete forever"
        className={getGlassActionButtonClassName(false)}
        onClick={handleDeleteForever}>
        <Trash2Icon className="size-4" aria-hidden />
      </button>
    </div>
  );
}

function getGlassActionButtonClassName(hasRightBorder: boolean) {
  return cn(
    "pointer-events-auto flex size-8 cursor-pointer items-center justify-center text-white/90 transition-colors hover:bg-white/8",
    "outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0",
    hasRightBorder && "border-r border-white/15",
  );
}
