"use client";
import * as React from "react";
import Link from "next/link";
import {formatDateAbsolute} from "@/lib/formatDate";
import {cn} from "@/lib/utils";
import {Checkbox} from "@/components/coss-ui/checkbox";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {Bookmark} from "./types";
import {BookmarkHoverActions} from "./_components/BookmarkHoverActions";
import {BookmarkImage} from "./_components/BookmarkImage";
import {BookmarkAvatar} from "./_components/BookmarkAvatar";
import {Tag} from "@/components/ui/Tag";
import {useState} from "react";

export const ItemList = ({
  item,
  onOpenMenu,
  onDelete,
  className,
  selectionMode,
  selectionIndex = 0,
  selectedIds,
  setSelected,
}: {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  className?: string;
  selectionMode?: boolean;
  selectionIndex?: number;
  selectedIds?: Set<string>;
  setSelected?: (id: string, checked: boolean) => void;
}) => {
  const {contentToggles} = useViewOptionsStore();

  return (
    <Link
      href={item.url}
      target="_blank"
      className={cn(
        "group relative flex w-full cursor-pointer flex-col gap-2 border-b px-6 py-5 pr-16 text-left",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        selectionMode && selectedIds?.has(item.id) && "bg-muted",
        className,
      )}>
      {!selectionMode && (
        <BookmarkHoverActions
          className="top-4 right-4"
          onOptions={() => {
            onOpenMenu?.(item);
          }}
          onDelete={() => {
            onDelete?.(item);
          }}
        />
      )}

      <div className="flex min-w-0 flex-1 items-center gap-5">
        <div className="flex items-center">
          {/* Animated checkbox slot — always rendered, width animated via grid-cols */}
          <div
            className={cn(
              "grid shrink-0 items-center transition-[grid-template-columns,opacity] duration-200 ease-out",
              selectionMode ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
            )}
            style={{
              transitionDelay: selectionMode ? `${Math.min(selectionIndex * 20, 120)}ms` : "0ms",
            }}>
            <div className="min-w-0 overflow-hidden">
              <div className="pr-3">
                <Checkbox
                  checked={selectedIds?.has(item.id)}
                  onCheckedChange={(next) => setSelected?.(item.id, next === true)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${item.title}`}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>
          <BookmarkAvatar
            item={item}
            className="size-9"
            imageClassName="h-5 w-5 object-contain"
            height={20}
            width={20}
            iconSize={36}
          />
        </div>

        <div className="min-w-0 flex-1 text-[13px]">
          <div className="text-foreground truncate text-[15px] font-semibold">{item.title}</div>
          {(contentToggles.source || contentToggles.savedDate) && (
            <div className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1 whitespace-nowrap">
              {contentToggles.source && <span className="min-w-0 truncate">{item.url}</span>}
              {contentToggles.source && contentToggles.savedDate && (
                <span className="shrink-0">-</span>
              )}
              {contentToggles.savedDate && (
                <span className="shrink-0">{formatDateAbsolute(item.created_at)}</span>
              )}
            </div>
          )}
          {contentToggles.description && item.description ? (
            <div
              className={cn(
                "text-muted-foreground line-clamp-1",
                contentToggles.source || contentToggles.savedDate ? "mt-1.5" : "mt-0.5",
              )}>
              {item.description}
            </div>
          ) : null}
        </div>
      </div>

      {contentToggles.tags && item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-14">
          {item.tags.map((tag) => (
            <Tag key={tag} className="text-muted-foreground text-[12px]">
              {tag}
            </Tag>
          ))}
        </div>
      )}
    </Link>
  );
};

export function getDomainName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function getTableBookmarkColumnsClass(showSource: boolean, showSavedDate: boolean): string {
  if (showSource && showSavedDate) {
    return "md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_auto]";
  }

  if (showSource) {
    return "md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)]";
  }

  if (showSavedDate) {
    return "md:grid-cols-[auto_minmax(0,2fr)_auto]";
  }

  return "md:grid-cols-[auto_minmax(0,1fr)]";
}

export const MinimalItemRow = ({
  item,
  onOpenMenu,
  onDelete,
  className,
  selectionMode,
  selectionIndex = 0,
  selectedIds,
  setSelected,
}: {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  className?: string;
  selectionMode?: boolean;
  selectionIndex?: number;
  selectedIds?: Set<string>;
  setSelected?: (id: string, checked: boolean) => void;
}) => {
  const {contentToggles} = useViewOptionsStore();
  const domain = getDomainName(item.url);

  return (
    <Link
      href={item.url}
      target="_blank"
      className={cn(
        "group relative flex w-full cursor-pointer items-center gap-3 border-b px-5 py-2.5 pr-12 text-left",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        "transition-none",
        selectionMode && selectedIds?.has(item.id) && "bg-muted",
        className,
      )}>
      {!selectionMode && (
        <BookmarkHoverActions
          className="top-1.5 right-2"
          onOptions={() => {
            onOpenMenu?.(item);
          }}
          onDelete={() => {
            onDelete?.(item);
          }}
        />
      )}

      {/* Checkbox + letter avatar */}
      <div className="flex shrink-0 items-center">
        <div
          className={cn(
            "grid shrink-0 items-center transition-[grid-template-columns,opacity] duration-200 ease-out",
            selectionMode ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
          )}
          style={{
            transitionDelay: selectionMode ? `${Math.min(selectionIndex * 20, 120)}ms` : "0ms",
          }}>
          <div className="min-w-0 overflow-hidden">
            <div className="pr-2">
              <Checkbox
                checked={selectedIds?.has(item.id)}
                onCheckedChange={(next) => setSelected?.(item.id, next === true)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${item.title}`}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>
        <BookmarkAvatar
          item={item}
          letterClassName="size-[18px]"
          imageContainerClassName="size-[18px] border-none bg-transparent rounded-none"
          imageClassName="h-[18px] w-[18px] object-contain"
          skeletonClassName="bg-transparent"
          height={18}
          width={18}
          iconSize={16}
        />
      </div>

      {/* Title */}
      <span className="text-foreground min-w-0 flex-1 truncate text-[13.5px]">{item.title}</span>

      {/* Right side: domain + date + tags */}
      <div className="flex shrink-0 items-center gap-2">
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="text-muted-foreground hidden items-center gap-1 text-[12px] sm:flex">
            {contentToggles.source && <span>{domain}</span>}
            {contentToggles.source && contentToggles.savedDate && (
              <span className="shrink-0">/</span>
            )}
            {contentToggles.savedDate && (
              <span className="shrink-0">{formatDateAbsolute(item.created_at)}</span>
            )}
          </div>
        )}
        {contentToggles.tags && item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} className="text-muted-foreground text-[12px]">
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export const TableItemRow = ({
  item,
  onOpenMenu,
  onDelete,
  className,
  selectionMode,
  selectionIndex = 0,
  selectedIds,
  setSelected,
}: {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  className?: string;
  selectionMode?: boolean;
  selectionIndex?: number;
  selectedIds?: Set<string>;
  setSelected?: (id: string, checked: boolean) => void;
}) => {
  const {contentToggles} = useViewOptionsStore();
  const showSource = contentToggles.source;
  const showSavedDate = contentToggles.savedDate;

  return (
    <Link
      href={item.url}
      target="_blank"
      className={cn(
        "group relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b px-4 py-3 pr-14 text-left",
        getTableBookmarkColumnsClass(showSource, showSavedDate),
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        selectionMode && selectedIds?.has(item.id) && "bg-muted",
        className,
      )}>
      {!selectionMode && (
        <BookmarkHoverActions
          className="top-2.5 right-2"
          onOptions={() => {
            onOpenMenu?.(item);
          }}
          onDelete={() => {
            onDelete?.(item);
          }}
        />
      )}

      <div className="flex items-center">
        <div
          className={cn(
            "grid shrink-0 items-center transition-[grid-template-columns,opacity] duration-200 ease-out",
            selectionMode ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
          )}
          style={{
            transitionDelay: selectionMode ? `${Math.min(selectionIndex * 20, 120)}ms` : "0ms",
          }}>
          <div className="min-w-0 overflow-hidden">
            <div className="pr-2">
              <Checkbox
                checked={selectedIds?.has(item.id)}
                onCheckedChange={(next) => setSelected?.(item.id, next === true)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${item.title}`}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>
        <BookmarkAvatar
          item={item}
          className="size-8"
          imageClassName="h-4 w-4 object-contain"
          height={16}
          width={16}
          iconSize={16}
        />
      </div>

      <div className="min-w-0">
        <div className="text-foreground truncate text-sm font-medium">{item.title}</div>
        <div className="text-muted-foreground mt-0.5 truncate text-xs md:hidden">
          {getDomainName(item.url)}
        </div>
      </div>

      {showSource && (
        <div className="text-muted-foreground hidden min-w-0 truncate text-sm md:block">
          {getDomainName(item.url)}
        </div>
      )}

      {showSavedDate && (
        <div className="text-muted-foreground hidden shrink-0 text-sm md:block">
          {formatDateAbsolute(item.created_at)}
        </div>
      )}
    </Link>
  );
};

export const GridCard = ({
  item,
  onOpenMenu,
  onDelete,
  selectionMode,
  selectionIndex = 0,
  selectedIds,
  setSelected,
}: {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  selectionMode?: boolean;
  selectionIndex?: number;
  selectedIds?: Set<string>;
  setSelected?: (id: string, checked: boolean) => void;
}) => {
  const {borderRadius, contentToggles, gridGap} = useViewOptionsStore();
  const [previewOpenSignal, setPreviewOpenSignal] = useState(0);
  const zeroGap = gridGap === "none";
  const onlyTitle =
    !contentToggles.source &&
    !contentToggles.savedDate &&
    !(contentToggles.description && item.description) &&
    !(contentToggles.tags && item.tags && item.tags.length > 0);

  const radiusClass =
    borderRadius === "none" || zeroGap
      ? "rounded-none"
      : borderRadius === "sm"
        ? "rounded-sm"
        : borderRadius === "md"
          ? "rounded-md"
          : "rounded-lg";

  return (
    <Link
      href={item.url}
      className={cn(
        "group bg-background relative flex h-full w-full cursor-pointer flex-col overflow-hidden text-left",
        zeroGap ? "border-r border-b" : "border",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        selectionMode && selectedIds?.has(item.id) && "bg-muted",
        radiusClass,
      )}>
      <div className="bg-muted relative aspect-16/10 w-full shrink-0">
        {!selectionMode && (
          <BookmarkHoverActions
            variant="glass"
            onExpand={() => {
              setPreviewOpenSignal((current) => current + 1);
            }}
            onOptions={() => {
              onOpenMenu?.(item);
            }}
            onDelete={() => {
              onDelete?.(item);
            }}
          />
        )}

        <div
          className={cn(
            "absolute top-2 left-2 z-20",
            selectionMode ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0",
          )}
          style={{
            transitionDelay: selectionMode ? `${Math.min(selectionIndex * 15, 120)}ms` : "0ms",
          }}>
          <Checkbox
            checked={selectedIds?.has(item.id)}
            onCheckedChange={(next) => setSelected?.(item.id, next === true)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${item.title}`}
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <BookmarkImage
          bookmark_id={item.id}
          item={item}
          type="preview"
          fill={true}
          previewOpenSignal={previewOpenSignal}
          disablePreviewOnClick={true}
          imageClassName="w-full h-full object-cover"
        />
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col px-4", onlyTitle ? "py-3" : "pt-3 pb-4")}>
        <div className="text-foreground line-clamp-1 text-sm text-[15px] font-semibold">
          {item.title}
        </div>
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="text-muted-foreground mt-1 flex min-w-0 items-center gap-1 text-[13px] whitespace-nowrap">
            {contentToggles.source && <span className="min-w-0 truncate">{item.url}</span>}
            {contentToggles.source && contentToggles.savedDate && (
              <span className="shrink-0">-</span>
            )}
            {contentToggles.savedDate && (
              <span className="shrink-0">{formatDateAbsolute(item.created_at)}</span>
            )}
          </div>
        )}
        {contentToggles.description && item.description && (
          <div className="text-muted-foreground mt-1.5 line-clamp-2 text-[13px]">
            {item.description}
          </div>
        )}
        {contentToggles.tags && item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Tag key={tag} className="text-muted-foreground text-[12px]">
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export const MediaCard = ({
  item,
  onOpenMenu,
  onDelete,
  selectionMode,
  selectionIndex = 0,
  selectedIds,
  setSelected,
}: {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  selectionMode?: boolean;
  selectionIndex?: number;
  selectedIds?: Set<string>;
  setSelected?: (id: string, checked: boolean) => void;
}) => {
  const {borderRadius, gridGap} = useViewOptionsStore();
  const radiusClass =
    borderRadius === "none"
      ? "rounded-none"
      : borderRadius === "sm"
        ? "rounded-sm"
        : borderRadius === "md"
          ? "rounded-md"
          : "rounded-lg";

  const hasDimensions = item.metadata?.width && item.metadata?.height;
  const aspectRatio = hasDimensions ? `${item.metadata!.width} / ${item.metadata!.height}` : "16/9";

  return (
    <div
      className={cn(
        "group bg-background relative block w-full cursor-pointer overflow-hidden text-left",
        gridGap !== "none" && "border",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! focus-visible:outline-none",
        selectionMode && selectedIds?.has(item.id) && "bg-muted",
        radiusClass,
      )}
      style={{
        aspectRatio,
      }}>
      {!selectionMode && (
        <BookmarkHoverActions
          variant="glass"
          onOptions={() => {
            onOpenMenu?.(item);
          }}
          onDelete={() => {
            onDelete?.(item);
          }}
        />
      )}

      <div
        className={cn(
          "absolute top-2 left-2 z-20",
          selectionMode ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0",
        )}
        style={{
          transitionDelay: selectionMode ? `${Math.min(selectionIndex * 15, 120)}ms` : "0ms",
        }}>
        <Checkbox
          checked={selectedIds?.has(item.id)}
          onCheckedChange={(next) => setSelected?.(item.id, next === true)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${item.title}`}
          className="focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <BookmarkImage
        bookmark_id={item.id}
        item={item}
        type="preview"
        fill={true}
        width={item.metadata?.width ?? 1200}
        height={item.metadata?.height ?? 1200}
        imageClassName="w-full h-full object-cover"
      />

      {/* <div className="p-3">
        <div className="text-foreground line-clamp-2 text-[14px] font-medium leading-tight">
          {item.title}
        </div>
        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[12px]">
          <div className="relative size-4 overflow-hidden rounded-full border">
             <BookmarkImage
               bookmark_id={item.id}
               item={item}
               type="favicon"
               fill={true}
               imageClassName="object-cover"
             />
          </div>
          <span className="truncate">{item.url ? (() => { try { return new URL(item.url).hostname } catch(e) { return item.url } })() : "Unknown"}</span>
        </div>
      </div> */}
    </div>
  );
};
