"use client";

import * as React from "react";
import type {Bookmark} from "@/components/bookmark/types";
import type {AllItemsNewBookmarkPlaceholderProps} from "./all-items-list-layout";
import {flattenMediaGridBookmarks} from "@/features/media/components/bookmark/media-grid-render";
import type {MediaMediaItem} from "@/components/bookmark/types/metadata";

interface AllItemsAnimatingPlaceholdersProps {
  animatingUrl: string | null;
  animatingItemCount: number;
  animatingTags?: string[];
  pendingMediaItems?: MediaMediaItem[];
  resolvedBookmarks: Bookmark[];
  flattenMediaBookmarks?: boolean;
  onTransitionDone: () => void;
  PlaceholderComponent: React.ComponentType<AllItemsNewBookmarkPlaceholderProps>;
}

export function AllItemsAnimatingPlaceholders({
  animatingUrl,
  animatingItemCount,
  animatingTags,
  pendingMediaItems = [],
  resolvedBookmarks,
  flattenMediaBookmarks = false,
  onTransitionDone,
  PlaceholderComponent,
}: AllItemsAnimatingPlaceholdersProps) {
  if (!animatingUrl) {
    return null;
  }

  const resolvedEntries = flattenMediaBookmarks ? flattenMediaGridBookmarks(resolvedBookmarks) : [];
  const placeholderCount = flattenMediaBookmarks
    ? Math.max(animatingItemCount ?? 1, resolvedEntries.length, pendingMediaItems.length)
    : (animatingItemCount ?? 1);

  return Array.from({length: placeholderCount}, (_, index) => (
    <div key={`animating-${animatingUrl}-${index}`}>
      <PlaceholderComponent
        url={animatingUrl}
        bookmark={
          flattenMediaBookmarks
            ? (resolvedEntries.at(index)?.item ?? null)
            : (resolvedBookmarks.at(index) ?? null)
        }
        mediaIndex={flattenMediaBookmarks ? resolvedEntries.at(index)?.mediaIndex : undefined}
        pendingMediaItem={flattenMediaBookmarks ? pendingMediaItems.at(index) : undefined}
        onDone={index === 0 ? onTransitionDone : () => {}}
        tags={animatingTags}
      />
    </div>
  ));
}
