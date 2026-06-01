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
  const displayParts =
    !expanded && isLongText
      ? truncateTextParts(parts, getTruncatedLength(fullText, maxLength))
      : parts;
  const displayText = getPartsText(displayParts);

  return {
    hasText: displayText.length > 0,
    isLongText,
    parts: displayParts,
    text: displayText,
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

  return (
    <>
      {text.parts.map((part, index) => {
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
      })}
    </>
  );
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
  let cursor = displayRange[0];

  for (const entity of entities) {
    if (entity.start < cursor) continue;
    if (entity.start >= displayRange[1] || entity.end > displayRange[1]) continue;

    pushTextPart(parts, sliceCodePoints(post.text, cursor, entity.start));

    if (entity.type === "url") {
      const urlPart = getUrlPart(post, entity.entity, entity.start, entity.end);
      if (urlPart) parts.push(urlPart);
    } else {
      parts.push({
        href: entity.href,
        key: entity.key,
        text: entity.text,
        type: entity.type,
      });
    }

    cursor = entity.end;
  }

  pushTextPart(parts, sliceCodePoints(post.text, cursor, displayRange[1]));

  return linkPlainUrls(parts);
}

function getUrlPart(
  post: FreebirdXPost,
  entity: FreebirdXPostUrlEntity,
  start: number,
  end: number,
): PreparedTextPart | null {
  if (shouldRemoveUrlEntity(post, entity)) return null;

  const href = entity.expanded_url || entity.url;

  return {
    href,
    key: `url-${start}-${end}`,
    text: href,
    type: "url",
  };
}

function shouldRemoveUrlEntity(post: FreebirdXPost, entity: FreebirdXPostUrlEntity) {
  const hiddenUrls = getHiddenAttachmentUrls(post);
  const candidates = [entity.url, entity.expanded_url, entity.display_url];

  if (candidates.some((url) => hasMatchingUrl(hiddenUrls, url))) {
    return true;
  }

  return isMediaUrlEntity(entity);
}

function getHiddenAttachmentUrls(post: FreebirdXPost) {
  return [
    post.card?.url,
    post.qrtURL,
    post.retweetURL,
    post.combinedMediaUrl,
    ...(post.mediaURLs ?? []),
    ...(post.media_extended ?? []).map((media) => media.url),
  ].filter((url): url is string => Boolean(url));
}

function isMediaUrlEntity(entity: FreebirdXPostUrlEntity) {
  const displayUrl = entity.display_url.toLowerCase();
  if (displayUrl.startsWith("pic.x.com/") || displayUrl.startsWith("pic.twitter.com/")) {
    return true;
  }

  return [entity.expanded_url, entity.url].some((url) => {
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
  });
}

function linkPlainUrls(parts: PreparedTextPart[]): PreparedTextPart[] {
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
      nextParts.push({
        href: url,
        key: `plain-url-${nextParts.length}-${start}`,
        text: url,
        type: "url",
      });
      cursor = start + url.length;
    }

    pushTextPart(nextParts, part.text.slice(cursor));
  }

  return nextParts;
}

function getDisplayRange(range: CodePointRange | undefined, textLength: number): CodePointRange {
  if (!range) return [0, textLength];

  const [start, end] = range;
  if (start < 0 || end < start || start > textLength) {
    return [0, textLength];
  }

  return [start, Math.min(end, textLength)];
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
