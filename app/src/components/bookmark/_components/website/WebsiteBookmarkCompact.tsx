"use client";

import * as React from "react";
import Link from "next/link";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import BookmarkFavicon from "@/features/media/components/bookmark/BookmarkFavicon";
import {BookmarkItemProps} from "../../types";
import WebsiteBookmarkHoverActions from "./WebsiteBookmarkHoverActions";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import WebsiteBookmarkMeta from "./WebsiteBookmarkMeta";

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

export default function WebsiteBookmarkCompact({
  item,
  onOpenMenu,
  className,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
  const {contentToggles} = useViewOptionsStore();

  return (
    <Link
      href={item.url}
      target="_blank"
      className={cn(
        "group relative flex w-full cursor-pointer items-center gap-3 border-b px-5 py-2.5 pr-12 text-left",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        isSelected && "bg-muted",
        className,
        "transition-none!",
      )}>
      <WebsiteBookmarkHoverActions
        className={cn("top-1.5 right-2", selectionModeHoverActionsClass)}
        onOptions={() => onOpenMenu?.(item)}
      />

      <div className="flex shrink-0 items-center">
        <BookmarkSelectionCheckbox
          itemId={item.id}
          title={item.title}
          checked={isSelected}
          selectionIndex={selectionIndex}
          onCheckedChange={setSelected}
          paddingClassName="pr-2"
        />
        <BookmarkFavicon
          item={item}
          letterClassName="size-[18px]"
          imageContainerClassName="size-[18px] rounded-none border-none bg-transparent"
          imageClassName="h-[18px] w-[18px] object-contain"
          skeletonClassName="bg-transparent"
          height={18}
          width={18}
          iconSize={16}
        />
      </div>

      <WebsiteBookmarkMeta
        title={item.title}
        url={item.url}
        createdAt={item.created_at}
        titleClassName="text-foreground min-w-0 flex-1 truncate text-[13.5px]"
      />

      <div className="flex shrink-0 items-center gap-2">
        {contentToggles.source || contentToggles.savedDate ? (
          <WebsiteBookmarkMeta
            title=""
            url={item.url}
            createdAt={item.created_at}
            showSource={contentToggles.source}
            showSavedDate={contentToggles.savedDate}
            sourceMode="domain"
            sourceDateSeparator="/"
            sourceRowClassName="text-muted-foreground hidden items-center gap-1 text-[12px] sm:block"
          />
        ) : null}
        <WebsiteBookmarkMeta
          title=""
          url={item.url}
          createdAt={item.created_at}
          tags={item.tags}
          showTags={contentToggles.tags}
          maxTags={2}
          tagsWrapperClassName="flex items-center gap-1"
          tagClassName="text-muted-foreground text-[12px]"
        />
      </div>
    </Link>
  );
}
