"use client";

import type {MouseEvent} from "react";

import PostBookmarkList from "@/components/bookmark/_components/post/PostBookmarkList";
import type {PostBookmark} from "@/components/bookmark/types";
import {Button} from "@/components/ui/coss/button";

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

  return (
    <div className="pointer-events-auto absolute top-2.5 right-3 z-[4] flex items-center gap-1.5 opacity-100">
      <Button type="button" size="sm" variant="outline" onClick={handleRestore}>
        Restore
      </Button>
      <Button type="button" size="sm" variant="destructive-outline" onClick={handleDeleteForever}>
        Delete forever
      </Button>
    </div>
  );
}
