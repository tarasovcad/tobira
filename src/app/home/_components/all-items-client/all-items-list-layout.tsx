"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import {
  GridCard,
  ItemList,
  MediaCard,
  MinimalItemRow,
  TableItemRow,
} from "@/components/bookmark/Bookmark";
import type {Bookmark} from "@/components/bookmark/types";
import {GridSkeleton, ListSkeleton, MediaSkeleton} from "../ListSkeletons";
import {
  NewBookmarkGridCard,
  NewBookmarkList,
  NewBookmarkMediaCard,
} from "../NewBookmarkPlaceholder";
import type {AllItemsView} from "./all-items-list-view-options";
import type {BookmarkWidth} from "@/store/use-view-options";

export type AllItemsAnimatedVariant = "list" | "grid";

export interface AllItemsBookmarkComponentProps {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  className?: string;
  selectionMode?: boolean;
  selectionIndex?: number;
  selectedIds?: Set<string>;
  setSelected?: (id: string, checked: boolean) => void;
}

export interface AllItemsNewBookmarkPlaceholderProps {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
}

export interface AllItemsListLayoutConfig {
  containerClassName: string;
  fetchSpinnerClassName: string;
  sentinelClassName: string;
  animatedVariant: AllItemsAnimatedVariant;
  isTable: boolean;
  BookmarkItem: React.ComponentType<AllItemsBookmarkComponentProps>;
  NewBookmarkPlaceholder: React.ComponentType<AllItemsNewBookmarkPlaceholderProps>;
  renderSkeletonItem: (index: number) => React.ReactNode;
}

interface GetAllItemsListLayoutConfigArgs {
  view: AllItemsView;
  borderRadiusClass: string;
  gapClass: string;
  gridColsClass: string;
  isMediaGrid: boolean;
  bookmarkWidth: BookmarkWidth;
}

export function getAllItemsListLayoutConfig({
  view,
  borderRadiusClass,
  gapClass,
  gridColsClass,
  isMediaGrid,
  bookmarkWidth,
}: GetAllItemsListLayoutConfigArgs): AllItemsListLayoutConfig {
  const widthClass =
    bookmarkWidth === "xs"
      ? "max-w-xl mx-auto"
      : bookmarkWidth === "sm"
        ? "max-w-2xl mx-auto"
        : bookmarkWidth === "md"
          ? "max-w-4xl mx-auto"
          : bookmarkWidth === "lg"
            ? "max-w-6xl mx-auto"
            : "max-w-full mx-auto";

  switch (view) {
    case "grid":
      return {
        containerClassName: cn("grid", gridColsClass, gapClass, "px-6 pb-8"),
        fetchSpinnerClassName: "text-muted-foreground col-span-full py-6 text-center text-xs",
        sentinelClassName: "col-span-full h-px",
        animatedVariant: "grid",
        isTable: false,
        BookmarkItem: isMediaGrid ? MediaCard : GridCard,
        NewBookmarkPlaceholder: isMediaGrid ? NewBookmarkMediaCard : NewBookmarkGridCard,
        renderSkeletonItem: (index) =>
          isMediaGrid ? (
            <MediaSkeleton key={index} index={index} borderRadiusClass={borderRadiusClass} />
          ) : (
            <GridSkeleton key={index} borderRadiusClass={borderRadiusClass} />
          ),
      };
    case "table":
      return {
        containerClassName: cn("px-6 pb-8", widthClass),
        fetchSpinnerClassName: "text-muted-foreground px-6 py-6 text-center text-xs",
        sentinelClassName: "h-px",
        animatedVariant: "list",
        isTable: true,
        BookmarkItem: TableItemRow,
        NewBookmarkPlaceholder: NewBookmarkList,
        renderSkeletonItem: (index) => <ListSkeleton key={index} />,
      };
    case "compact":
      return {
        containerClassName: widthClass,
        fetchSpinnerClassName: "text-muted-foreground px-6 py-6 text-center text-xs",
        sentinelClassName: "h-px",
        animatedVariant: "list",
        isTable: false,
        BookmarkItem: MinimalItemRow,
        NewBookmarkPlaceholder: NewBookmarkList,
        renderSkeletonItem: (index) => <ListSkeleton key={index} />,
      };
    case "list":
      return {
        containerClassName: cn("", widthClass),
        fetchSpinnerClassName: "text-muted-foreground px-6 py-6 text-center text-xs",
        sentinelClassName: "h-px",
        animatedVariant: "list",
        isTable: false,
        BookmarkItem: ItemList,
        NewBookmarkPlaceholder: NewBookmarkList,
        renderSkeletonItem: (index) => <ListSkeleton key={index} />,
      };
  }
}
