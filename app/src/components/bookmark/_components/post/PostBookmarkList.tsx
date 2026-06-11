"use client";

import {useCallback, useMemo, useState, type MouseEvent, type ReactNode} from "react";
import Link from "next/link";

import type {FreebirdXPost, FreebirdXPostResponse} from "@/lib/fetch/post";
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
  getPostBookmarkReplyMediaPreviewItems,
} from "../../_utils/post-bookmark-preview";
import PostBookmarkArticleDetail from "./PostBookmarkArticleDetail";
import PostBookmarkArticlePreview from "./PostBookmarkArticlePreview";
import {
  PostBookmarkAuthorAvatar,
  PostBookmarkAuthorLine,
  PostBookmarkAuthorStack,
} from "./PostBookmarkAuthor";
import PostBookmarkExternalCard from "./PostBookmarkExternalCard";
import PostBookmarkMediaGrid, {PostBookmarkMediaPreviewGrid} from "./PostBookmarkMediaGrid";
import PostBookmarkQuotedPost from "./PostBookmarkQuotedPost";
import {
  PostBookmarkText,
  preparePostBookmarkText,
  preparePostBookmarkTranslationText,
} from "./PostBookmarkText";
import {useTranslationToggle, PostTranslationLabel} from "./PostBookmarkTranslation";

const MAX_LENGTH = 280;
type TranslationToggle = ReturnType<typeof useTranslationToggle>;
type PreparedText = ReturnType<typeof preparePostBookmarkText>;
type PostBookmarkUser = FreebirdXPostResponse["user"];

/** Room for the avatar selection checkbox without shifting post body content. */
const postListSelectionInsetClass =
  "transition-[margin,padding,width] duration-200 ease-out group-data-[selection-mode=true]/bookmark-row:-ml-7 group-data-[selection-mode=true]/bookmark-row:w-[calc(100%+1.75rem)] group-data-[selection-mode=true]/bookmark-row:pl-11 group-data-[selection-mode=true]/bookmark-row:pr-4";

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
  isPostDetailOpen?: boolean;
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
  isPostDetailOpen = false,
}: PostBookmarkListProps) {
  const [isExpanded, setIsExpanded] = useState(isPostDetailOpen);
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
  const replyChain = useMemo(
    () => [...(meta?.reply_chain ?? [])].sort((a, b) => a.post.date_epoch - b.post.date_epoch),
    [meta?.reply_chain],
  );
  const post = meta?.tweet.post ?? null;
  const translationToggle = useTranslationToggle(post, {
    initialTranslationExpanded: isPostDetailOpen,
  });
  const handleOpenDetail = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!onOpenDetail || isInteractiveTarget(event.target)) {
        return;
      }

      onOpenDetail(item);
    },
    [item, onOpenDetail],
  );
  if (!meta || !post) {
    return (
      <div className={cn("text-muted-foreground border-b px-4 py-3 text-sm", className)}>
        Post data unavailable or not supported.
      </div>
    );
  }

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
  const preparedTranslationText = preparePostBookmarkTranslationText(post, {
    expanded: translationToggle.isTranslationExpanded,
  });
  const authorProfileUrl = `https://x.com/${user.user_screen_name}`;
  const authorSelectionCheckbox = (
    <BookmarkSelectionCheckbox
      itemId={item.id}
      title={user.user_name}
      checked={isSelected}
      selectionIndex={selectionIndex}
      onCheckedChange={setSelected}
      variant="overlay"
      className="top-1/2 -left-7 -translate-y-1/2"
    />
  );

  const showAuthor = postContentToggles.author;
  const showMedia = postContentToggles.media;
  const showQuotedPost = postContentToggles.quotedPost;
  const showTags = postContentToggles.tags;
  const showTimestamp = postContentToggles.timestamp;

  const postBodyContent = (
    <>
      <PostBookmarkReplyingTo post={post} isPostDetailOpen={isPostDetailOpen} />

      <PostBookmarkPostText
        isExpanded={isExpanded}
        preparedText={preparedText}
        preparedTranslationText={preparedTranslationText}
        translationToggle={translationToggle}
        onExpandOriginal={() => setIsExpanded(true)}
      />

      {showMedia && post.card ? <PostBookmarkExternalCard card={post.card} /> : null}

      {showMedia && post.article && isPostDetailOpen ? (
        <PostBookmarkArticleDetail item={item} post={post} fallbackHref={post.tweetURL} />
      ) : null}

      {showMedia && post.article && !isPostDetailOpen ? (
        <PostBookmarkArticlePreview
          post={post}
          fallbackHref={post.tweetURL}
          openExternally={!onOpenDetail}
          previewItem={articlePreviewItem}
        />
      ) : null}

      {showMedia ? <PostBookmarkMediaGrid item={item} /> : null}

      {showQuotedPost && post.qrt ? (
        <PostBookmarkQuotedPost
          articlePreviewItem={quotedArticlePreviewItem}
          post={post.qrt}
          mediaItems={qrtMediaItems}
          isPostDetailOpen={isPostDetailOpen}
          mediaVariant={isPostDetailOpen || mainMediaItems.length === 0 ? "full" : "compact"}
        />
      ) : null}

      {showTags ? <PostBookmarkTags tags={item.tags} /> : null}

      {showTimestamp && !showAuthor ? <PostBookmarkStandaloneTimestamp post={post} /> : null}
    </>
  );

  return (
    <article
      onClick={onOpenDetail ? handleOpenDetail : undefined}
      className={cn(
        "border-border group relative isolate flex flex-col gap-[14px] px-4",
        postListSelectionInsetClass,
        "transition-colors duration-50",
        !isPostDetailOpen && "cursor-pointer",
        isSelected && "bg-muted",
        className,
        isPostDetailOpen ? "pt-0 pb-10" : "hover:bg-muted/75 border-b py-4 pt-5",
      )}>
      <div className="pointer-events-none absolute inset-0 z-[2] opacity-0 transition-opacity duration-200 group-data-[selection-mode=true]/bookmark-row:opacity-100" />

      <PostBookmarkExternalOverlayLink
        item={item}
        userName={user.user_name}
        onOpenDetail={onOpenDetail}
        isPostDetailOpen={isPostDetailOpen}
      />

      <PostBookmarkRowActions
        item={item}
        onDismiss={onDismiss}
        onOpenMenu={onOpenMenu}
        onSave={onSave}
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

      {showAuthor && isPostDetailOpen ? (
        <PostBookmarkDetailAuthorLayout
          item={item}
          user={user}
          profileUrl={authorProfileUrl}
          selectionSlot={authorSelectionCheckbox}
          replyChain={replyChain}
          showMedia={showMedia}
          postBodyContent={postBodyContent}
        />
      ) : null}

      {showAuthor && !isPostDetailOpen ? (
        <PostBookmarkListAuthorLayout
          user={user}
          post={post}
          profileUrl={authorProfileUrl}
          selectionSlot={authorSelectionCheckbox}
          showTimestamp={showTimestamp}
          postBodyContent={postBodyContent}
        />
      ) : null}

      {!showAuthor ? (
        <PostBookmarkNoAuthorLayout
          item={item}
          replyChain={replyChain}
          showMedia={showMedia}
          isPostDetailOpen={isPostDetailOpen}
          postBodyContent={postBodyContent}
        />
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

function PostBookmarkDetailAuthorLayout({
  item,
  postBodyContent,
  profileUrl,
  replyChain,
  selectionSlot,
  showMedia,
  user,
}: {
  item: PostBookmark;
  postBodyContent: ReactNode;
  profileUrl: string;
  replyChain: FreebirdXPostResponse[];
  selectionSlot: ReactNode;
  showMedia: boolean;
  user: PostBookmarkUser;
}) {
  return (
    <div className="relative z-[1] flex flex-col gap-5">
      <PostBookmarkReplyChain item={item} replies={replyChain} showMedia={showMedia} />

      <div className="flex flex-col gap-[14px]">
        <PostBookmarkAuthorStack
          user={user}
          profileUrl={profileUrl}
          className="pr-10"
          selectionSlot={selectionSlot}
        />

        <div className="min-w-0 flex-1 space-y-[14px]">{postBodyContent}</div>
      </div>
    </div>
  );
}

function PostBookmarkListAuthorLayout({
  post,
  postBodyContent,
  profileUrl,
  selectionSlot,
  showTimestamp,
  user,
}: {
  post: FreebirdXPost;
  postBodyContent: ReactNode;
  profileUrl: string;
  selectionSlot: ReactNode;
  showTimestamp: boolean;
  user: PostBookmarkUser;
}) {
  return (
    <div className="relative z-[1] grid grid-cols-[40px_minmax(0,1fr)] gap-x-2">
      <PostBookmarkAuthorAvatar user={user} profileUrl={profileUrl} selectionSlot={selectionSlot} />

      <div className="min-w-0 space-y-0.5">
        <PostBookmarkAuthorLine
          user={user}
          profileUrl={profileUrl}
          timestampEpoch={post.date_epoch}
          showTimestamp={showTimestamp}
          className="pr-10 text-[15px] leading-5"
        />

        {postBodyContent}
      </div>
    </div>
  );
}

function PostBookmarkNoAuthorLayout({
  isPostDetailOpen,
  item,
  postBodyContent,
  replyChain,
  showMedia,
}: {
  isPostDetailOpen: boolean;
  item: PostBookmark;
  postBodyContent: ReactNode;
  replyChain: FreebirdXPostResponse[];
  showMedia: boolean;
}) {
  return (
    <div className="relative z-[1] min-w-0 flex-1 space-y-5">
      {isPostDetailOpen ? (
        <PostBookmarkReplyChain item={item} replies={replyChain} showMedia={showMedia} />
      ) : null}
      {postBodyContent}
    </div>
  );
}

function PostBookmarkExternalOverlayLink({
  isPostDetailOpen,
  item,
  onOpenDetail,
  userName,
}: {
  isPostDetailOpen: boolean;
  item: PostBookmark;
  onOpenDetail?: (item: PostBookmark) => void;
  userName: string;
}) {
  if (onOpenDetail || isPostDetailOpen) return null;

  return (
    <Link
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute inset-0 z-0"
      aria-label={`Open post by ${userName}`}
      tabIndex={-1}
    />
  );
}

function PostBookmarkRowActions({
  item,
  onDismiss,
  onOpenMenu,
  onSave,
}: {
  item: PostBookmark;
  onDismiss?: (item: PostBookmark) => void;
  onOpenMenu?: (item: PostBookmark) => void;
  onSave?: (item: PostBookmark) => void;
}) {
  return (
    <BookmarkHoverActions
      className="top-2.5 right-3 z-[3]"
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
  );
}

function PostBookmarkReplyingTo({
  isPostDetailOpen,
  post,
}: {
  isPostDetailOpen: boolean;
  post: FreebirdXPost;
}) {
  if (!post.replyingTo || isPostDetailOpen) return null;

  return (
    <p className="text-x-secondary text-[14px]">
      Replying to{" "}
      <Link
        href={`https://x.com/${post.replyingTo}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline">
        @{post.replyingTo}
      </Link>
    </p>
  );
}

function PostBookmarkTags({tags}: {tags: string[] | null | undefined}) {
  if (!tags?.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Tag key={tag} displayHash={false} size="md" variant="outline">
          # {tag}
        </Tag>
      ))}
    </div>
  );
}

function PostBookmarkStandaloneTimestamp({post}: {post: FreebirdXPost}) {
  return (
    <div className="text-x-secondary flex items-center gap-3 text-[14px]">
      {formatPostFullDate(post.date_epoch)}
    </div>
  );
}

function PostBookmarkPostText({
  isExpanded,
  onExpandOriginal,
  preparedText,
  preparedTranslationText,
  translationToggle,
  wrap = true,
}: {
  isExpanded: boolean;
  onExpandOriginal?: () => void;
  preparedText: PreparedText;
  preparedTranslationText: PreparedText;
  translationToggle: TranslationToggle;
  wrap?: boolean;
}) {
  const showTranslationMore =
    translationToggle.isTranslated &&
    preparedTranslationText.isLongText &&
    !translationToggle.isTranslationExpanded;
  const showOriginalMore =
    !isExpanded && preparedText.isLongText && !translationToggle.isTranslated && onExpandOriginal;

  const content = (
    <>
      {translationToggle.hasTranslation ? (
        <PostTranslationLabel
          sourceLanguage={translationToggle.sourceLanguage}
          showOriginal={translationToggle.showOriginal}
          provider={translationToggle.provider}
          onToggle={translationToggle.toggleOriginal}
        />
      ) : null}
      <PostBookmarkPostTextParagraph
        preparedText={preparedText}
        preparedTranslationText={preparedTranslationText}
        translationToggle={translationToggle}
      />
      {showTranslationMore ? (
        <PostBookmarkShowMoreButton onClick={translationToggle.expandTranslation} />
      ) : null}
      {showOriginalMore ? <PostBookmarkShowMoreButton onClick={onExpandOriginal} /> : null}
    </>
  );

  if (!wrap) return content;

  return <div>{content}</div>;
}

function PostBookmarkPostTextParagraph({
  preparedText,
  preparedTranslationText,
  translationToggle,
}: {
  preparedText: PreparedText;
  preparedTranslationText: PreparedText;
  translationToggle: TranslationToggle;
}) {
  if (translationToggle.isTranslated) {
    return (
      <p className="text-foreground text-[15px] whitespace-pre-wrap">
        <PostBookmarkText preparedText={preparedTranslationText} />
      </p>
    );
  }

  if (!preparedText.hasText) return null;

  return (
    <p className="text-foreground text-[15px] whitespace-pre-wrap">
      <PostBookmarkText preparedText={preparedText} />
    </p>
  );
}

function PostBookmarkShowMoreButton({onClick}: {onClick: () => void}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mt-0.5 block cursor-pointer text-[15px] leading-[18px] text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline focus:outline-none">
      Show more
    </button>
  );
}

function PostBookmarkReplyChain({
  item,
  replies,
  showMedia,
}: {
  item: PostBookmark;
  replies: FreebirdXPostResponse[];
  showMedia: boolean;
}) {
  if (!replies.length) {
    return null;
  }

  return (
    <div className="space-y-5">
      {replies.map((reply) => (
        <PostBookmarkReplyChainPost
          key={reply.post.tweetID}
          item={item}
          reply={reply}
          showMedia={showMedia}
        />
      ))}
    </div>
  );
}

function PostBookmarkReplyChainPost({
  item,
  reply,
  showMedia,
}: {
  item: PostBookmark;
  reply: FreebirdXPostResponse;
  showMedia: boolean;
}) {
  const replyProfileUrl = `https://x.com/${reply.user.user_screen_name}`;
  const preparedText = preparePostBookmarkText(reply.post);
  const translationToggle = useTranslationToggle(reply.post, {initialTranslationExpanded: true});
  const preparedTranslationText = preparePostBookmarkTranslationText(reply.post, {
    expanded: translationToggle.isTranslationExpanded,
  });
  const mediaItems = getPostBookmarkReplyMediaPreviewItems(item, reply.post.tweetID, "list");

  return (
    <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3">
      <div className="relative after:absolute after:top-12 after:bottom-[-12px] after:left-[19px] after:w-0.5 after:bg-[#CFD9DE]">
        <PostBookmarkAuthorAvatar user={reply.user} profileUrl={replyProfileUrl} />
      </div>

      <div className="min-w-0 space-y-0.5">
        <PostBookmarkAuthorLine
          user={reply.user}
          profileUrl={replyProfileUrl}
          timestampEpoch={reply.post.date_epoch}
          showTimestamp
          className="text-[15px] leading-5"
        />

        <PostBookmarkPostText
          isExpanded
          preparedText={preparedText}
          preparedTranslationText={preparedTranslationText}
          translationToggle={translationToggle}
          wrap={false}
        />

        {showMedia && reply.post.card ? <PostBookmarkExternalCard card={reply.post.card} /> : null}

        {showMedia ? <PostBookmarkMediaPreviewGrid media={mediaItems} /> : null}
      </div>
    </div>
  );
}
