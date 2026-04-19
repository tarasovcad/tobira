"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import {GridCard} from "@/components/bookmark/_components/BookmarkGridCard";
import {ItemList} from "@/components/bookmark/_components/BookmarkListRow";
import {MediaCard} from "@/features/media/components/bookmark/BookmarkMediaCard";
import {MinimalItemRow} from "@/components/bookmark/_components/BookmarkCompactRow";
import {TableItemRow} from "@/components/bookmark/_components/BookmarkTableRow";
import {BookmarkPostCard} from "@/features/media/components/bookmark/BookmarkPostCard";
import type {Bookmark} from "@/components/bookmark/types";
import {GridSkeleton, ListSkeleton, MediaSkeleton, PostSkeleton} from "../ListSkeletons";
import {
  NewBookmarkGridCard,
  NewBookmarkList,
  NewBookmarkMediaCard,
  NewBookmarkCompact,
  NewBookmarkPost,
} from "../NewBookmarkPlaceholder";
import type {AllItemsView} from "./all-items-list-view-options";
import type {BookmarkWidth} from "@/store/use-view-options";
import type {TypeFilter} from "../../_types";
import type {MediaMediaItem} from "../../_types/bookmark-metadata";

export type AllItemsAnimatedVariant = "list" | "grid";

export interface AllItemsBookmarkComponentProps {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  onSave?: (item: Bookmark) => void;
  onDismiss?: (item: Bookmark) => void;
  className?: string;
  mediaIndex?: number;
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
}

export interface AllItemsNewBookmarkPlaceholderProps {
  url: string;
  bookmark: Bookmark | null;
  mediaIndex?: number;
  pendingMediaItem?: MediaMediaItem;
  onDone: () => void;
  tags?: string[];
}

export interface AllItemsListLayoutConfig {
  wrapperClassName: string;
  containerClassName: string;
  fetchSpinnerClassName: string;
  sentinelClassName: string;
  animatedVariant: AllItemsAnimatedVariant;
  isTable: boolean;
  isMasonry: boolean;
  BookmarkItem: React.ComponentType<AllItemsBookmarkComponentProps>;
  NewBookmarkPlaceholder: React.ComponentType<AllItemsNewBookmarkPlaceholderProps>;
  renderSkeletonItem: (index: number) => React.ReactNode;
}

interface GetAllItemsListLayoutConfigArgs {
  view: AllItemsView;
  borderRadiusClass: string;
  gapClass: string;
  gridColsClass: string;
  masonryColsClass: string;
  isMediaGrid: boolean;
  bookmarkWidth: BookmarkWidth;
  typeFilter: TypeFilter;
}

function getMasonryChildSpacingClass(gapClass: string) {
  switch (gapClass) {
    case "gap-0":
      return "[&>*]:mb-0";
    case "gap-2":
      return "[&>*]:mb-2";
    case "gap-4":
      return "[&>*]:mb-4";
    case "gap-6":
      return "[&>*]:mb-6";
    case "gap-8":
      return "[&>*]:mb-8";
    default:
      return "[&>*]:mb-4";
  }
}

export function getAllItemsListLayoutConfig({
  view,
  borderRadiusClass,
  gapClass,
  gridColsClass,
  masonryColsClass,
  isMediaGrid,
  bookmarkWidth,
  typeFilter,
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
        wrapperClassName: "px-6 pb-8",
        containerClassName: isMediaGrid
          ? cn(
              masonryColsClass,
              gapClass,
              "[&>*]:break-inside-avoid",
              getMasonryChildSpacingClass(gapClass),
            )
          : cn(
              "grid",
              gridColsClass,
              gapClass,
              gapClass === "gap-0" && "border-t border-l border-border",
            ),
        fetchSpinnerClassName: "text-muted-foreground col-span-full py-6 text-center text-xs",
        sentinelClassName: isMediaGrid ? "h-px" : "col-span-full h-px",
        animatedVariant: "grid",
        isTable: false,
        isMasonry: isMediaGrid,
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
        wrapperClassName: cn("px-6 pb-8", widthClass),
        containerClassName: "",
        fetchSpinnerClassName: "text-muted-foreground px-6 py-6 text-center text-xs",
        sentinelClassName: "h-px",
        animatedVariant: "list",
        isTable: true,
        isMasonry: false,
        BookmarkItem: TableItemRow,
        NewBookmarkPlaceholder: NewBookmarkList,
        renderSkeletonItem: (index) => <ListSkeleton key={index} />,
      };
    case "compact":
      return {
        wrapperClassName: widthClass,
        containerClassName: "",
        fetchSpinnerClassName: "text-muted-foreground px-6 py-6 text-center text-xs",
        sentinelClassName: "h-px",
        animatedVariant: "list",
        isTable: false,
        isMasonry: false,
        BookmarkItem: MinimalItemRow,
        NewBookmarkPlaceholder: NewBookmarkCompact,
        renderSkeletonItem: (index) => <ListSkeleton key={index} />,
      };
    case "list":
      if (typeFilter === "post") {
        return {
          wrapperClassName: cn(widthClass),
          containerClassName: "",
          fetchSpinnerClassName: "text-muted-foreground px-6 py-6 text-center text-xs",
          sentinelClassName: "h-px",
          animatedVariant: "list",
          isTable: false,
          isMasonry: false,
          BookmarkItem: BookmarkPostCard,
          NewBookmarkPlaceholder: NewBookmarkPost,
          renderSkeletonItem: (index) => <PostSkeleton key={index} />,
        };
      }
      return {
        wrapperClassName: cn("", widthClass),
        containerClassName: "",
        fetchSpinnerClassName: "text-muted-foreground px-6 py-6 text-center text-xs",
        sentinelClassName: "h-px",
        animatedVariant: "list",
        isTable: false,
        isMasonry: false,
        BookmarkItem: ItemList,
        NewBookmarkPlaceholder: NewBookmarkList,
        renderSkeletonItem: (index) => <ListSkeleton key={index} />,
      };
  }
}
