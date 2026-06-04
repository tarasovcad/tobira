"use client";

import {Fragment} from "react";

import type {FreebirdXPostResponse} from "@/lib/fetch/post";
import type {PostBookmarkPreviewItem} from "../../_utils/post-bookmark-preview";
import {
  getPostReplyingToMentions,
  preparePostBookmarkText,
  type PostReplyingToMention,
} from "./PostBookmarkText";
import {PostBookmarkAuthorAvatar, PostBookmarkAuthorLine} from "./PostBookmarkAuthor";
import PostBookmarkArticlePreview from "./PostBookmarkArticlePreview";
import {
  PostBookmarkQuotedCompactMediaGrid,
  PostBookmarkQuotedFullMediaGrid,
} from "./PostBookmarkQuotedMediaGrid";
import {cn} from "@/lib/utils";

type PostBookmarkQuotedPostProps = {
  articlePreviewItem: PostBookmarkPreviewItem | null;
  mediaItems: PostBookmarkPreviewItem[];
  mediaVariant: "compact" | "full";
  post: FreebirdXPostResponse;
};

export default function PostBookmarkQuotedPost({
  articlePreviewItem,
  mediaItems,
  mediaVariant,
  post,
}: PostBookmarkQuotedPostProps) {
  const preparedText = preparePostBookmarkText(post.post);
  const replyingToMentions = getPostReplyingToMentions(post.post);
  const authorProfileUrl = `https://x.com/${post.user.user_screen_name}`;
  const hasTextContent = replyingToMentions.length > 0 || preparedText.hasText;
  const hasArticle = Boolean(post.post.article);

  return (
    <div className="hover:bg-muted mt-2 rounded-2xl border border-[#CFD9DE]">
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
            <div className="flex items-start gap-3">
              <PostBookmarkQuotedCompactMediaGrid media={mediaItems} />
              {hasTextContent ? (
                <div className="max-w-full min-w-0">
                  <PostBookmarkQuotedReplyingTo mentions={replyingToMentions} />
                  {preparedText.hasText ? (
                    <p className="text-foreground mt-2 line-clamp-5 text-[15px] leading-[19px] wrap-break-word whitespace-pre-wrap">
                      {preparedText.text}
                    </p>
                  ) : null}
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
              <PostBookmarkQuotedReplyingTo mentions={replyingToMentions} />
              {preparedText.hasText ? (
                <p className="text-foreground line-clamp-5 text-[15px] leading-[19px] wrap-break-word whitespace-pre-wrap">
                  {preparedText.text}
                </p>
              ) : null}
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
          <PostBookmarkQuotedFullMediaGrid media={mediaItems} />
        </div>
      )}
    </div>
  );
}

function PostBookmarkQuotedReplyingTo({mentions}: {mentions: PostReplyingToMention[]}) {
  if (!mentions.length) return null;

  return (
    <p className="text-[14px] leading-[18px] text-[#536471]">
      Replying to{" "}
      {mentions.map((mention, index) => (
        <Fragment key={mention.key}>
          {index > 0 ? (index === mentions.length - 1 ? " and " : " ") : null}@{mention.screenName}
        </Fragment>
      ))}
    </p>
  );
}
