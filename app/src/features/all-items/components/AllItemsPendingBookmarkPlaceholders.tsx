"use client";

import {useEffect, type ReactNode} from "react";
import type {Bookmark} from "@/components/bookmark/types";
import {flattenMediaGridBookmarks} from "@/components/bookmark/_utils/media-grid-render";
import type {BookmarkMediaItem} from "@/components/bookmark/types/metadata";

interface AllItemsPendingBookmarkPlaceholdersProps {
  animatingUrl: string | null;
  animatingItemCount: number;
  pendingMediaItems?: BookmarkMediaItem[];
  resolvedBookmarks: Bookmark[];
  flattenMediaBookmarks?: boolean;
  onTransitionDone: () => void;
  renderSkeletonItem: (index: number) => ReactNode;
}

export function AllItemsPendingBookmarkPlaceholders({
  animatingUrl,
  animatingItemCount,
  pendingMediaItems = [],
  resolvedBookmarks,
  flattenMediaBookmarks = false,
  onTransitionDone,
  renderSkeletonItem,
}: AllItemsPendingBookmarkPlaceholdersProps) {
  const resolvedEntries = flattenMediaBookmarks ? flattenMediaGridBookmarks(resolvedBookmarks) : [];
  const hasResolvedBookmark = flattenMediaBookmarks
    ? resolvedEntries.length > 0
    : resolvedBookmarks.length > 0;

  useEffect(() => {
    if (!animatingUrl || !hasResolvedBookmark) {
      return;
    }

    const timeout = window.setTimeout(onTransitionDone, 0);
    return () => window.clearTimeout(timeout);
  }, [animatingUrl, hasResolvedBookmark, onTransitionDone]);

  if (!animatingUrl) {
    return null;
  }

  const placeholderCount = flattenMediaBookmarks
    ? Math.max(animatingItemCount, resolvedEntries.length, pendingMediaItems.length, 1)
    : Math.max(animatingItemCount, 1);

  return Array.from({length: placeholderCount}, (_, index) => (
    <div key={`animating-${animatingUrl}-${index}`}>{renderSkeletonItem(index)}</div>
  ));
}
