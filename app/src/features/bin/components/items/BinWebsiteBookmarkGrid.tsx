"use client";

import Link from "next/link";
import {useState, type MouseEvent} from "react";

import BookmarkSelectionCheckbox from "@/components/bookmark/_components/shared/BookmarkSelectionCheckbox";
import WebsiteBookmarkGridImage from "@/components/bookmark/_components/website/WebsiteBookmarkGridImage";
import WebsiteBookmarkMeta from "@/components/bookmark/_components/website/WebsiteBookmarkMeta";
import type {WebsiteBookmark} from "@/components/bookmark/types";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

interface BinWebsiteBookmarkGridProps {
  item: WebsiteBookmark;
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
  onRestore?: (item: WebsiteBookmark) => void;
  onDeleteForever?: (item: WebsiteBookmark) => void;
}

export default function BinWebsiteBookmarkGrid({
  item,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
  onRestore,
  onDeleteForever,
}: BinWebsiteBookmarkGridProps) {
  const {borderRadius, contentToggles, gridGap, showTitle} = useViewOptionsStore();
  const [previewOpenSignal, setPreviewOpenSignal] = useState(0);
  const zeroGap = gridGap === "none";

  const onlyTitle =
    showTitle &&
    !contentToggles.source &&
    !contentToggles.savedDate &&
    !(contentToggles.description && item.description) &&
    !(contentToggles.tags && item.tags && item.tags.length > 0);
  const hasVisibleMetadata =
    showTitle ||
    contentToggles.source ||
    contentToggles.savedDate ||
    (contentToggles.description &&
      (item.description || item.metadata?.textMetadataStatus === "pending")) ||
    (contentToggles.tags && Boolean(item.tags?.length));

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
      draggable={false}
      className={cn(
        "group bg-background relative flex h-full w-full cursor-pointer flex-col overflow-hidden text-left",
        zeroGap ? "border-r border-b" : "border",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        isSelected && "bg-muted",
        item.metadata?.textMetadataStatus === "failed" && "opacity-70",
        radiusClass,
        "transition-none!",
      )}>
      <div className="bg-muted relative aspect-16/10 w-full shrink-0">
        <BinWebsiteGridActions
          className={selectionModeHoverActionsClass}
          onExpand={() => {
            setPreviewOpenSignal((current) => current + 1);
          }}
          onRestore={() => onRestore?.(item)}
          onDeleteForever={() => onDeleteForever?.(item)}
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

      {hasVisibleMetadata ? (
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
            textMetadataStatus={item.metadata?.textMetadataStatus}
            tags={item.tags}
            showTitle={showTitle}
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
      ) : null}
    </Link>
  );
}

function BinWebsiteGridActions({
  className,
  onExpand,
  onRestore,
  onDeleteForever,
}: {
  className?: string;
  onExpand: (event: MouseEvent<HTMLButtonElement>) => void;
  onRestore?: () => void;
  onDeleteForever?: () => void;
}) {
  const stopNav = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleExpand = (event: MouseEvent<HTMLButtonElement>) => {
    stopNav(event);
    onExpand(event);
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
        "pointer-events-none absolute top-2 right-2 z-10 flex items-center overflow-hidden rounded-md border border-white/10 bg-black/40 opacity-100 shadow-xl backdrop-blur-md",

        className,
      )}>
      <button
        type="button"
        aria-label="Restore"
        className={getGlassActionButtonClassName(true)}
        onClick={handleRestore}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3.33343 2C3.70162 2 4.00009 2.29848 4.00009 2.66667V3.61551C4.33177 3.30845 4.67983 3.03617 5.05348 2.80683C5.90876 2.28185 6.8682 2 8.019 2C11.3327 2 14.019 4.68629 14.019 8C14.019 11.3137 11.3327 14 8.019 14C5.40549 14 3.18391 12.3294 2.36055 9.99993C2.23785 9.6528 2.41981 9.27193 2.76695 9.1492C3.11409 9.02653 3.49497 9.20847 3.61767 9.5556C4.25863 11.3691 5.98811 12.6667 8.019 12.6667C10.5963 12.6667 12.6857 10.5773 12.6857 8C12.6857 5.42267 10.5963 3.33333 8.019 3.33333C7.10573 3.33333 6.38911 3.55148 5.75095 3.94317C5.43484 4.13721 5.13115 4.37798 4.82848 4.66667H6.0001C6.36828 4.66667 6.66674 4.96515 6.66674 5.33333C6.66674 5.70152 6.36828 6 6.0001 6H3.33343C2.96523 6 2.66676 5.70152 2.66676 5.33333V2.66667C2.66676 2.29848 2.96523 2 3.33343 2Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Delete forever"
        className={getGlassActionButtonClassName(false)}
        onClick={handleDeleteForever}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.24601 3.33334H2.16699C1.89085 3.33334 1.66699 3.5572 1.66699 3.83334C1.66699 4.10948 1.89085 4.33334 2.16699 4.33334H2.66697C2.66699 4.34494 2.6674 4.35662 2.66822 4.36836L3.2281 12.3418C3.32005 13.6513 4.4092 14.6667 5.72196 14.6667H10.2787C11.5915 14.6667 12.6806 13.6513 12.7725 12.3418L13.3325 4.36836C13.3333 4.35662 13.3337 4.34494 13.3337 4.33334H13.8337C14.1098 4.33334 14.3337 4.10948 14.3337 3.83334C14.3337 3.5572 14.1098 3.33334 13.8337 3.33334H10.7547C10.4547 2.09005 9.33573 1.16667 8.00039 1.16667C6.66504 1.16667 5.54599 2.09005 5.24601 3.33334ZM6.29188 3.33334H9.70886C9.44219 2.65056 8.77752 2.16667 8.00039 2.16667C7.22319 2.16667 6.55853 2.65056 6.29188 3.33334ZM6.66699 6.50001C6.94313 6.50001 7.16699 6.72387 7.16699 7.00001V10.8333C7.16699 11.1095 6.94313 11.3333 6.66699 11.3333C6.39085 11.3333 6.16699 11.1095 6.16699 10.8333V7.00001C6.16699 6.72387 6.39085 6.50001 6.66699 6.50001ZM9.33366 6.50001C9.60979 6.50001 9.83366 6.72387 9.83366 7.00001V10.8333C9.83366 11.1095 9.60979 11.3333 9.33366 11.3333C9.05753 11.3333 8.83366 11.1095 8.83366 10.8333V7.00001C8.83366 6.72387 9.05753 6.50001 9.33366 6.50001Z"
            fill="currentColor"
          />
        </svg>
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
