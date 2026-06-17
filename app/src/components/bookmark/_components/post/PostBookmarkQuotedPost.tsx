"use client";

import {Fragment} from "react";

import type {FreebirdXPostResponse} from "@/lib/fetch/post";
import type {
  PostBookmarkMediaGalleryEntry,
  PostBookmarkPreviewItem,
} from "../../_utils/post-bookmark-preview";
import {
  getPostReplyingToMentions,
  PostBookmarkText,
  preparePostBookmarkText,
  preparePostBookmarkTranslationText,
  type PreparedPostBookmarkText,
  type PostReplyingToMention,
} from "./PostBookmarkText";
import {useTranslationToggle, PostTranslationLabel} from "./PostBookmarkTranslation";
import {PostBookmarkAuthorAvatar, PostBookmarkAuthorLine} from "./PostBookmarkAuthor";
import PostBookmarkArticlePreview from "./PostBookmarkArticlePreview";
import {
  PostBookmarkQuotedCompactMediaGrid,
  PostBookmarkQuotedFullMediaGrid,
} from "./PostBookmarkQuotedMediaGrid";
import {cn} from "@/lib/utils";

type PostBookmarkQuotedPostProps = {
  articlePreviewItem: PostBookmarkPreviewItem | null;
  isPostDetailOpen?: boolean;
  mediaGalleryEntries?: PostBookmarkMediaGalleryEntry[];
  mediaItems: PostBookmarkPreviewItem[];
  mediaVariant: "compact" | "full";
  post: FreebirdXPostResponse;
};

type TranslationToggle = ReturnType<typeof useTranslationToggle>;
type QuotedTextVariant = "compact" | "full";

export default function PostBookmarkQuotedPost({
  articlePreviewItem,
  isPostDetailOpen = false,
  mediaGalleryEntries,
  mediaItems,
  mediaVariant,
  post,
}: PostBookmarkQuotedPostProps) {
  const preparedText = preparePostBookmarkText(post.post);
  const translationToggle = useTranslationToggle(post.post, {
    initialTranslationExpanded: isPostDetailOpen,
  });
  const preparedTranslationText = preparePostBookmarkTranslationText(post.post, {
    expanded: translationToggle.isTranslationExpanded,
  });
  const replyingToMentions = getPostReplyingToMentions(post.post);
  const authorProfileUrl = `https://x.com/${post.user.user_screen_name}`;
  const hasTextContent =
    replyingToMentions.length > 0 || preparedText.hasText || preparedTranslationText.hasText;
  const hasArticle = Boolean(post.post.article);

  return (
    <div className="hover:bg-muted border-x-secondary/15 mt-2 overflow-hidden rounded-2xl border">
      <div className="flex min-w-0 items-center gap-2 px-3 pt-3 text-[14px] leading-5">
        <PostBookmarkAuthorAvatar user={post.user} profileUrl={authorProfileUrl} size="sm" />
        <PostBookmarkAuthorLine
          user={post.user}
          profileUrl={authorProfileUrl}
          timestampEpoch={post.post.date_epoch}
          showTimestamp
        />
      </div>

      {mediaVariant === "compact" ? (
        <div className="mt-1.5 px-3 pb-3">
          {mediaItems.length > 0 || hasTextContent ? (
            <div className="mt-2 flex items-start gap-3">
              <PostBookmarkQuotedCompactMediaGrid
                media={mediaItems}
                galleryEntries={mediaGalleryEntries}
              />
              {hasTextContent ? (
                <div className="max-w-full min-w-0">
                  <PostBookmarkQuotedTextContent
                    variant="compact"
                    replyingToMentions={replyingToMentions}
                    preparedText={preparedText}
                    preparedTranslationText={preparedTranslationText}
                    translationToggle={translationToggle}
                    isPostDetailOpen={isPostDetailOpen}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          {hasArticle ? (
            <PostBookmarkArticlePreview
              post={post.post}
              className={mediaItems.length > 0 || hasTextContent ? "mt-3" : "mt-0"}
              fallbackHref={post.post.tweetURL}
              previewItem={articlePreviewItem}
            />
          ) : null}
        </div>
      ) : (
        <div className="mt-1.5">
          {hasTextContent ? (
            <div className={cn("max-w-full min-w-0 px-3", mediaItems.length === 0 && "pb-4")}>
              <PostBookmarkQuotedTextContent
                variant="full"
                replyingToMentions={replyingToMentions}
                preparedText={preparedText}
                preparedTranslationText={preparedTranslationText}
                translationToggle={translationToggle}
                isPostDetailOpen={isPostDetailOpen}
              />
            </div>
          ) : null}
          {hasArticle ? (
            <div className="px-3">
              <PostBookmarkArticlePreview
                post={post.post}
                fallbackHref={post.post.tweetURL}
                previewItem={articlePreviewItem}
              />
            </div>
          ) : null}
          <PostBookmarkQuotedFullMediaGrid
            media={mediaItems}
            galleryEntries={mediaGalleryEntries}
          />
        </div>
      )}
    </div>
  );
}

function PostBookmarkQuotedTextContent({
  isPostDetailOpen,
  preparedText,
  preparedTranslationText,
  replyingToMentions,
  translationToggle,
  variant,
}: {
  isPostDetailOpen: boolean;
  preparedText: PreparedPostBookmarkText;
  preparedTranslationText: PreparedPostBookmarkText;
  replyingToMentions: PostReplyingToMention[];
  translationToggle: TranslationToggle;
  variant: QuotedTextVariant;
}) {
  const isCompact = variant === "compact";

  return (
    <>
      <PostBookmarkQuotedReplyingTo mentions={replyingToMentions} />
      {translationToggle.hasTranslation ? (
        <PostTranslationLabel
          sourceLanguage={translationToggle.sourceLanguage}
          showOriginal={translationToggle.showOriginal}
          provider={translationToggle.provider}
          className={isCompact ? "my-0!" : "my-1!"}
          displayButton={false}
          onToggle={translationToggle.toggleOriginal}
        />
      ) : null}
      <PostBookmarkQuotedTextParagraph
        isCompact={isCompact}
        isPostDetailOpen={isPostDetailOpen}
        preparedText={preparedText}
        preparedTranslationText={preparedTranslationText}
        translationToggle={translationToggle}
      />
      {!isCompact &&
      translationToggle.isTranslated &&
      preparedTranslationText.isLongText &&
      !translationToggle.isTranslationExpanded ? (
        <button
          type="button"
          onClick={translationToggle.expandTranslation}
          className="-mt-0.5 block cursor-pointer text-[15px] leading-[18px] text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline focus:outline-none">
          Show more
        </button>
      ) : null}
    </>
  );
}

function PostBookmarkQuotedTextParagraph({
  isCompact,
  isPostDetailOpen,
  preparedText,
  preparedTranslationText,
  translationToggle,
}: {
  isCompact: boolean;
  isPostDetailOpen: boolean;
  preparedText: PreparedPostBookmarkText;
  preparedTranslationText: PreparedPostBookmarkText;
  translationToggle: TranslationToggle;
}) {
  const shouldClampTranslation = !translationToggle.isTranslationExpanded && !isPostDetailOpen;

  if (translationToggle.isTranslated) {
    return (
      <p
        className={cn(
          "text-foreground text-[15px] leading-[19px] wrap-break-word whitespace-pre-wrap",
          isCompact && "mt-1",
          shouldClampTranslation && "line-clamp-5",
        )}>
        <PostBookmarkText preparedText={preparedTranslationText} />
      </p>
    );
  }

  if (!preparedText.hasText) {
    return null;
  }

  return (
    <p
      className={cn(
        "text-foreground text-[15px] leading-[19px] wrap-break-word whitespace-pre-wrap",
        !isPostDetailOpen && "line-clamp-5",
      )}>
      {preparedText.text}
    </p>
  );
}

function PostBookmarkQuotedReplyingTo({mentions}: {mentions: PostReplyingToMention[]}) {
  if (!mentions.length) return null;

  return (
    <p className="text-x-secondary text-[14px] leading-[18px]">
      Replying to{" "}
      {mentions.map((mention, index) => (
        <Fragment key={mention.key}>
          {index > 0 ? (index === mentions.length - 1 ? " and " : " ") : null}@{mention.screenName}
        </Fragment>
      ))}
    </p>
  );
}
