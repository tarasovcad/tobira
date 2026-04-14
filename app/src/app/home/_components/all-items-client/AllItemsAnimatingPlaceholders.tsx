"use client";

import * as React from "react";
import type {Bookmark} from "@/components/bookmark/types";
import type {AllItemsNewBookmarkPlaceholderProps} from "./all-items-list-layout";

interface AllItemsAnimatingPlaceholdersProps {
  animatingUrl: string | null;
  animatingItemCount: number;
  animatingTags?: string[];
  resolvedBookmarks: Bookmark[];
  onTransitionDone: () => void;
  PlaceholderComponent: React.ComponentType<AllItemsNewBookmarkPlaceholderProps>;
}

export function AllItemsAnimatingPlaceholders({
  animatingUrl,
  animatingItemCount,
  animatingTags,
  resolvedBookmarks,
  onTransitionDone,
  PlaceholderComponent,
}: AllItemsAnimatingPlaceholdersProps) {
  if (!animatingUrl) {
    return null;
  }

  return Array.from({length: animatingItemCount ?? 1}, (_, index) => (
    <div key={`animating-${animatingUrl}-${index}`}>
      <PlaceholderComponent
        url={animatingUrl}
        bookmark={resolvedBookmarks.at(index) ?? null}
        onDone={index === 0 ? onTransitionDone : () => {}}
        tags={animatingTags}
      />
    </div>
  ));
}
