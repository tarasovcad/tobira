"use client";

import type {MouseEvent} from "react";

import PostBookmarkList from "@/components/bookmark/_components/post/PostBookmarkList";
import type {PostBookmark} from "@/components/bookmark/types";
import {Badge} from "@/components/ui/coss/badge";
import {Button} from "@/components/ui/coss/button";
import {cn} from "@/lib/utils";
import {formatDateAbsolute, normalizeUtcTimestamp} from "@/lib/utils/dates";

const BIN_RETENTION_DAYS = 40;

interface BinPostBookmarkListProps {
  item: PostBookmark;
  onOpenDetail?: (item: PostBookmark) => void;
  className?: string;
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
  onRestore?: (item: PostBookmark) => void;
  onDeleteForever?: (item: PostBookmark) => void;
}

export default function BinPostBookmarkList({
  item,
  onOpenDetail,
  className,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
  onRestore,
  onDeleteForever,
}: BinPostBookmarkListProps) {
  return (
    <div className="group relative">
      <PostBookmarkList
        item={item}
        onOpenDetail={onOpenDetail}
        className={className}
        selectionIndex={selectionIndex}
        isSelected={isSelected}
        setSelected={setSelected}
      />
      <BinPostActions item={item} onRestore={onRestore} onDeleteForever={onDeleteForever} />
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

function BinPostActions({
  item,
  onRestore,
  onDeleteForever,
}: {
  item: PostBookmark;
  onRestore?: (item: PostBookmark) => void;
  onDeleteForever?: (item: PostBookmark) => void;
}) {
  const stopInteraction = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleRestore = (event: MouseEvent<HTMLButtonElement>) => {
    stopInteraction(event);
    onRestore?.(item);
  };

  const handleDeleteForever = (event: MouseEvent<HTMLButtonElement>) => {
    stopInteraction(event);
    onDeleteForever?.(item);
  };
  const deletionInfo = getDeletionInfo(item.deleted_at);

  return (
    <div className="pointer-events-auto absolute top-2.5 right-3 z-[4] flex items-center gap-1.5 opacity-100">
      <Badge
        size="md"
        variant={deletionInfo.isExpired ? "error" : "outline"}
        className={cn(
          "bg-background/90 m text-[12px] font-normal",
          !deletionInfo.isExpired && "text-muted-foreground",
        )}>
        {deletionInfo.label}
      </Badge>
      <Button type="button" size="sm" variant="outline" onClick={handleRestore}>
        Restore
      </Button>
      <Button type="button" size="sm" variant="destructive-outline" onClick={handleDeleteForever}>
        Delete forever
      </Button>
    </div>
  );
}
