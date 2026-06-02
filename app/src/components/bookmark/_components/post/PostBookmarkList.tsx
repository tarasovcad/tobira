"use client";

import {useCallback, useMemo, useState, type MouseEvent} from "react";
import Link from "next/link";

import {cn} from "@/lib/utils";
import {formatPostFullDate} from "@/lib/utils/dates";
import {useViewOptionsStore} from "@/store/use-view-options";
import {Tag} from "@/components/ui/app/tag";
import type {PostBookmark} from "../../types";
import BookmarkSelectionCheckbox from "../shared/BookmarkSelectionCheckbox";
import BookmarkHoverActions from "../shared/BookmarkHoverActions";
import {
  getPostBookmarkArticleCoverPreviewItem,
  getPostBookmarkMediaPreviewItems,
} from "../../_utils/post-bookmark-preview";
import PostBookmarkArticlePreview from "./PostBookmarkArticlePreview";
import {PostBookmarkAuthorAvatar, PostBookmarkAuthorLine} from "./PostBookmarkAuthor";
import PostBookmarkExternalCard from "./PostBookmarkExternalCard";
import PostBookmarkMediaGrid from "./PostBookmarkMediaGrid";
import PostBookmarkQuotedPost from "./PostBookmarkQuotedPost";
import {PostBookmarkText, preparePostBookmarkText} from "./PostBookmarkText";

const MAX_LENGTH = 280;

interface PostBookmarkListProps {
  item: PostBookmark;
  onOpenDetail?: (item: PostBookmark) => void;
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
  onOpenDetail,
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
  const mainMediaItems = useMemo(
    () => getPostBookmarkMediaPreviewItems(item, "main", "list"),
    [item],
  );
  const handleOpenDetail = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!onOpenDetail || isInteractiveTarget(event.target)) {
        return;
      }

      onOpenDetail(item);
    },
    [item, onOpenDetail],
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
  const articlePreviewItem = post.article
    ? getPostBookmarkArticleCoverPreviewItem(item, "list", 0)
    : null;
  const quotedArticlePreviewItem = post.qrt?.post.article
    ? getPostBookmarkArticleCoverPreviewItem(item, "list", post.article ? 1 : 0)
    : null;
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
        <p className="text-[14px] text-[#536471]">
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
        {!isExpanded && preparedText.isLongText ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="-mt-0.5 block cursor-pointer text-[15px] leading-[18px] text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline focus:outline-none">
            Show more
          </button>
        ) : null}
      </div>

      {showMedia && post.card ? <PostBookmarkExternalCard card={post.card} /> : null}

      {showMedia && post.article ? (
        <PostBookmarkArticlePreview
          post={post}
          fallbackHref={post.tweetURL}
          previewItem={articlePreviewItem}
        />
      ) : null}

      {showMedia ? <PostBookmarkMediaGrid item={item} /> : null}

      {showQuotedPost && post.qrt ? (
        <PostBookmarkQuotedPost
          articlePreviewItem={quotedArticlePreviewItem}
          post={post.qrt}
          mediaItems={qrtMediaItems}
          mediaVariant={mainMediaItems.length > 0 ? "compact" : "full"}
        />
      ) : null}

      {showTags && item.tags && item.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Tag key={tag} displayHash={false} size="md" variant="outline">
              # {tag}
            </Tag>
          ))}
        </div>
      ) : null}

      {showTimestamp && !showAuthor ? (
        <div className="flex items-center gap-3 text-[14px] text-[#536471]">
          {formatPostFullDate(post.date_epoch)}
        </div>
      ) : null}
    </>
  );

  return (
    <article
      onClick={onOpenDetail ? handleOpenDetail : undefined}
      className={cn(
        "border-border group relative isolate flex flex-col gap-[14px] border-b px-4 py-3",
        "hover:bg-muted/75 cursor-pointer transition-colors duration-50",
        "pt-4",
        isSelected && "bg-muted",
        className,
      )}>
      <div className="pointer-events-none absolute inset-0 z-[2] opacity-0 transition-opacity duration-200 group-data-[selection-mode=true]/bookmark-row:opacity-100" />

      {!onOpenDetail ? (
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-0"
          aria-label={`Open post by ${user.user_name}`}
          tabIndex={-1}
        />
      ) : null}

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

      {!showAuthor ? (
        <BookmarkSelectionCheckbox
          itemId={item.id}
          title={user.user_name}
          checked={isSelected}
          selectionIndex={selectionIndex}
          onCheckedChange={setSelected}
          variant="overlay"
        />
      ) : null}

      {showAuthor ? (
        <div className="relative z-[1] grid grid-cols-[40px_minmax(0,1fr)] gap-x-3">
          <PostBookmarkAuthorAvatar user={user} profileUrl={authorProfileUrl} />

          <div className="min-w-0 space-y-0.5">
            <PostBookmarkAuthorLine
              user={user}
              profileUrl={authorProfileUrl}
              timestampEpoch={post.date_epoch}
              showTimestamp={showTimestamp}
              className="pr-10 text-[15px] leading-5"
              selectionSlot={
                <BookmarkSelectionCheckbox
                  itemId={item.id}
                  title={user.user_name}
                  checked={isSelected}
                  selectionIndex={selectionIndex}
                  onCheckedChange={setSelected}
                  paddingClassName="pr-1"
                />
              }
            />

            {postBodyContent}
          </div>
        </div>
      ) : null}

      {!showAuthor ? (
        <div className="relative z-[1] min-w-0 flex-1 space-y-[14px]">{postBodyContent}</div>
      ) : null}
    </article>
  );
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "a",
        "button",
        "input",
        "select",
        "textarea",
        "[role='button']",
        "[role='link']",
        "[data-no-post-detail]",
      ].join(","),
    ),
  );
}
