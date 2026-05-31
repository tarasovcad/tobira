"use client";

import {useMemo, useState} from "react";
import Link from "next/link";

import {cn} from "@/lib/utils";
import type {PostBookmarkMetadata} from "@/components/bookmark/types/metadata";
import {useViewOptionsStore} from "@/store/use-view-options";
import {Tag} from "@/components/ui/app/tag";
import MediaPreview from "@/features/media/components/MediaPreview";
import type {PostBookmark} from "../../types";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import BookmarkHoverActions from "../shared/BookmarkHoverActions";
import {
  getPostBookmarkMediaPreviewItems,
  type PostBookmarkPreviewItem,
} from "../../_utils/post-bookmark-preview";
import PostBookmarkMediaGrid from "./PostBookmarkMediaGrid";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFullDate(epoch: number): string {
  const d = new Date(epoch * 1000);
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = d.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
  return `${time} · ${date}`;
}

function formatQuotedPostDate(epoch: number): string {
  const d = new Date(epoch * 1000);
  return d.toLocaleDateString("en-US", {month: "short", day: "numeric"});
}

function renderText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      const displayUrl = part.replace(/^https?:\/\//, "").replace(/\/$/, "");
      return (
        <Link
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline"
          onClick={(e) => e.stopPropagation()}>
          {displayUrl}
        </Link>
      );
    }
    return part;
  });
}

// ── Media grid ────────────────────────────────────────────────────────────────

// ── Quoted post ───────────────────────────────────────────────────────────────

function QuotedPost({
  qrt,
  media,
}: {
  qrt: NonNullable<PostBookmarkMetadata["qrt"]>;
  media: PostBookmarkPreviewItem[];
}) {
  const firstMedia = qrt.hasMedia && media.length ? media[0] : null;
  const isVideo = firstMedia?.type === "video";

  return (
    <div className="border-border hover:bg-muted/40 mt-3 overflow-hidden rounded-2xl border transition-colors">
      <div className="p-3">
        <div className="flex items-center gap-1 text-[15px]">
          <div className="bg-muted ring-border ring-0.5 mr-1 h-6 w-6 shrink-0 overflow-hidden rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrt.user_profile_image_url}
              alt={qrt.user_name}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-foreground truncate font-semibold">{qrt.user_name}</span>
          <span className="text-muted-foreground shrink-0">@{qrt.user_screen_name}</span>
          {qrt.date_epoch != null && (
            <>
              <span className="text-muted-foreground shrink-0">·</span>
              <span className="text-muted-foreground shrink-0">
                {formatQuotedPostDate(qrt.date_epoch)}
              </span>
            </>
          )}
        </div>

        <p className="text-foreground mt-1.5 line-clamp-4 text-[14px] leading-normal whitespace-pre-wrap">
          {renderText(qrt.text)}
        </p>
      </div>

      {firstMedia && (
        <div className="bg-muted aspect-video w-full overflow-hidden">
          <MediaPreview
            src={firstMedia.src}
            fullSizeSrc={isVideo ? undefined : firstMedia.fullSizeSrc}
            alt={firstMedia.alt}
            width={firstMedia.width}
            height={firstMedia.height}
            poster={firstMedia.poster}
            type={isVideo ? "video" : "image"}
            className="h-full w-full object-cover"
            buttonClassName="h-full w-full"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

const MAX_LENGTH = 280;

interface PostBookmarkListProps {
  item: PostBookmark;
  onOpenMenu?: (item: PostBookmark) => void;
  onSave?: (item: PostBookmark) => void;
  onDismiss?: (item: PostBookmark) => void;
  className?: string;
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
}

export default function PostBookmarkList({
  item,
  onOpenMenu,
  onSave,
  onDismiss,
  className,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: PostBookmarkListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const postContentToggles = useViewOptionsStore((state) => state.postContentToggles);

  const meta = item.metadata as PostBookmarkMetadata | undefined;
  const qrtMediaItems = useMemo(
    () => getPostBookmarkMediaPreviewItems(item, "qrt", "list"),
    [item],
  );

  if (!meta || meta.platform !== "x") {
    return (
      <div className={cn("text-muted-foreground border-b px-4 py-3 text-sm", className)}>
        Post data unavailable
      </div>
    );
  }

  const replyingTo = null;
  const cleanText = meta.text ?? "";
  const isLongText = cleanText.length > MAX_LENGTH;
  const displayedText = (() => {
    if (isExpanded || !isLongText) return cleanText;
    const truncated = cleanText.slice(0, MAX_LENGTH);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  })();

  const showAuthor = postContentToggles.author;
  const showMedia = postContentToggles.media;
  const showQuotedPost = postContentToggles.quotedPost;
  const showTags = postContentToggles.tags;
  const showTimestamp = postContentToggles.timestamp;

  return (
    <article
      className={cn(
        "border-border group relative isolate flex flex-col gap-[14px] border-b px-4 py-3",
        // "hover:bg-muted/80",
        "cursor-pointer transition-none!",
        "pt-4",
        isSelected && "bg-muted",
        className,
      )}>
      <div className="pointer-events-none absolute inset-0 z-[2] opacity-0 transition-opacity duration-200 group-data-[selection-mode=true]/bookmark-row:opacity-100" />

      {/* Full-card link overlay */}
      <Link
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-0"
        aria-label={`Open post by ${meta.user_name}`}
        tabIndex={-1}
      />

      {/* Hover actions */}
      <BookmarkHoverActions
        className="top-3 right-3 z-[3]"
        onSave={
          onSave
            ? (e) => {
                e.stopPropagation();
                onSave(item);
              }
            : undefined
        }
        onDismiss={
          onDismiss
            ? (e) => {
                e.stopPropagation();
                onDismiss(item);
              }
            : undefined
        }
        onOptions={
          onOpenMenu
            ? (e) => {
                e.stopPropagation();
                onOpenMenu(item);
              }
            : undefined
        }
      />

      {/* When author is hidden, selection control sits in the corner (no layout impact) */}
      {!showAuthor && (
        <BookmarkSelectionCheckbox
          itemId={item.id}
          title={meta.user_name}
          checked={isSelected}
          selectionIndex={selectionIndex}
          onCheckedChange={setSelected}
          variant="overlay"
        />
      )}

      {/* Author row */}
      {showAuthor && (
        <div className="relative z-[1] flex items-center">
          <BookmarkSelectionCheckbox
            itemId={item.id}
            title={meta.user_name}
            checked={isSelected}
            selectionIndex={selectionIndex}
            onCheckedChange={setSelected}
            paddingClassName="pr-2"
          />
          <Link
            href={`https://x.com/${meta.user_screen_name}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="group/author flex w-fit cursor-pointer items-center gap-2">
            <div className="bg-muted ring-border h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meta.user_profile_image_url}
                alt={meta.user_name}
                width={40}
                height={40}
                className="h-full w-full object-cover transition-all duration-100 group-hover/author:brightness-95"
              />
            </div>
            <div className="flex items-center gap-[6px]">
              <div className="flex min-w-0 flex-col gap-0 text-[15px] leading-[20px]">
                <span className="text-foreground truncate font-semibold group-hover/author:underline group-data-[selection-mode=true]/bookmark-row:group-hover/author:no-underline">
                  {meta.user_name}
                </span>
                <span className="text-muted-foreground shrink-0">@{meta.user_screen_name}</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Content */}
      <div className="relative z-[1] min-w-0 flex-1 space-y-[14px]">
        {/* Replying-to label */}
        {replyingTo && (
          <p className="text-muted-foreground text-[14px]">
            Replying to{" "}
            <Link
              href={`https://x.com/${replyingTo}`}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline">
              @{replyingTo}
            </Link>
          </p>
        )}

        {/* Tweet text */}
        <div>
          <p className="text-foreground text-[15px] whitespace-pre-wrap">
            {renderText(displayedText)}
          </p>
          {!isExpanded && isLongText && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="cursor-pointer text-[15px] text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline focus:outline-none">
              Show more
            </button>
          )}
        </div>

        {/* Media */}
        {showMedia && <PostBookmarkMediaGrid item={item} />}

        {/* Quoted post */}
        {showQuotedPost && meta.qrt && <QuotedPost qrt={meta.qrt} media={qrtMediaItems} />}

        {/* Tags */}
        {showTags && item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Tag key={tag} displayHash={false} size="md" variant="outline">
                # {tag}
              </Tag>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {showTimestamp && (
          <div className="flex items-center gap-3 text-[14px] text-[#536471]">
            {formatFullDate(meta.date_epoch)}
          </div>
        )}
      </div>
    </article>
  );
}
