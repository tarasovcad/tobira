"use client";

import Link from "next/link";
import type {MouseEvent} from "react";

import type {WebsiteBookmark} from "@/components/bookmark/types";
import BookmarkFavicon from "@/components/bookmark/_components/website/BookmarkFavicon";
import WebsiteBookmarkMeta from "@/components/bookmark/_components/website/WebsiteBookmarkMeta";
import BookmarkSelectionCheckbox from "@/components/bookmark/_components/shared/BookmarkSelectionCheckbox";
import {Tag} from "@/components/ui/app/tag";
import {Button} from "@/components/ui/coss/button";
import {Badge} from "@/components/ui/coss/badge";
import {formatDateAbsolute, normalizeUtcTimestamp} from "@/lib/utils/dates";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";

const BIN_RETENTION_DAYS = 40;

interface BinWebsiteBookmarkListProps {
  item: WebsiteBookmark;
  className?: string;
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
  onRestore?: (item: WebsiteBookmark) => void;
  onDeleteForever?: (item: WebsiteBookmark) => void;
}

export default function BinWebsiteBookmarkList({
  item,
  className,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
  onRestore,
  onDeleteForever,
}: BinWebsiteBookmarkListProps) {
  const contentToggles = useViewOptionsStore((state) => state.contentToggles);
  const deletionInfo = getDeletionInfo(item.deleted_at);
  const visibleTags = contentToggles.tags ? item.tags?.slice(0, 3) : [];
  const showFooter = contentToggles.savedDate || (visibleTags && visibleTags.length > 0);

  return (
    <Link
      href={item.url}
      target="_blank"
      className={cn(
        "group relative flex w-full cursor-pointer flex-col gap-2 border-b px-6 py-5 text-left",
        "pr-44",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        isSelected && "bg-muted",
        item.metadata?.textMetadataStatus === "failed" && "opacity-70",
        className,
        "transition-none!",
      )}>
      <BinWebsiteHoverActions item={item} onRestore={onRestore} onDeleteForever={onDeleteForever} />

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
          <BookmarkFavicon
            url={item?.images?.favicon?.key ?? ""}
            bookmarkUrl={item.url}
            variant="list"
            status={item?.images?.favicon?.status}
          />
        </div>

        <div className="min-w-0 flex-1 text-[13px]">
          <WebsiteBookmarkMeta
            title={item.title}
            url={item.url}
            createdAt={item.created_at}
            description={item.description}
            textMetadataStatus={item.metadata?.textMetadataStatus}
            showSource={contentToggles.source}
            showDescription={contentToggles.description}
            showTags={false}
            titleClassName="text-foreground truncate text-[15px] font-[550]"
            sourceRowClassName="text-muted-foreground mt-0.5 min-w-0 whitespace-nowrap"
            descriptionClassName="text-muted-foreground line-clamp-1"
          />

          {showFooter ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {contentToggles.savedDate ? (
                <Badge
                  size="md"
                  variant={deletionInfo.isExpired ? "error" : "outline"}
                  className={cn(
                    "text-[12px] font-normal",
                    !deletionInfo.isExpired && "text-muted-foreground",
                  )}
                  title={deletionInfo.deletedTitle}>
                  {deletionInfo.label}
                </Badge>
              ) : null}
              {visibleTags?.map((tag) => (
                <Tag key={tag} className="text-muted-foreground text-[12px]">
                  {tag}
                </Tag>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
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

function BinWebsiteHoverActions({
  item,
  onRestore,
  onDeleteForever,
}: {
  item: WebsiteBookmark;
  onRestore?: (item: WebsiteBookmark) => void;
  onDeleteForever?: (item: WebsiteBookmark) => void;
}) {
  const stopNavigation = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleRestore = (event: MouseEvent<HTMLButtonElement>) => {
    stopNavigation(event);
    onRestore?.(item);
  };

  const handleDeleteForever = (event: MouseEvent<HTMLButtonElement>) => {
    stopNavigation(event);
    onDeleteForever?.(item);
  };

  return (
    <div
      className={cn(
        "pointer-events-auto absolute top-4 right-4 z-10 flex items-center gap-1.5 opacity-100",
        "group-data-[selection-mode=true]/bookmark-row:pointer-events-none! group-data-[selection-mode=true]/bookmark-row:opacity-0!",
      )}>
      <Button type="button" size="sm" variant="outline" onClick={handleRestore}>
        Restore
      </Button>
      <Button type="button" size="sm" variant="destructive-outline" onClick={handleDeleteForever}>
        Delete forever
      </Button>
    </div>
  );
}
