"use client";

import * as React from "react";
import Link from "next/link";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import {BookmarkImage} from "@/features/media/components/bookmark/BookmarkImage";
import {BookmarkItemProps} from "@/components/bookmark/types";
import WebsiteBookmarkHoverActions from "./WebsiteBookmarkHoverActions";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import WebsiteBookmarkMeta from "./WebsiteBookmarkMeta";

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
        <BookmarkImage
          bookmark_id={item.id}
          item={item}
          type="preview"
          fill={true}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          quality={50}
          loading="lazy"
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
