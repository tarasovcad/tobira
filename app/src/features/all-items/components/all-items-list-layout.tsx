"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import type {Bookmark} from "@/components/bookmark/types";

import type {AllItemsView} from "./all-items-list-view-options";
import type {BookmarkWidth} from "@/store/use-view-options";
import type {TypeFilter} from "@/features/home/types";
import type {MediaMediaItem} from "@/components/bookmark/types/metadata";
import MediaBookmarkGrid from "@/components/bookmark/_components/media/MediaBookmarkGrid";
import MediaBookmarkPlaceholderGrid from "@/components/bookmark/_components/media/MediaBookmarkPlaceholderGrid";
import WebsiteBookmarkPlaceholderGrid from "@/components/bookmark/_components/website/WebsiteBookmarkPlaceholderGrid";
import WebsiteBookmarkGrid from "@/components/bookmark/_components/website/WebsiteBookmarkGrid";
import {
  MediaSkeletonGrid,
  PostSkeletonList,
  WebsiteSkeletonCompact,
  WebsiteSkeletonGrid,
  WebsiteSkeletonList,
  WebsiteSkeletonTable,
} from "@/components/bookmark/_components/shared/BookmarkSkeletons";
import WebsiteBookmarkTable from "@/components/bookmark/_components/website/WebsiteBookmarkTable";
import WebsiteBookmarkPlaceholderTable from "@/components/bookmark/_components/website/WebsiteBookmarkPlaceholderTable";
import WebsiteBookmarkCompact from "@/components/bookmark/_components/website/WebsiteBookmarkCompact";
import WebsiteBookmarkPlaceholderCompact from "@/components/bookmark/_components/website/WebsiteBookmarkPlaceholderCompact";
import WebsiteBookmarkList from "@/components/bookmark/_components/website/WebsiteBookmarkList";
import WebsiteBookmarkPlaceholderList from "@/components/bookmark/_components/website/WebsiteBookmarkPlaceholderList ";
import PostBookmarkList from "@/components/bookmark/_components/post/PostBookmarkList";
import PostBookmarkPlaceholderList from "@/components/bookmark/_components/post/PostBookmarkPlaceholderList ";

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

function getWidthClass(bookmarkWidth: BookmarkWidth) {
  switch (bookmarkWidth) {
    case "xs":
      return "max-w-xl mx-auto";
    case "sm":
      return "max-w-2xl mx-auto";
    case "md":
      return "max-w-4xl mx-auto";
    case "lg":
      return "max-w-6xl mx-auto";
    default:
      return "max-w-full mx-auto";
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
  const widthClass = getWidthClass(bookmarkWidth);

  switch (view) {
    case "grid":
      if (isMediaGrid) {
        return {
          wrapperClassName: "px-6 pb-8",
          containerClassName: cn(
            masonryColsClass,
            gapClass,
            "[&>*]:break-inside-avoid",
            getMasonryChildSpacingClass(gapClass),
          ),
          fetchSpinnerClassName: "text-muted-foreground col-span-full py-6 text-center text-xs",
          sentinelClassName: "h-px",
          animatedVariant: "grid",
          isTable: false,
          isMasonry: true,
          BookmarkItem: MediaBookmarkGrid,
          NewBookmarkPlaceholder: MediaBookmarkPlaceholderGrid,
          renderSkeletonItem: (index) => (
            <MediaSkeletonGrid key={index} index={index} borderRadiusClass={borderRadiusClass} />
          ),
        };
      }
      return {
        wrapperClassName: "px-6 pb-8",
        containerClassName: cn(
          "grid",
          gridColsClass,
          gapClass,
          gapClass === "gap-0" && "border-t border-l border-border",
        ),
        fetchSpinnerClassName: "text-muted-foreground col-span-full py-6 text-center text-xs",
        sentinelClassName: "col-span-full h-px",
        animatedVariant: "grid",
        isTable: false,
        isMasonry: false,
        BookmarkItem: WebsiteBookmarkGrid,
        NewBookmarkPlaceholder: WebsiteBookmarkPlaceholderGrid,
        renderSkeletonItem: (index) => (
          <WebsiteSkeletonGrid key={index} borderRadiusClass={borderRadiusClass} />
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
        BookmarkItem: WebsiteBookmarkTable,
        NewBookmarkPlaceholder: WebsiteBookmarkPlaceholderTable,
        renderSkeletonItem: (index) => <WebsiteSkeletonTable key={index} />,
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
        BookmarkItem: WebsiteBookmarkCompact,
        NewBookmarkPlaceholder: WebsiteBookmarkPlaceholderCompact,
        renderSkeletonItem: (index) => <WebsiteSkeletonCompact key={index} />,
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
          BookmarkItem: PostBookmarkList,
          NewBookmarkPlaceholder: PostBookmarkPlaceholderList,
          renderSkeletonItem: (index) => <PostSkeletonList key={index} />,
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
        BookmarkItem: WebsiteBookmarkList,
        NewBookmarkPlaceholder: WebsiteBookmarkPlaceholderList,
        renderSkeletonItem: (index) => <WebsiteSkeletonList key={index} />,
      };
  }
}
