"use client";

import {useMemo, useState, type ReactNode} from "react";
import Link from "next/link";

import type {
  FreebirdXPostCard,
  FreebirdXPostCommunity,
  FreebirdXPostHashtag,
  FreebirdXPostResponse,
} from "@/lib/fetch/post";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";
import {Tag} from "@/components/ui/app/tag";
import MediaPreview from "@/features/media/components/MediaPreview";
import type {PostBookmark} from "../../types";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import BookmarkHoverActions from "../shared/BookmarkHoverActions";
import {
  getPostBookmarkMediaPreviewItems,
  getPostBookmarkReplyMediaPreviewItems,
  type PostBookmarkPreviewItem,
} from "../../_utils/post-bookmark-preview";
import PostBookmarkMediaGrid from "./PostBookmarkMediaGrid";
import Image from "next/image";

const MAX_LENGTH = 280;

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

function formatShortDate(epoch: number): string {
  const d = new Date(epoch * 1000);
  return d.toLocaleDateString("en-US", {month: "short", day: "numeric"});
}

type RenderableHashtag = Pick<FreebirdXPostHashtag, "indices" | "text">;

type TextEntity = {
  end: number;
  node: ReactNode;
  start: number;
};

function getDisplayHashtags(
  rawText: string,
  hashtags: FreebirdXPostHashtag[],
  cardUrl?: string | null,
): RenderableHashtag[] {
  const cardUrlLength = cardUrl?.length ?? 0;
  const cardUrlIndex = cardUrl ? rawText.indexOf(cardUrl) : -1;
  const cardUrlEnd = cardUrlIndex >= 0 ? cardUrlIndex + cardUrlLength : -1;

  return hashtags
    .map((tag) => {
      const [start, end] = tag.indices;

      if (cardUrlIndex >= 0 && start >= cardUrlEnd) {
        return {
          indices: [start - cardUrlLength, end - cardUrlLength] as [number, number],
          text: tag.text,
        };
      }

      if (cardUrlIndex >= 0 && end <= cardUrlIndex) {
        return tag;
      }

      if (cardUrlIndex >= 0 && start < cardUrlEnd && end > cardUrlIndex) {
        return null;
      }

      return tag;
    })
    .filter((tag): tag is RenderableHashtag => tag != null)
    .filter((tag) => tag.indices[0] >= 0 && tag.indices[1] > tag.indices[0]);
}

function getHashtagBaseUrl(community?: FreebirdXPostCommunity | null) {
  if (community?.isCommunityPost && community.id) {
    return `https://x.com/i/communities/${community.id}`;
  }

  return "https://x.com";
}

function renderText(
  text: string,
  hashtags: RenderableHashtag[] = [],
  hashtagBaseUrl = "https://x.com",
) {
  const entities: TextEntity[] = [];

  for (const match of text.matchAll(/https?:\/\/[^\s]+/g)) {
    const url = match[0];
    const start = match.index;
    if (start == null) continue;

    entities.push({
      end: start + url.length,
      node: (
        <Link
          key={`url-${start}-${start + url.length}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline"
          onClick={(e) => e.stopPropagation()}>
          {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </Link>
      ),
      start,
    });
  }

  for (const tag of hashtags) {
    const [start, end] = tag.indices;
    if (start >= text.length || end > text.length) continue;

    entities.push({
      end,
      node: (
        <Link
          key={`hashtag-${start}-${end}`}
          href={`${hashtagBaseUrl}/hashtag/${encodeURIComponent(tag.text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline"
          onClick={(e) => e.stopPropagation()}>
          {text.slice(start, end)}
        </Link>
      ),
      start,
    });
  }

  entities.sort((a, b) => a.start - b.start || a.end - b.end);

  const parts: ReactNode[] = [];
  let cursor = 0;

  entities.forEach((entity) => {
    if (entity.start < cursor) return;

    if (entity.start > cursor) {
      parts.push(text.slice(cursor, entity.start));
    }

    parts.push(entity.node);
    cursor = entity.end;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

function getDisplayedText(text: string, expanded: boolean) {
  if (expanded || text.length <= MAX_LENGTH) return text;

  const truncated = text.slice(0, MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
}

function LinkCard({card}: {card: FreebirdXPostCard}) {
  const isLarge = card.name === "summary_large_image" || card.name === "summary_large_image:player";

  return (
    <div className="mt-3">
      <Link
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="group/card border-border block overflow-hidden rounded-2xl border group-data-[selection-mode=true]/bookmark-row:pointer-events-none">
        {isLarge ? (
          <div className="bg-muted relative aspect-[1.91/1] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image.url}
              alt={card.image.altText ?? card.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div
              className="absolute right-0 bottom-0 left-0 mx-3 mb-3 h-5.25 rounded-[5px] px-2"
              style={{backgroundColor: "rgba(0, 0, 0, 0.77)"}}>
              <p className="truncate text-[13px] leading-5.25 font-[450] text-white">
                {card.title}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-stretch">
            <div className="border-border bg-muted h-29 w-29 shrink-0 overflow-hidden border-r">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image.url}
                alt={card.image.altText ?? card.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-0.5 px-3 py-2">
              <p className="truncate text-[13px] text-[#536471]">{card.domain}</p>
              <p className="text-foreground line-clamp-2 text-[15px] font-semibold">{card.title}</p>
              {card.description ? (
                <p className="line-clamp-2 text-[13px] text-[#536471]">{card.description}</p>
              ) : null}
            </div>
          </div>
        )}
      </Link>
      <Link
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-1.5 block text-[13px] text-[#536471] hover:underline">
        From {card.domain}
      </Link>
    </div>
  );
}

function CompactMediaGrid({media}: {media: PostBookmarkPreviewItem[]}) {
  if (!media.length) return null;

  const items = media.slice(0, 4);

  return (
    <div className="bg-muted mt-2 grid max-h-72 overflow-hidden rounded-xl border">
      <div className={cn("grid gap-[2px]", items.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {items.map((item) => {
          const isVideo = item.type === "video";
          return (
            <div key={item.key} className="bg-muted aspect-video overflow-hidden">
              <MediaPreview
                src={item.src}
                fullSizeSrc={isVideo ? undefined : item.fullSizeSrc}
                alt={item.alt}
                width={item.width}
                height={item.height}
                poster={item.poster}
                type={isVideo ? "video" : "image"}
                className="h-full w-full object-cover"
                buttonClassName="h-full w-full"
                loading="lazy"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SmallPost({post, media}: {post: FreebirdXPostResponse; media: PostBookmarkPreviewItem[]}) {
  const rawText = post.post.text ?? "";
  const cleanText = post.post.card ? rawText.replace(post.post.card.url, "").trimEnd() : rawText;
  const hashtags = getDisplayHashtags(rawText, post.post.hashtags, post.post.card?.url);
  const hashtagBaseUrl = getHashtagBaseUrl(post.post.community);

  return (
    <div className="border-border mt-3 rounded-2xl border p-3">
      <div className="flex items-center gap-2 text-[14px]">
        <div className="bg-muted ring-border h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.user.user_profile_image_url}
            alt={post.user.user_name}
            className="h-full w-full object-cover"
          />
        </div>
        <span className="text-foreground truncate font-semibold">{post.user.user_name}</span>
        <span className="text-muted-foreground shrink-0">@{post.user.user_screen_name}</span>
        <span className="text-muted-foreground shrink-0">·</span>
        <span className="text-muted-foreground shrink-0">
          {formatShortDate(post.post.date_epoch)}
        </span>
      </div>

      {cleanText ? (
        <p className="text-foreground mt-2 line-clamp-4 text-[14px] whitespace-pre-wrap">
          {renderText(cleanText, hashtags, hashtagBaseUrl)}
        </p>
      ) : null}

      <CompactMediaGrid media={media} />
    </div>
  );
}

function ReplyChain({item, replies}: {item: PostBookmark; replies: FreebirdXPostResponse[]}) {
  if (!replies.length) return null;

  return (
    <div className="border-border mt-3 space-y-3 border-l-2 pl-3">
      {replies.map((reply) => (
        <SmallPost
          key={reply.post.tweetID}
          post={reply}
          media={getPostBookmarkReplyMediaPreviewItems(item, reply.post.tweetID, "list")}
        />
      ))}
    </div>
  );
}

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

  const meta = item.metadata;
  const qrtMediaItems = useMemo(
    () => getPostBookmarkMediaPreviewItems(item, "qrt", "list"),
    [item],
  );

  if (!meta) {
    return (
      <div className={cn("text-muted-foreground border-b px-4 py-3 text-sm", className)}>
        Post data unavailable
      </div>
    );
  }

  const post = meta.tweet.post;
  const user = meta.tweet.user;
  // When a card is present, X hides the card URL from the tweet text (it's
  // represented by the card itself). Strip it here to match X's display.
  const rawText = post.text ?? "";
  const cleanText = post.card ? rawText.replace(post.card.url, "").trimEnd() : rawText;
  const displayedText = getDisplayedText(cleanText, isExpanded);
  const displayedHashtags = getDisplayHashtags(rawText, post.hashtags, post.card?.url);
  const hashtagBaseUrl = getHashtagBaseUrl(post.community);
  const isLongText = cleanText.length > MAX_LENGTH;

  const showAuthor = postContentToggles.author;
  const showMedia = postContentToggles.media;
  const showQuotedPost = postContentToggles.quotedPost;
  const showTags = postContentToggles.tags;
  const showTimestamp = postContentToggles.timestamp;

  const verificationStatus = (user: FreebirdXPostResponse["user"]) => {
    if (user.verification?.verified_type != null)
      return (
        <Image
          src="/x/yellow_verified.svg"
          alt="Yellow verification badge"
          width={32}
          height={32}
        />
      );
    if (user.is_blue_verified)
      return (
        <Image src="/x/blue_verified.svg" alt="Blue verification badge" width={32} height={32} />
      );
    return null;
  };

  const affiliatesLabel = (user: FreebirdXPostResponse["user"]) => {
    if (user.affiliates_highlighted_label != null) {
      return (
        <div className="h-4 w-4 rounded-[2px] border border-[#CFD9DE]">
          <Image
            src={user.affiliates_highlighted_label.badge_url}
            width={16}
            height={16}
            alt={user.affiliates_highlighted_label.description}
          />
        </div>
      );
    }
  };

  return (
    <article
      className={cn(
        "border-border group relative isolate flex flex-col gap-[14px] border-b px-4 py-3",
        "cursor-pointer transition-none!",
        "pt-4",
        isSelected && "bg-muted",
        className,
      )}>
      <div className="pointer-events-none absolute inset-0 z-[2] opacity-0 transition-opacity duration-200 group-data-[selection-mode=true]/bookmark-row:opacity-100" />

      <Link
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-0"
        aria-label={`Open post by ${user.user_name}`}
        tabIndex={-1}
      />

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

      {!showAuthor && (
        <BookmarkSelectionCheckbox
          itemId={item.id}
          title={user.user_name}
          checked={isSelected}
          selectionIndex={selectionIndex}
          onCheckedChange={setSelected}
          variant="overlay"
        />
      )}

      {showAuthor && (
        <div className="relative z-[1] flex items-center">
          <BookmarkSelectionCheckbox
            itemId={item.id}
            title={user.user_name}
            checked={isSelected}
            selectionIndex={selectionIndex}
            onCheckedChange={setSelected}
            paddingClassName="pr-2"
          />
          <Link
            href={`https://x.com/${user.user_screen_name}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="group/author flex w-fit cursor-pointer items-center gap-2">
            <div className="bg-muted ring-border h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.user_profile_image_url}
                alt={user.user_name}
                width={40}
                height={40}
                className="h-full w-full object-cover transition-all duration-100 group-hover/author:brightness-95"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-0 text-[15px] leading-[18px]">
              <div className="flex items-center gap-[3px]">
                <span className="text-foreground truncate font-semibold group-hover/author:underline group-data-[selection-mode=true]/bookmark-row:group-hover/author:no-underline">
                  {user.user_name}
                </span>
                <div className="h-4.5 w-4.5 shrink-0">{verificationStatus(user)} </div>
                {affiliatesLabel(user)}
              </div>
              <span className="shrink-0 text-sm text-[#536471]!">@{user.user_screen_name}</span>
            </div>
          </Link>
        </div>
      )}

      <div className="relative z-[1] min-w-0 flex-1 space-y-[14px]">
        {post.replyingTo ? (
          <p className="text-muted-foreground text-[14px]">
            Replying to{" "}
            <Link
              href={`https://x.com/${post.replyingTo}`}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline">
              @{post.replyingTo}
            </Link>
          </p>
        ) : null}

        <div>
          <p className="text-foreground text-[15px] whitespace-pre-wrap">
            {renderText(displayedText, displayedHashtags, hashtagBaseUrl)}
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

        {showMedia && post.card ? <LinkCard card={post.card} /> : null}

        {showMedia && <PostBookmarkMediaGrid item={item} />}

        {showQuotedPost && post.qrt ? <SmallPost post={post.qrt} media={qrtMediaItems} /> : null}

        <ReplyChain item={item} replies={meta.reply_chain ?? []} />

        {showTags && item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Tag key={tag} displayHash={false} size="md" variant="outline">
                # {tag}
              </Tag>
            ))}
          </div>
        )}

        {showTimestamp && (
          <div className="flex items-center gap-3 text-[14px] text-[#536471]">
            {formatFullDate(post.date_epoch)}
          </div>
        )}
      </div>
    </article>
  );
}
