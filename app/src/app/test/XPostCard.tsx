"use client";

import {useState} from "react";
import Link from "next/link";
import Image from "next/image";
import MediaPreview from "@/components/ui/MediaPreview";

// ── Types ────────────────────────────────────────────────────────────────────

export interface XMediaItem {
  altText?: string | null;
  id_str?: string;
  size: {height: number; width: number};
  /** Present on images; absent on some card images */
  thumbnail_url?: string;
  /** Always present */
  url: string;
  type: "image" | "video" | "gif";
  duration_millis?: number;
}

export interface XPost {
  tweetID: string;
  tweetURL: string;
  text: string;
  date: string;
  date_epoch: number;
  user_name: string;
  user_screen_name: string;
  user_profile_image_url: string;
  likes: number;
  retweets: number;
  replies: number;
  hasMedia: boolean;
  mediaURLs: string[];
  media_extended: XMediaItem[];
  lang: string;
  possibly_sensitive: boolean;
  replyingTo: string | null;
  /** Quote-retweet embedded post */
  qrt?: XPost | null;
  qrtURL?: string | null;

  // Extra fields often present in the API data
  allSameType?: boolean;
  article?: unknown;
  combinedMediaUrl?: string | null;
  communityNote?: unknown;
  conversationID?: string;
  fetched_on?: number;
  hashtags?: string[];
  pollData?: unknown;
  replyingToID?: string | null;
  retweet?: unknown;
  retweetURL?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(epoch: number): string {
  const now = Date.now() / 1000;
  const diff = now - epoch;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const d = new Date(epoch * 1000);
  return d.toLocaleDateString("en-US", {month: "short", day: "numeric"});
}

function formatFullDate(epoch: number): string {
  const d = new Date(epoch * 1000);
  const time = d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${time} · ${date}`;
}

/** Resolve the best thumbnail URL for a media item */
function mediaThumbnail(m: XMediaItem): string {
  return m.thumbnail_url ?? m.url;
}

/**
 * Parse text for URLs and render them as blue links.
 * Strips protocol and trailing slash for display.
 */
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
          className="text-[#1D9BF0] hover:underline">
          {displayUrl}
        </Link>
      );
    }
    return part;
  });
}

// ── SVG icons ────────────────────────────────────────────────────────────────

export function XLogo({className = ""}: {className?: string}) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.746-8.89L1.834 2.25h7.013L13.01 7.86 18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

// ── Media grid ───────────────────────────────────────────────────────────────

function MediaGrid({media}: {media: XMediaItem[]}) {
  if (!media.length) return null;

  const count = Math.min(media.length, 4);
  const items = media.slice(0, count);

  // X uses a fixed container aspect ratio for multiple images (usually ~16:9)
  // For 1 image, it uses the image's ratio but caps it.
  let containerAspect = 1.777; // 16:9
  if (count === 1) {
    const img = items[0];
    const rawAspect = img.size.width / img.size.height;
    // Cap one image aspect ratio between 4:5 (0.8) and 2:1 (2.0)
    // The user's example (270px height) suggests a wide aspect ratio like 2.0
    containerAspect = Math.max(0.8, Math.min(2.0, rawAspect));
  }

  return (
    <div
      className="bg-muted/30 mt-3 overflow-hidden rounded-[16px] border border-[#CFD9DE]"
      style={{
        aspectRatio: containerAspect,
        maxHeight: count === 1 ? 512 : undefined,
      }}>
      <div
        className={`grid h-full w-full gap-[2px] ${count === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {items.map((m, i) => {
          // For 3 images, the first one is tall (spans 2 rows)
          const isFirstOfThree = count === 3 && i === 0;

          return (
            <div
              key={m.id_str ?? m.url}
              className={`bg-muted relative h-full w-full overflow-hidden ${
                isFirstOfThree ? "row-span-2" : ""
              }`}>
              <MediaPreview
                src={m.url}
                alt={m.altText ?? ""}
                width={m.size.width}
                height={m.size.height}
                poster={mediaThumbnail(m)}
                type={m.type === "video" || m.type === "gif" ? "video" : "image"}
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

// ── Quoted tweet ─────────────────────────────────────────────────────────────

function QuotedTweet({post}: {post: XPost}) {
  const firstMedia = post.hasMedia && post.media_extended.length ? post.media_extended[0] : null;

  return (
    <div className="border-border hover:bg-muted/40 mt-3 rounded-2xl border p-3 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="bg-muted ring-border h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.user_profile_image_url}
            alt={post.user_name}
            className="h-full w-full object-cover"
          />
        </div>
        <span className="text-foreground truncate text-[14px] font-semibold">{post.user_name}</span>
        <span className="text-muted-foreground shrink-0 text-[13px]">@{post.user_screen_name}</span>
        <span className="text-muted-foreground shrink-0">·</span>
        <span className="text-muted-foreground shrink-0 text-[13px]">
          {formatRelativeDate(post.date_epoch)}
        </span>
      </div>

      {/* Text */}
      <p className="text-foreground mt-1.5 line-clamp-4 text-[14px] leading-[1.5] whitespace-pre-wrap">
        {renderText(post.text)}
      </p>

      {/* Media — aspect-ratio container so videos have a defined height */}
      {firstMedia &&
        (() => {
          const isVideo = firstMedia.type === "video" || firstMedia.type === "gif";
          const aspect = Math.max(0.5, Math.min(2, firstMedia.size.width / firstMedia.size.height));
          return (
            <div
              className="mt-2 overflow-hidden rounded-xl"
              style={{aspectRatio: aspect, maxHeight: 192}}>
              <MediaPreview
                src={firstMedia.url}
                alt={firstMedia.altText ?? ""}
                width={firstMedia.size.width}
                height={firstMedia.size.height}
                poster={mediaThumbnail(firstMedia)}
                type={isVideo ? "video" : "image"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              https://pub-37dc11bd0a0647d296d3cfa6eacbf787.r2.dev/media/109d8c03-d414-4ea1-aba8-989c5d391b89/media.mp4
            </div>
          );
        })()}
    </div>
  );
}

// ── Main card ────────────────────────────────────────────────────────────────

export function XPostCard({post}: {post: XPost}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cleanText = (() => {
    if (!post.replyingTo) return post.text;
    const handle = `@${post.replyingTo}`;
    if (post.text.startsWith(handle)) {
      return post.text.slice(handle.length).trim();
    }
    return post.text;
  })();

  const MAX_LENGTH = 280;
  const isLongText = cleanText.length > MAX_LENGTH;
  const displayedText = (() => {
    if (isExpanded || !isLongText) return cleanText;
    const truncated = cleanText.slice(0, MAX_LENGTH);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  })();

  return (
    <article className="border-border hover:bg-muted/40 flex flex-col gap-[14px] border-b px-4 py-3 transition-colors">
      <div className="group flex w-fit cursor-pointer items-center gap-2">
        <div className="bg-muted ring-border h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1">
          <Image
            src={post.user_profile_image_url}
            alt={post.user_name}
            width={40}
            height={40}
            className="h-full w-full object-cover transition-all group-hover:brightness-95"
          />
        </div>

        <div className="fle flex items-center justify-between gap-[6px]">
          <div className="flex min-w-0 flex-col gap-0 text-[15px] leading-[20px]">
            <span className="text-foreground truncate font-semibold group-hover:underline">
              {post.user_name}
            </span>
            <span className="text-muted-foreground shrink-0">@{post.user_screen_name}</span>
          </div>
          {/* <XLogo className="text-foreground/70 h-4 w-4 shrink-0" /> */}
        </div>
      </div>
      {/* Content */}
      <div className="min-w-0 flex-1 space-y-[14px]">
        {/* Replying-to label */}
        {post.replyingTo && (
          <p className="text-muted-foreground text-[14px]">
            Replying to{" "}
            <Link
              href={`https://x.com/${post.replyingTo}`}
              className="cursor-pointer text-[#1D9BF0] hover:underline">
              @{post.replyingTo}
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
              onClick={() => setIsExpanded(true)}
              className="cursor-pointer text-[15px] text-[#1D9BF0] hover:underline focus:outline-none">
              Show more
            </button>
          )}
        </div>

        {/* Media */}
        {post.hasMedia && <MediaGrid media={post.media_extended} />}

        {/* Quote-retweet */}
        {post.qrt && <QuotedTweet post={post.qrt} />}

        {/* Timestamp */}
        <div className="flex text-[14px] text-[#536471]">{formatFullDate(post.date_epoch)}</div>
      </div>
    </article>
  );
}
