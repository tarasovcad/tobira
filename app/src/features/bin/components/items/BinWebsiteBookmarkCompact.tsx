"use client";

import Link from "next/link";
import type {MouseEvent} from "react";

import BookmarkFavicon from "@/components/bookmark/_components/website/BookmarkFavicon";
import WebsiteBookmarkMeta from "@/components/bookmark/_components/website/WebsiteBookmarkMeta";
import BookmarkSelectionCheckbox from "@/components/bookmark/_components/shared/BookmarkSelectionCheckbox";
import type {WebsiteBookmark} from "@/components/bookmark/types";
import {Tag} from "@/components/ui/app/tag";
import {Badge} from "@/components/ui/coss/badge";
import {Button} from "@/components/ui/coss/button";
import {cn} from "@/lib/utils";
import {formatDateAbsolute, normalizeUtcTimestamp} from "@/lib/utils/dates";
import {useViewOptionsStore} from "@/store/use-view-options";

const BIN_RETENTION_DAYS = 40;

interface BinWebsiteBookmarkCompactProps {
  item: WebsiteBookmark;
  className?: string;
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
  onRestore?: (item: WebsiteBookmark) => void;
  onDeleteForever?: (item: WebsiteBookmark) => void;
}

export default function BinWebsiteBookmarkCompact({
  item,
  className,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
  onRestore,
  onDeleteForever,
}: BinWebsiteBookmarkCompactProps) {
  const contentToggles = useViewOptionsStore((state) => state.contentToggles);
  const deletionInfo = getDeletionInfo(item.deleted_at);
  const visibleTags = contentToggles.tags ? item.tags?.slice(0, 2) : [];

  return (
    <Link
      href={item.url}
      target="_blank"
      className={cn(
        "group relative flex w-full cursor-pointer items-center gap-3 border-b px-5 py-2.5 pr-48 text-left",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        isSelected && "bg-muted",
        item.metadata?.textMetadataStatus === "failed" && "opacity-70",
        className,
        "transition-none!",
      )}>
      <BinWebsiteCompactActions
        item={item}
        onRestore={onRestore}
        onDeleteForever={onDeleteForever}
      />

      <div className="flex shrink-0 items-center self-stretch">
        <BookmarkSelectionCheckbox
          itemId={item.id}
          title={item.title}
          checked={isSelected}
          selectionIndex={selectionIndex}
          onCheckedChange={setSelected}
          paddingClassName="pr-2"
        />
        <BookmarkFavicon
          url={item?.images?.favicon?.key ?? ""}
          bookmarkUrl={item.url}
          variant="compact"
          status={item?.images?.favicon?.status}
        />
      </div>

      <WebsiteBookmarkMeta
        title={item.title}
        url={item.url}
        createdAt={item.created_at}
        textMetadataStatus={item.metadata?.textMetadataStatus}
        titleClassName="text-foreground min-w-0 flex-1 truncate text-[13.5px]"
      />

      <div className="flex shrink-0 items-center gap-2">
        {contentToggles.source ? (
          <WebsiteBookmarkMeta
            title=""
            url={item.url}
            createdAt={item.created_at}
            showSource
            sourceMode="domain"
            sourceRowClassName="text-muted-foreground hidden items-center gap-1 text-[12px] sm:block"
          />
        ) : null}
        {contentToggles.savedDate ? (
          <Badge
            size="md"
            variant={deletionInfo.isExpired ? "error" : "outline"}
            className={cn(
              "hidden text-[12px] font-normal sm:inline-flex",
              !deletionInfo.isExpired && "text-muted-foreground",
            )}
            title={deletionInfo.deletedTitle}>
            {deletionInfo.label}
          </Badge>
        ) : null}
        {visibleTags?.map((tag) => (
          <Tag key={tag} className="text-muted-foreground hidden text-[12px] sm:inline-flex">
            {tag}
          </Tag>
        ))}
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

function BinWebsiteCompactActions({
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
    <div className="pointer-events-auto absolute inset-y-0 right-2 z-10 flex items-center gap-1.5">
      <Button type="button" size="xs" variant="outline" onClick={handleRestore}>
        Restore
      </Button>
      <Button type="button" size="xs" variant="destructive-outline" onClick={handleDeleteForever}>
        Delete forever
      </Button>
    </div>
  );
}
