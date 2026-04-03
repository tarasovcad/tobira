"use client";
import * as React from "react";
import Link from "next/link";
import {formatDateAbsolute} from "@/lib/utils/dates";
import {cn} from "@/lib/utils/classnames";
import {Checkbox} from "@/components/coss-ui/checkbox";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {Bookmark} from "./types";
import {BookmarkHoverActions} from "./_components/BookmarkHoverActions";
import {BookmarkImage} from "./_components/BookmarkImage";
import {BookmarkAvatar} from "./_components/BookmarkAvatar";
import {Tag} from "@/components/ui/Tag";

interface BookmarkItemProps {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  className?: string;
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
}

const selectionModeHoverActionsClass =
  "group-data-[selection-mode=true]/bookmark-row:pointer-events-none group-data-[selection-mode=true]/bookmark-row:opacity-0";

const selectionModeCheckboxClass =
  "group-data-[selection-mode=true]/bookmark-row:grid-cols-[1fr] group-data-[selection-mode=true]/bookmark-row:opacity-100";

const selectionModeOverlayClass =
  "group-data-[selection-mode=true]/bookmark-row:scale-100 group-data-[selection-mode=true]/bookmark-row:opacity-100";

function ItemListImpl({
  item,
  onOpenMenu,
  onDelete,
  className,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
  const {contentToggles} = useViewOptionsStore();

  return (
    <Link
      href={item.url}
      target="_blank"
      className={cn(
        "group relative flex w-full cursor-pointer flex-col gap-2 border-b px-6 py-5 pr-16 text-left",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        isSelected && "bg-muted",
        className,
        "transition-none!",
      )}>
      <BookmarkHoverActions
        className={cn("top-4 right-4", selectionModeHoverActionsClass)}
        onOptions={() => {
          onOpenMenu?.(item);
        }}
        onDelete={() => {
          onDelete?.(item);
        }}
      />

      <div className="flex min-w-0 flex-1 items-center gap-5">
        <div className="flex items-center">
          <div
            className={cn(
              "grid shrink-0 grid-cols-[0fr] items-center opacity-0 transition-[grid-template-columns,opacity] duration-200 ease-out",
              selectionModeCheckboxClass,
            )}
            style={{
              transitionDelay: `${Math.min(selectionIndex * 20, 120)}ms`,
            }}>
            <div className="min-w-0 overflow-hidden">
              <div className="pr-3">
                <Checkbox
                  checked={isSelected}
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
          <div className="text-foreground truncate text-[15px] font-[550]">{item.title}</div>
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
}

export const ItemList = React.memo(ItemListImpl);

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

function MinimalItemRowImpl({
  item,
  onOpenMenu,
  onDelete,
  className,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
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
        isSelected && "bg-muted",
        className,
        "transition-none!",
      )}>
      <BookmarkHoverActions
        className={cn("top-1.5 right-2", selectionModeHoverActionsClass)}
        onOptions={() => {
          onOpenMenu?.(item);
        }}
        onDelete={() => {
          onDelete?.(item);
        }}
      />

      <div className="flex shrink-0 items-center">
        <div
          className={cn(
            "grid shrink-0 grid-cols-[0fr] items-center opacity-0 transition-[grid-template-columns,opacity] duration-200 ease-out",
            selectionModeCheckboxClass,
          )}
          style={{
            transitionDelay: `${Math.min(selectionIndex * 20, 120)}ms`,
          }}>
          <div className="min-w-0 overflow-hidden">
            <div className="pr-2">
              <Checkbox
                checked={isSelected}
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
          imageContainerClassName="size-[18px] rounded-none border-none bg-transparent"
          imageClassName="h-[18px] w-[18px] object-contain"
          skeletonClassName="bg-transparent"
          height={18}
          width={18}
          iconSize={16}
        />
      </div>

      <span className="text-foreground min-w-0 flex-1 truncate text-[13.5px]">{item.title}</span>

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
}

export const MinimalItemRow = React.memo(MinimalItemRowImpl);

function TableItemRowImpl({
  item,
  onOpenMenu,
  onDelete,
  className,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
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
        isSelected && "bg-muted",
        className,
        "transition-none!",
      )}>
      <BookmarkHoverActions
        className={cn("top-2.5 right-2", selectionModeHoverActionsClass)}
        onOptions={() => {
          onOpenMenu?.(item);
        }}
        onDelete={() => {
          onDelete?.(item);
        }}
      />

      <div className="flex items-center">
        <div
          className={cn(
            "grid shrink-0 grid-cols-[0fr] items-center opacity-0 transition-[grid-template-columns,opacity] duration-200 ease-out",
            selectionModeCheckboxClass,
          )}
          style={{
            transitionDelay: `${Math.min(selectionIndex * 20, 120)}ms`,
          }}>
          <div className="min-w-0 overflow-hidden">
            <div className="pr-2">
              <Checkbox
                checked={isSelected}
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
}

export const TableItemRow = React.memo(TableItemRowImpl);

function GridCardImpl({
  item,
  onOpenMenu,
  onDelete,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
  const {borderRadius, contentToggles, gridGap} = useViewOptionsStore();
  const [previewOpenSignal, setPreviewOpenSignal] = React.useState(0);
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
        isSelected && "bg-muted",
        radiusClass,
        "transition-none!",
      )}>
      <div className="bg-muted relative aspect-16/10 w-full shrink-0">
        <BookmarkHoverActions
          variant="glass"
          className={selectionModeHoverActionsClass}
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

        <div
          className={cn(
            "pointer-events-none absolute top-2 left-2 z-20 scale-90 opacity-0",
            selectionModeOverlayClass,
          )}
          style={{
            transitionDelay: `${Math.min(selectionIndex * 15, 120)}ms`,
          }}>
          <Checkbox
            checked={isSelected}
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
          imageClassName="h-full w-full object-cover"
        />
      </div>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col px-4",
          onlyTitle ? "py-3" : "pt-3 pb-4",
        )}>
        <div className="text-foreground line-clamp-1 text-[15px] font-[550]">{item.title}</div>
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="text-muted-foreground mt-1 min-w-0 text-[13px] whitespace-nowrap">
            <div className="flex min-w-0 items-center gap-1">
              {contentToggles.source && <span className="min-w-0 flex-1 truncate">{item.url}</span>}
              {contentToggles.source && contentToggles.savedDate && (
                <span className="shrink-0">-</span>
              )}
              {contentToggles.savedDate && (
                <span className="shrink-0">{formatDateAbsolute(item.created_at)}</span>
              )}
            </div>
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
}

export const GridCard = React.memo(GridCardImpl);

function MediaCardImpl({
  item,
  onOpenMenu,
  onDelete,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
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
        isSelected && "bg-muted",
        radiusClass,
        "transition-none!",
      )}
      style={{
        aspectRatio,
      }}>
      <BookmarkHoverActions
        variant="glass"
        className={selectionModeHoverActionsClass}
        onOptions={() => {
          onOpenMenu?.(item);
        }}
        onDelete={() => {
          onDelete?.(item);
        }}
      />

      <div
        className={cn(
          "pointer-events-none absolute top-2 left-2 z-20 scale-90 opacity-0",
          selectionModeOverlayClass,
        )}
        style={{
          transitionDelay: `${Math.min(selectionIndex * 15, 120)}ms`,
        }}>
        <Checkbox
          checked={isSelected}
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
        imageClassName="h-full w-full object-cover"
      />
    </div>
  );
}

export const MediaCard = React.memo(MediaCardImpl);
