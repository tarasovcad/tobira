"use client";

import * as React from "react";
import {useState} from "react";
import Link from "next/link";
import Image from "next/image";
import {cn} from "@/lib/utils";
import MediaPreview from "@/components/ui/MediaPreview";
import {BookmarkHoverActions} from "./BookmarkHoverActions";
import {BookmarkSelectionControl} from "./BookmarkSelectionControl";
import type {BookmarkItemProps} from "./bookmark-item-props";
import type {PostBookmarkMetadata} from "@/app/home/_types/bookmark-metadata";
import {useViewOptionsStore} from "@/store/use-view-options";
import {Tag} from "@/components/ui/Tag";

type PostMediaItem = PostBookmarkMetadata["media_extended"][number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFullDate(epoch: number): string {
  const d = new Date(epoch * 1000);
  const time = d
    .toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit", hour12: true})
    .toUpperCase();
  const date = d.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
  return `${time} · ${date}`;
}

function mediaThumbnail(m: PostMediaItem): string {
  return m.thumbnail_url ?? m.url;
}

function buildTwitterSizedUrl(url: string, size: "small" | "large"): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("pbs.twimg.com")) return null;
    u.searchParams.set("name", size);
    return u.toString();
  } catch {
    return null;
  }
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

function MediaGrid({media}: {media: PostMediaItem[]}) {
  if (!media.length) return null;

  const count = Math.min(media.length, 4);
  const items = media.slice(0, count);

  let containerAspect = 1.777;
  if (count === 1) {
    const img = items[0];
    const w = img.size?.width ?? 1;
    const h = img.size?.height ?? 1;
    containerAspect = Math.max(0.8, Math.min(2.0, w / h));
  }

  return (
    <div
      className="bg-muted/30 dark:border-border mt-3 overflow-hidden rounded-[16px] border border-[#CFD9DE]"
      style={{
        aspectRatio: containerAspect,
        maxHeight: count === 1 ? 512 : undefined,
      }}>
      <div
        className={cn("grid h-full w-full gap-[2px]", count === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {items.map((m, i) => {
          const isFirstOfThree = count === 3 && i === 0;
          const isVideo = m.type === "video" || m.type === "gif";
          const displaySrc = m.url_small ?? m.url;
          const fullSrc = m.url_large ?? buildTwitterSizedUrl(m.url, "large") ?? m.url;
          return (
            <div
              key={m.url}
              className={cn(
                "bg-muted relative h-full w-full overflow-hidden",
                isFirstOfThree && "row-span-2",
              )}>
              <MediaPreview
                src={displaySrc}
                fullSizeSrc={isVideo ? undefined : fullSrc}
                alt={m.altText ?? ""}
                width={m.size?.width ?? 1200}
                height={m.size?.height ?? 1200}
                poster={mediaThumbnail(m)}
                type={isVideo ? "video" : "image"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Quoted post ───────────────────────────────────────────────────────────────

function QuotedPost({qrt}: {qrt: NonNullable<PostBookmarkMetadata["qrt"]>}) {
  const firstMedia = qrt.hasMedia && qrt.media_extended.length ? qrt.media_extended[0] : null;

  return (
    <div className="border-border hover:bg-muted/40 mt-3 rounded-2xl border p-3 transition-colors">
      <div className="flex items-center gap-2">
        <div className="bg-muted ring-border h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrt.user_profile_image_url}
            alt={qrt.user_name}
            className="h-full w-full object-cover"
          />
        </div>
        <span className="text-foreground truncate text-[14px] font-semibold">{qrt.user_name}</span>
        <span className="text-muted-foreground shrink-0 text-[13px]">@{qrt.user_screen_name}</span>
        <span className="text-muted-foreground shrink-0">·</span>
      </div>

      <p className="text-foreground mt-1.5 line-clamp-4 text-[14px] leading-normal whitespace-pre-wrap">
        {renderText(qrt.text)}
      </p>

      {firstMedia &&
        (() => {
          const isVideo = firstMedia.type === "video" || firstMedia.type === "gif";
          const w = firstMedia.size?.width ?? 1;
          const h = firstMedia.size?.height ?? 1;
          const aspect = Math.max(0.5, Math.min(2, w / h));
          const displaySrc = firstMedia.url_small ?? firstMedia.url;
          const fullSrc =
            firstMedia.url_large ?? buildTwitterSizedUrl(firstMedia.url, "large") ?? firstMedia.url;
          return (
            <div
              className="mt-2 overflow-hidden rounded-xl"
              style={{aspectRatio: aspect, maxHeight: 192}}>
              <MediaPreview
                src={displaySrc}
                fullSizeSrc={isVideo ? undefined : fullSrc}
                alt={firstMedia.altText ?? ""}
                width={firstMedia.size?.width ?? 1200}
                height={firstMedia.size?.height ?? 1200}
                poster={mediaThumbnail(firstMedia)}
                type={isVideo ? "video" : "image"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          );
        })()}
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

const MAX_LENGTH = 280;

function BookmarkPostCardImpl({
  item,
  onOpenMenu,
  onSave,
  onDismiss,
  className,
  selectionIndex = 0,
  isSelected = false,
  setSelected,
}: BookmarkItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const postContentToggles = useViewOptionsStore((state) => state.postContentToggles);

  const meta = item.metadata as PostBookmarkMetadata | undefined;

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
        "hover:bg-muted/80",
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
        <BookmarkSelectionControl
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
          <BookmarkSelectionControl
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
              <Image
                src={meta.user_profile_image_url}
                alt={meta.user_name}
                width={40}
                height={40}
                className="h-full w-full object-cover transition-all group-hover/author:brightness-95"
                unoptimized
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
        {showMedia && meta.hasMedia && meta.media_extended.length > 0 && (
          <MediaGrid media={meta.media_extended} />
        )}

        {/* Quoted post */}
        {showQuotedPost && meta.qrt && <QuotedPost qrt={meta.qrt} />}

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

export const BookmarkPostCard = React.memo(BookmarkPostCardImpl);
