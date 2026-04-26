"use client";

import Link from "next/link";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {WebsiteBookmark} from "@/components/bookmark/types";
import WebsiteBookmarkHoverActions from "./WebsiteBookmarkHoverActions";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import WebsiteBookmarkMeta from "./WebsiteBookmarkMeta";
import BookmarkFavicon from "@/features/media/components/bookmark/BookmarkFavicon";

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

interface WebsiteBookmarkListProps {
  item: WebsiteBookmark;
  onOpenMenu?: (item: WebsiteBookmark) => void;
  className?: string;
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
}

export default function BookmarkWebsiteList({
  item,
  onOpenMenu,
  className,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: WebsiteBookmarkListProps) {
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
          <BookmarkFavicon url={item?.images?.favicon?.key ?? ""} bookmarkUrl={item.url} />
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
