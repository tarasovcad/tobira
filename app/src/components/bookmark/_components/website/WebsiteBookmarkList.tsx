"use client";

import Link from "next/link";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import {BookmarkAvatar} from "@/features/media/components/bookmark/BookmarkAvatar";
import type {BookmarkItemProps} from "@/components/bookmark/types";
import WebsiteBookmarkHoverActions from "./WebsiteBookmarkHoverActions";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import WebsiteBookmarkMeta from "./WebsiteBookmarkMeta";

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

export default function BookmarkWebsiteList({
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
        "group relative flex w-full cursor-pointer flex-col gap-2 border-b px-6 py-5 pr-16 text-left",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        isSelected && "bg-muted",
        className,
        "transition-none!",
      )}>
      <WebsiteBookmarkHoverActions
        className={cn("top-4 right-4", selectionModeHoverActionsClass)}
        onOptions={() => onOpenMenu?.(item)}
      />

      <div className="flex min-w-0 flex-1 items-center gap-5">
        <div className="flex items-center">
          <BookmarkSelectionCheckbox
            itemId={item.id}
            title={item.title}
            checked={isSelected}
            selectionIndex={selectionIndex}
            onCheckedChange={setSelected}
            paddingClassName="pr-3"
          />
          <BookmarkAvatar
            item={item}
            className="size-9"
            imageClassName="h-5 w-5 object-contain"
            height={20}
            width={20}
            iconSize={36}
          />
        </div>

        <div className="min-w-0 flex-1 text-[13px]">
          <WebsiteBookmarkMeta
            title={item.title}
            url={item.url}
            createdAt={item.created_at}
            description={item.description}
            tags={item.tags}
            showSource={contentToggles.source}
            showSavedDate={contentToggles.savedDate}
            showDescription={contentToggles.description}
            showTags={false}
            titleClassName="text-foreground truncate text-[15px] font-[550]"
            sourceRowClassName="text-muted-foreground mt-0.5 min-w-0 whitespace-nowrap"
            descriptionClassName="text-muted-foreground line-clamp-1"
          />
        </div>
      </div>

      <WebsiteBookmarkMeta
        title=""
        url={item.url}
        createdAt={item.created_at}
        tags={item.tags}
        showTags={contentToggles.tags}
        tagsWrapperClassName="flex flex-wrap gap-1 pl-14"
        tagClassName="text-muted-foreground text-[12px]"
      />
    </Link>
  );
}
