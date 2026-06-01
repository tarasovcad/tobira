"use client";

import {useMemo, useState} from "react";
import Link from "next/link";

import type {FreebirdXPostCard, FreebirdXPostResponse} from "@/lib/fetch/post";
import {cn} from "@/lib/utils";
import {formatPostFullDate, formatShortPostDate} from "@/lib/utils/dates";
import {useViewOptionsStore} from "@/store/use-view-options";
import {Tag} from "@/components/ui/app/tag";
import {Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger} from "@/components/ui/coss/tooltip";
import type {PostBookmark} from "../../types";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import BookmarkHoverActions from "../shared/BookmarkHoverActions";
import {
  getPostBookmarkMediaPreviewItems,
  getPostBookmarkReplyMediaPreviewItems,
  type PostBookmarkPreviewItem,
} from "../../_utils/post-bookmark-preview";
import PostBookmarkMediaGrid from "./PostBookmarkMediaGrid";
import {PostBookmarkText, preparePostBookmarkText} from "./PostBookmarkText";
import Image from "next/image";

const MAX_LENGTH = 280;

function PostShortTimestamp({epoch, className}: {epoch: number; className?: string}) {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={cn("cursor-point shrink-0 cursor-pointer hover:underline", className)}
            />
          }
          onClick={(e) => e.stopPropagation()}>
          {formatShortPostDate(epoch)}
        </TooltipTrigger>
        <TooltipPopup size="md" sideOffset={4}>
          {formatPostFullDate(epoch)}
        </TooltipPopup>
      </Tooltip>
    </TooltipProvider>
  );
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
              className="absolute right-0 bottom-0 left-0 mx-3 mb-3 h-5.25 w-fit rounded-[5px] px-2"
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

function getCompactMediaBackgroundUrl(item: PostBookmarkPreviewItem): string {
  if (item.type === "video") {
    return item.poster ?? item.src;
  }

  return item.src;
}

function CompactMediaGrid({media}: {media: PostBookmarkPreviewItem[]}) {
  if (!media.length) return null;

  const items = media.slice(0, 4);

  return (
    <div className="mt-2 max-h-[100px] max-w-[100px] shrink-0 overflow-hidden rounded-xl border">
      <div className={cn("grid gap-[2px]", items.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {items.map((item) => (
          <div
            key={item.key}
            role="img"
            aria-label={item.alt}
            className={cn(
              "bg-muted bg-cover bg-center",
              items.length === 1 ? "h-[100px] w-[100px]" : "aspect-square",
            )}
            style={{
              backgroundImage: `url(${JSON.stringify(getCompactMediaBackgroundUrl(item))})`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function verificationStatus(user: FreebirdXPostResponse["user"]) {
  if (user.verification?.verified_type != null)
    return (
      <div className="h-4.5 w-4.5 shrink-0">
        {" "}
        <Image
          src="/x/yellow_verified.svg"
          alt="Yellow verification badge"
          width={32}
          height={32}
        />
      </div>
    );
  if (user.is_blue_verified)
    return (
      <div className="h-4.5 w-4.5 shrink-0">
        <Image src="/x/blue_verified.svg" alt="Blue verification badge" width={32} height={32} />
      </div>
    );
  return null;
}

function affiliatesLabel(user: FreebirdXPostResponse["user"]) {
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
}

function SmallPost({post, media}: {post: FreebirdXPostResponse; media: PostBookmarkPreviewItem[]}) {
  const preparedText = preparePostBookmarkText(post.post);
  const authorProfileUrl = `https://x.com/${post.user.user_screen_name}`;

  return (
    <div className="hover:bg-muted mt-2 rounded-2xl border border-[#CFD9DE] p-3">
      <div className="flex min-w-0 items-center gap-2 text-[14px] leading-5">
        <Link
          href={authorProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="group/avatar shrink-0 cursor-pointer">
          <div className="bg-muted ring-border h-6 w-6 overflow-hidden rounded-full ring-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.user.user_profile_image_url}
              alt={post.user.user_name}
              className="h-full w-full object-cover transition-all duration-100 group-hover/avatar:brightness-95"
            />
          </div>
        </Link>

        <div className="flex min-w-0 items-center gap-1">
          <div className="flex min-w-0 items-center">
            <Link
              href={authorProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="group/author flex min-w-0 cursor-pointer items-center gap-[3px]">
              <span className="text-foreground truncate font-semibold group-hover/author:underline group-data-[selection-mode=true]/bookmark-row:group-hover/author:no-underline">
                {post.user.user_name}
              </span>
              {verificationStatus(post.user)}
              {affiliatesLabel(post.user)}
              <span className="min-w-0 shrink truncate pl-0.5 text-[#536471]!">
                @{post.user.user_screen_name}
              </span>
            </Link>
          </div>

          <span className="text-[#536471]">·</span>
          <PostShortTimestamp epoch={post.post.date_epoch} className="text-[#536471]" />
        </div>
      </div>

      <div className="mt-1 flex items-start gap-3">
        <CompactMediaGrid media={media} />
        {preparedText.hasText ? (
          <p className="text-foreground mt-2 line-clamp-5 max-w-full min-w-0 text-[15px] leading-[19px] wrap-break-word whitespace-pre-wrap">
            <PostBookmarkText preparedText={preparedText} />
          </p>
        ) : null}
      </div>
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
  const preparedText = preparePostBookmarkText(post, {
    expanded: isExpanded,
    maxLength: MAX_LENGTH,
  });
  const authorProfileUrl = `https://x.com/${user.user_screen_name}`;

  const showAuthor = postContentToggles.author;
  const showMedia = postContentToggles.media;
  const showQuotedPost = postContentToggles.quotedPost;
  const showTags = postContentToggles.tags;
  const showTimestamp = postContentToggles.timestamp;

  const postBodyContent = (
    <>
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
        {preparedText.hasText ? (
          <p className="text-foreground text-[15px] whitespace-pre-wrap">
            <PostBookmarkText preparedText={preparedText} />
          </p>
        ) : null}
        {!isExpanded && preparedText.isLongText && (
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

      {showTimestamp && !showAuthor && (
        <div className="flex items-center gap-3 text-[14px] text-[#536471]">
          {formatPostFullDate(post.date_epoch)}
        </div>
      )}
    </>
  );

  return (
    <article
      className={cn(
        "border-border group relative isolate flex flex-col gap-[14px] border-b px-4 py-3",
        "hover:bg-muted/75 cursor-pointer transition-colors duration-50",
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
        <div className="relative z-[1] grid grid-cols-[40px_minmax(0,1fr)] gap-x-3">
          <Link
            href={authorProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="group/avatar size-10 cursor-pointer">
            <div className="bg-muted ring-border h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.user_profile_image_url}
                alt={user.user_name}
                width={40}
                height={40}
                className="h-full w-full object-cover transition-all duration-100 group-hover/avatar:brightness-95"
              />
            </div>
          </Link>

          <div className="min-w-0 space-y-0.5">
            <div className="flex min-w-0 items-center gap-1 pr-10 text-[15px] leading-5">
              <div className="flex min-w-0 items-center">
                <BookmarkSelectionCheckbox
                  itemId={item.id}
                  title={user.user_name}
                  checked={isSelected}
                  selectionIndex={selectionIndex}
                  onCheckedChange={setSelected}
                  paddingClassName="pr-1"
                />

                <Link
                  href={authorProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="group/author flex min-w-0 cursor-pointer items-center gap-[3px]">
                  <span className="text-foreground truncate font-semibold group-hover/author:underline group-data-[selection-mode=true]/bookmark-row:group-hover/author:no-underline">
                    {user.user_name}
                  </span>
                  {verificationStatus(user)}
                  {affiliatesLabel(user)}
                  <span className="min-w-0 shrink truncate pl-0.5 text-[#536471]!">
                    @{user.user_screen_name}
                  </span>
                </Link>
              </div>

              {showTimestamp && (
                <>
                  <span className="text-[#536471]">·</span>
                  <PostShortTimestamp epoch={post.date_epoch} className="text-[#536471]" />
                </>
              )}
            </div>

            {postBodyContent}
          </div>
        </div>
      )}

      {!showAuthor && (
        <div className="relative z-[1] min-w-0 flex-1 space-y-[14px]">{postBodyContent}</div>
      )}
    </article>
  );
}
