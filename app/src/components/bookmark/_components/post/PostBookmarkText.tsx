"use client";

import {Fragment} from "react";
import Link from "next/link";

import type {FreebirdXPost, FreebirdXPostCommunity, FreebirdXPostUrlEntity} from "@/lib/fetch/post";

const LINK_CLASS_NAME =
  "text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline";

type PreparedTextPart =
  | {
      text: string;
      type: "text";
    }
  | {
      href: string;
      key: string;
      text: string;
      type: "hashtag" | "mention" | "url";
    };

type PreparedEntity =
  | {
      end: number;
      entity: FreebirdXPostUrlEntity;
      start: number;
      type: "url";
    }
  | {
      end: number;
      href: string;
      key: string;
      start: number;
      text: string;
      type: "hashtag" | "mention";
    };

type CodePointRange = [number, number];

export type PreparedPostBookmarkText = {
  hasText: boolean;
  isLongText: boolean;
  parts: PreparedTextPart[];
  text: string;
};

export type PostReplyingToMention = {
  href: string;
  key: string;
  screenName: string;
};

type PreparePostBookmarkTextOptions = {
  expanded?: boolean;
  maxLength?: number;
};

type PostBookmarkTextProps = {
  expanded?: boolean;
  maxLength?: number;
  post?: FreebirdXPost;
  preparedText?: PreparedPostBookmarkText;
};

type HiddenUrlContext = {
  cardDomain?: string;
  cardUrl?: string;
  hiddenAttachmentUrls: string[];
  hasMedia: boolean;
  postText: string;
};

export function preparePostBookmarkText(
  post: FreebirdXPost,
  {expanded = true, maxLength}: PreparePostBookmarkTextOptions = {},
): PreparedPostBookmarkText {
  const text = post.text ?? "";
  const textLength = Array.from(text).length;
  const displayRange = getDisplayRange(post.display_text_range, textLength);
  const entities = getDisplayEntities(post, displayRange);
  const parts = trimTextPartsEnd(buildTextParts(post, displayRange, entities));
  const fullText = getPartsText(parts);
  const isLongText = maxLength != null && getCodePointLength(fullText) > maxLength;
  const visibleParts =
    !expanded && isLongText
      ? truncateTextParts(parts, getTruncatedLength(fullText, maxLength))
      : parts;
  const visibleText = getPartsText(visibleParts);

  return {
    hasText: visibleText.length > 0,
    isLongText,
    parts: visibleParts,
    text: visibleText,
  };
}

export function PostBookmarkText({
  expanded = true,
  maxLength,
  post,
  preparedText,
}: PostBookmarkTextProps) {
  const text = preparedText ?? (post ? preparePostBookmarkText(post, {expanded, maxLength}) : null);
  if (!text) return null;

  return <>{text.parts.map((part, index) => renderTextPart(part, index))}</>;
}

export function getPostReplyingToMentions(post: FreebirdXPost): PostReplyingToMention[] {
  const textLength = Array.from(post.text ?? "").length;
  const [displayStart] = getDisplayRange(post.display_text_range, textLength);

  if (displayStart <= 0) return [];

  return (post.entities?.user_mentions ?? [])
    .filter((mention) => {
      const [, end] = mention.indices ?? [];
      return mention.screen_name && end != null && end <= displayStart;
    })
    .map((mention) => ({
      href: `https://x.com/${encodeURIComponent(mention.screen_name ?? "")}`,
      key: `${mention.id_str ?? mention.screen_name}-${mention.indices?.join("-")}`,
      screenName: mention.screen_name ?? "",
    }));
}

function getDisplayEntities(post: FreebirdXPost, displayRange: CodePointRange): PreparedEntity[] {
  const entities: PreparedEntity[] = [];
  const hashtagBaseUrl = getHashtagBaseUrl(post.community);

  for (const entity of post.entities?.urls ?? []) {
    const range = getEntityRange(entity.indices, displayRange);
    if (!range) continue;

    entities.push({
      end: range[1],
      entity,
      start: range[0],
      type: "url",
    });
  }

  for (const tag of post.hashtags ?? []) {
    const range = getEntityRange(tag.indices, displayRange);
    if (!range) continue;

    entities.push({
      end: range[1],
      href: `${hashtagBaseUrl}/hashtag/${encodeURIComponent(tag.text)}`,
      key: `hashtag-${range[0]}-${range[1]}`,
      start: range[0],
      text: sliceCodePoints(post.text, range[0], range[1]),
      type: "hashtag",
    });
  }

  for (const mention of post.entities?.user_mentions ?? []) {
    if (!mention.indices || !mention.screen_name) continue;

    const range = getEntityRange(mention.indices, displayRange);
    if (!range) continue;

    entities.push({
      end: range[1],
      href: `https://x.com/${encodeURIComponent(mention.screen_name)}`,
      key: `mention-${range[0]}-${range[1]}`,
      start: range[0],
      text: sliceCodePoints(post.text, range[0], range[1]),
      type: "mention",
    });
  }

  return entities.sort((a, b) => a.start - b.start || b.end - a.end);
}

function buildTextParts(
  post: FreebirdXPost,
  displayRange: CodePointRange,
  entities: PreparedEntity[],
): PreparedTextPart[] {
  const parts: PreparedTextPart[] = [];
  const hiddenUrlContext = getHiddenUrlContext(post);
  let cursor = displayRange[0];

  for (const entity of entities) {
    if (entity.start < cursor) continue;
    if (entity.start >= displayRange[1] || entity.end > displayRange[1]) continue;

    pushTextPart(parts, sliceCodePoints(post.text, cursor, entity.start));
    pushEntityPart(parts, hiddenUrlContext, entity);

    cursor = entity.end;
  }

  pushTextPart(parts, sliceCodePoints(post.text, cursor, displayRange[1]));

  return linkPlainUrls(hiddenUrlContext, parts);
}

function renderTextPart(part: PreparedTextPart, index: number) {
  if (part.type === "text") {
    return <Fragment key={`text-${index}`}>{part.text}</Fragment>;
  }

  return (
    <Link
      key={part.key}
      href={part.href}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS_NAME}
      onClick={(e) => e.stopPropagation()}>
      {part.text}
    </Link>
  );
}

function pushEntityPart(
  parts: PreparedTextPart[],
  hiddenUrlContext: HiddenUrlContext,
  entity: PreparedEntity,
) {
  const part = getEntityPart(hiddenUrlContext, entity);
  if (part) parts.push(part);
}

function getEntityPart(
  hiddenUrlContext: HiddenUrlContext,
  entity: PreparedEntity,
): PreparedTextPart | null {
  if (entity.type !== "url") {
    return {
      href: entity.href,
      key: entity.key,
      text: entity.text,
      type: entity.type,
    };
  }

  if (shouldRemoveUrlEntity(hiddenUrlContext, entity.entity, entity.end)) {
    return null;
  }

  return {
    href: entity.entity.expanded_url || entity.entity.url,
    key: `url-${entity.start}-${entity.end}`,
    text: getUrlDisplayText(entity.entity),
    type: "url",
  };
}

function getUrlDisplayText(entity: FreebirdXPostUrlEntity) {
  if (entity.display_url) return entity.display_url;

  return (entity.expanded_url || entity.url).replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function shouldRemoveUrlEntity(
  hiddenUrlContext: HiddenUrlContext,
  entity: FreebirdXPostUrlEntity,
  end: number,
) {
  if (hasAnyMatchingUrl(hiddenUrlContext.hiddenAttachmentUrls, getUrlEntityCandidates(entity))) {
    return true;
  }

  if (hasAnyMatchingUrl(getCardUrlCandidates(hiddenUrlContext), getUrlEntityCandidates(entity))) {
    return isTrailingUrl(hiddenUrlContext.postText, end);
  }

  return isMediaUrlEntity(entity);
}

function getHiddenUrlContext(post: FreebirdXPost): HiddenUrlContext {
  return {
    cardDomain: post.card?.domain,
    cardUrl: post.card?.url,
    hasMedia: post.hasMedia,
    hiddenAttachmentUrls: getHiddenAttachmentUrls(post),
    postText: post.text,
  };
}

function getHiddenAttachmentUrls(post: FreebirdXPost) {
  return compactUrls([
    post.qrtURL,
    post.retweetURL,
    post.combinedMediaUrl,
    ...(post.mediaURLs ?? []),
    ...(post.media_extended ?? []).map((media) => media.url),
    ...getArticleAttachmentUrls(post),
  ]);
}

function getArticleAttachmentUrls(post: FreebirdXPost) {
  const articlePath = getArticlePath(post);
  if (!articlePath) return [];

  return [
    ...getArticleEntityUrls(post, articlePath),
    `https://x.com${articlePath}`,
    `http://x.com${articlePath}`,
    `https://twitter.com${articlePath}`,
    `http://twitter.com${articlePath}`,
  ];
}

function getArticlePath(post: FreebirdXPost) {
  const articleId = post.article?.rest_id;
  return articleId ? `/i/article/${articleId}` : null;
}

function getArticleEntityUrls(post: FreebirdXPost, articlePath: string) {
  return (post.entities?.urls ?? [])
    .filter((entity) =>
      getUrlEntityCandidates(entity).some((url) => isArticleUrl(url, articlePath)),
    )
    .flatMap((entity) => getUrlEntityCandidates(entity));
}

function isArticleUrl(url: string, articlePath: string) {
  return url.toLowerCase().includes(articlePath.toLowerCase());
}

function isMediaUrlEntity(entity: FreebirdXPostUrlEntity) {
  const displayUrl = entity.display_url.toLowerCase();
  if (displayUrl.startsWith("pic.x.com/") || displayUrl.startsWith("pic.twitter.com/")) {
    return true;
  }

  return [entity.expanded_url, entity.url].some((url) => isXMediaUrl(url));
}

function getUrlEntityCandidates(entity: FreebirdXPostUrlEntity) {
  return [entity.url, entity.expanded_url, entity.display_url];
}

function getCardUrlCandidates({cardDomain, cardUrl}: HiddenUrlContext) {
  return compactUrls([
    cardUrl,
    cardDomain,
    cardDomain ? `https://${cardDomain}` : null,
    cardDomain ? `http://${cardDomain}` : null,
  ]);
}

function linkPlainUrls(
  hiddenUrlContext: HiddenUrlContext,
  parts: PreparedTextPart[],
): PreparedTextPart[] {
  const nextParts: PreparedTextPart[] = [];

  for (const part of parts) {
    if (part.type !== "text") {
      nextParts.push(part);
      continue;
    }

    let cursor = 0;

    for (const match of part.text.matchAll(/https?:\/\/[^\s]+/g)) {
      const url = match[0];
      const start = match.index;
      if (start == null) continue;

      pushTextPart(nextParts, part.text.slice(cursor, start));
      if (!shouldRemovePlainUrl(hiddenUrlContext, url, part.text, start + url.length)) {
        nextParts.push({
          href: url,
          key: `plain-url-${nextParts.length}-${start}`,
          text: url,
          type: "url",
        });
      }
      cursor = start + url.length;
    }

    pushTextPart(nextParts, part.text.slice(cursor));
  }

  return nextParts;
}

function shouldRemovePlainUrl(
  hiddenUrlContext: HiddenUrlContext,
  url: string,
  text: string,
  end: number,
) {
  if (hasMatchingUrl(hiddenUrlContext.hiddenAttachmentUrls, url)) {
    return true;
  }

  if (hasMatchingUrl(getCardUrlCandidates(hiddenUrlContext), url)) {
    return isTrailingUrl(text, end);
  }

  return hiddenUrlContext.hasMedia && (isShortXUrl(url) || isXMediaUrl(url));
}

function isTrailingUrl(text: string, end: number) {
  return sliceCodePoints(text, end, getCodePointLength(text)).trim().length === 0;
}

function isShortXUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase() === "t.co";
  } catch {
    return false;
  }
}

function isXMediaUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    return (
      (host === "x.com" ||
        host.endsWith(".x.com") ||
        host === "twitter.com" ||
        host.endsWith(".twitter.com")) &&
      (path.includes("/photo/") || path.includes("/video/"))
    );
  } catch {
    return false;
  }
}

function getDisplayRange(
  range: CodePointRange | null | undefined,
  textLength: number,
): CodePointRange {
  if (!range) return [0, textLength];

  const [start, end] = range;
  if (start < 0 || end < start || start > textLength) {
    return [0, textLength];
  }

  // Freebird uses note_tweet text when present, while display_text_range still
  // comes from the legacy preview. Keep the start for reply-prefix removal,
  // but preserve the full tail so long posts can trigger Show more.
  return [start, textLength];
}

function getEntityRange(
  range: CodePointRange,
  [displayStart, displayEnd]: CodePointRange,
): CodePointRange | null {
  const [start, end] = range;
  if (start < displayStart || end > displayEnd || end <= start) return null;

  return [start, end];
}

function getHashtagBaseUrl(community?: FreebirdXPostCommunity | null) {
  if (community?.isCommunityPost && community.id) {
    return `https://x.com/i/communities/${community.id}`;
  }

  return "https://x.com";
}

function hasMatchingUrl(urls: string[], candidate: string) {
  const normalizedCandidate = normalizeUrlForCompare(candidate);

  return urls.some((url) => normalizeUrlForCompare(url) === normalizedCandidate);
}

function hasAnyMatchingUrl(urls: string[], candidates: string[]) {
  return candidates.some((candidate) => hasMatchingUrl(urls, candidate));
}

function compactUrls(urls: Array<string | null | undefined>) {
  return urls.filter((url): url is string => Boolean(url));
}

function normalizeUrlForCompare(url: string) {
  return url.trim().replace(/\/$/, "");
}

function trimTextPartsEnd(parts: PreparedTextPart[]): PreparedTextPart[] {
  const nextParts = [...parts];

  while (nextParts.length > 0) {
    const last = nextParts[nextParts.length - 1];

    if (last.type !== "text") break;

    const text = last.text.replace(/\s+$/, "");
    if (text) {
      nextParts[nextParts.length - 1] = {...last, text};
      break;
    }

    nextParts.pop();
  }

  return nextParts;
}

function truncateTextParts(parts: PreparedTextPart[], length: number): PreparedTextPart[] {
  const nextParts: PreparedTextPart[] = [];
  let remaining = length;

  for (const part of parts) {
    if (remaining <= 0) break;

    const partLength = getCodePointLength(part.text);
    if (partLength <= remaining) {
      nextParts.push(part);
      remaining -= partLength;
      continue;
    }

    nextParts.push({
      ...part,
      text: sliceCodePoints(part.text, 0, remaining).trimEnd(),
    });
    break;
  }

  return trimTextPartsEnd(nextParts);
}

function getTruncatedLength(text: string, maxLength: number) {
  const truncated = sliceCodePoints(text, 0, maxLength);
  const lastWhitespace = Math.max(truncated.lastIndexOf(" "), truncated.lastIndexOf("\n"));

  return lastWhitespace > 0 ? getCodePointLength(truncated.slice(0, lastWhitespace)) : maxLength;
}

function getPartsText(parts: PreparedTextPart[]) {
  return parts.map((part) => part.text).join("");
}

function pushTextPart(parts: PreparedTextPart[], text: string) {
  if (!text) return;

  const last = parts[parts.length - 1];
  if (last?.type === "text") {
    last.text += text;
    return;
  }

  parts.push({text, type: "text"});
}

function sliceCodePoints(text: string, start: number, end: number) {
  return Array.from(text).slice(start, end).join("");
}

function getCodePointLength(text: string) {
  return Array.from(text).length;
}
