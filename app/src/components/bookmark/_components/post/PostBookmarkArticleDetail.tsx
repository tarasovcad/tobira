"use client";

import {Fragment, useMemo, useState, type MouseEvent, type ReactNode} from "react";
import Link from "next/link";

import MediaPreview from "@/features/media/components/MediaPreview";
import type {FreebirdXPost, FreebirdXPostMediaItem, FreebirdXPostResponse} from "@/lib/fetch/post";
import {toSafeHttpUrl} from "@/lib/utils/safe-url";
import type {PostBookmark} from "../../types";
import {
  getPostBookmarkArticleCoverPreviewItem,
  getPostBookmarkArticleMediaPreviewItems,
  type PostBookmarkPreviewItem,
  type PostBookmarkArticlePreviewItem,
} from "../../_utils/post-bookmark-preview";
import PostBookmarkArticleMarkdown from "./PostBookmarkArticleMarkdown";
import PostBookmarkArticlePreview from "./PostBookmarkArticlePreview";
import {PostBookmarkAuthorAvatar, PostBookmarkAuthorLine} from "./PostBookmarkAuthor";
import PostBookmarkExternalCard from "./PostBookmarkExternalCard";
import {PostBookmarkMediaPreviewGrid} from "./PostBookmarkMediaGrid";
import {
  PostBookmarkText,
  preparePostBookmarkText,
  preparePostBookmarkTranslationText,
} from "./PostBookmarkText";
import {useTranslationToggle, PostTranslationLabel} from "./PostBookmarkTranslation";

type PostBookmarkArticleDetailProps = {
  fallbackHref: string;
  item: PostBookmark;
  post: FreebirdXPost;
};

type ArticleContentState = {
  blocks: ArticleContentBlock[];
  entityMap: Map<string, ArticleEntity>;
};

type ArticleContentBlock = {
  entityRanges: ArticleEntityRange[];
  inlineStyleRanges: ArticleInlineStyleRange[];
  key: string;
  text: string;
  type: string;
};

type ArticleInlineStyleRange = {
  length: number;
  offset: number;
  style: string;
};

type ArticleEntityRange = {
  key: string;
  length: number;
  offset: number;
};

type ArticleEntity = {
  data?: unknown;
  type: string;
};

const ARTICLE_LINK_CLASS_NAME =
  "hover:text-[#1D9BF0] hover:underline group-data-[selection-mode=true]/bookmark-row:hover:no-underline text-foreground/90 underline";
const ARTICLE_TWEET_TEXT_MAX_LENGTH = 280;
const DEFAULT_ARTICLE_MEDIA_ASPECT_RATIO = 1.777;
const articleExternalLinkProps = {
  rel: "noopener noreferrer",
  target: "_blank",
} as const;

export default function PostBookmarkArticleDetail({
  fallbackHref,
  item,
  post,
}: PostBookmarkArticleDetailProps) {
  const article = post.article;
  const contentState = useMemo(
    () => (article ? parseArticleContentState(article.content_state) : null),
    [article],
  );
  const articleMediaItems = useMemo(
    () => (article ? getPostBookmarkArticleMediaPreviewItems(item, article, "list") : []),
    [article, item],
  );
  const mediaById = useMemo(
    () => new Map(articleMediaItems.map((mediaItem) => [mediaItem.mediaId, mediaItem])),
    [articleMediaItems],
  );
  const coverImage = articleMediaItems.find((mediaItem) => mediaItem.articleMediaType === "cover");
  const fallbackPreviewItem = article
    ? getPostBookmarkArticleCoverPreviewItem(item, "list", 0)
    : null;

  if (!article) {
    return null;
  }

  if (!contentState) {
    return (
      <PostBookmarkArticlePreview
        post={post}
        fallbackHref={fallbackHref}
        previewItem={fallbackPreviewItem}
      />
    );
  }

  const title = article.title?.trim();
  const articleHref = getArticleHref(post, fallbackHref);

  return (
    <section data-no-post-detail className="mt-3 space-y-8 text-[#0F1419] dark:text-[#E7E9EA]">
      {coverImage ? <ArticleImage item={coverImage} variant="cover" /> : null}

      {title ? (
        <>
          <Link
            href={articleHref}
            {...articleExternalLinkProps}
            onClick={(e) => e.stopPropagation()}
            className="text-foreground inline-block text-[28px] leading-[32px] font-bold hover:underline">
            {title}
          </Link>
          <hr className="border-border" />
        </>
      ) : null}

      <div className="space-y-4">
        {renderArticleBlocks(contentState.blocks, contentState.entityMap, mediaById, item)}
      </div>
    </section>
  );
}

function renderArticleBlocks(
  blocks: ArticleContentBlock[],
  entityMap: Map<string, ArticleEntity>,
  mediaById: Map<string, PostBookmarkArticlePreviewItem>,
  item: PostBookmark,
) {
  const renderedBlocks: ReactNode[] = [];
  let index = 0;

  while (index < blocks.length) {
    const block = blocks.at(index);
    if (!block) {
      break;
    }

    if (isListBlock(block)) {
      const listType = block.type;
      const listBlocks: ArticleContentBlock[] = [];

      while (index < blocks.length) {
        const listBlock = blocks.at(index);
        if (!listBlock || listBlock.type !== listType) {
          break;
        }

        listBlocks.push(listBlock);
        index += 1;
      }

      renderedBlocks.push(renderListBlocks(listBlocks, entityMap, listType));
      continue;
    }

    renderedBlocks.push(renderArticleBlock(block, entityMap, mediaById, item));
    index += 1;
  }

  return renderedBlocks;
}

function renderArticleBlock(
  block: ArticleContentBlock,
  entityMap: Map<string, ArticleEntity>,
  mediaById: Map<string, PostBookmarkArticlePreviewItem>,
  item: PostBookmark,
) {
  switch (block.type) {
    case "header-two":
      return (
        <h2
          key={block.key}
          className="text-foreground cursor-text pt-4 text-[22px] leading-7 font-bold">
          {renderInlineText(block, entityMap)}
        </h2>
      );
    case "blockquote":
      return (
        <blockquote
          key={block.key}
          className="text-foreground cursor-text border-l-[3px] border-[#37434D] py-1 pl-4 text-[17px] leading-7 whitespace-pre-wrap">
          {renderInlineText(block, entityMap)}
        </blockquote>
      );
    case "atomic":
      return renderAtomicBlock(block, entityMap, mediaById, item);
    default:
      if (!block.text.trim()) {
        return <div key={block.key} className="h-1" />;
      }

      return (
        <p key={block.key} className="cursor-text text-[17px] leading-7 whitespace-pre-wrap">
          {renderInlineText(block, entityMap)}
        </p>
      );
  }
}

function renderListBlocks(
  blocks: ArticleContentBlock[],
  entityMap: Map<string, ArticleEntity>,
  listType: string,
) {
  const ListTag = listType === "ordered-list-item" ? "ol" : "ul";
  const listClassName =
    listType === "ordered-list-item"
      ? "list-decimal marker:text-x-secondary"
      : "list-disc marker:text-x-secondary";
  const listKey = blocks.at(0)?.key ?? listType;

  return (
    <ListTag key={`${listKey}-list`} className={`${listClassName} space-y-2 pl-6`}>
      {blocks.map((block) => (
        <li key={block.key} className="cursor-text pl-1 text-[17px] leading-7 whitespace-pre-wrap">
          {renderInlineText(block, entityMap)}
        </li>
      ))}
    </ListTag>
  );
}

function renderAtomicBlock(
  block: ArticleContentBlock,
  entityMap: Map<string, ArticleEntity>,
  mediaById: Map<string, PostBookmarkArticlePreviewItem>,
  item: PostBookmark,
) {
  const entity = getFirstBlockEntity(block, entityMap);
  if (!entity) {
    return null;
  }

  if (entity.type === "DIVIDER") {
    return <hr key={block.key} className="border-border my-7" />;
  }

  if (entity.type === "TWEET") {
    const resolvedTweet = getResolvedTweetEntityPost(entity);

    if (!resolvedTweet) {
      return null;
    }

    return (
      <div key={block.key} className="my-6">
        <ArticleTweetEmbed item={item} post={resolvedTweet} />
      </div>
    );
  }

  if (entity.type === "MARKDOWN") {
    return <PostBookmarkArticleMarkdown key={block.key} data={entity.data} />;
  }

  return renderAtomicMediaBlock(block, entity, mediaById);
}

function renderAtomicMediaBlock(
  block: ArticleContentBlock,
  entity: ArticleEntity,
  mediaById: Map<string, PostBookmarkArticlePreviewItem>,
) {
  if (entity.type !== "MEDIA") return null;

  const mediaItems = getEntityMediaItems(entity, mediaById);
  if (!mediaItems.length) return null;

  return (
    <div key={block.key} className="space-y-3">
      {mediaItems.map((mediaItem) => (
        <ArticleImage key={`${block.key}-${mediaItem.mediaId}`} item={mediaItem} variant="body" />
      ))}
    </div>
  );
}

function getEntityMediaItems(
  entity: ArticleEntity,
  mediaById: Map<string, PostBookmarkArticlePreviewItem>,
) {
  return getEntityMediaIds(entity)
    .map((mediaId) => mediaById.get(mediaId))
    .filter((mediaItem): mediaItem is PostBookmarkArticlePreviewItem => Boolean(mediaItem));
}

function ArticleImage({
  item,
  variant,
}: {
  item: PostBookmarkArticlePreviewItem;
  variant: "body" | "cover";
}) {
  const aspectRatio = getArticleImageAspectRatio(item);

  return (
    <figure
      onClick={(event) => event.stopPropagation()}
      className={getArticleImageClassName(variant)}
      style={{aspectRatio}}>
      <MediaPreview
        type={item.type}
        src={item.src}
        fullSizeSrc={item.fullSizeSrc ?? item.src}
        poster={item.poster}
        alt={item.alt || (item.type === "video" ? "Article video" : "Article image")}
        width={item.width}
        height={item.height}
        className="h-full w-full object-contain"
        buttonClassName="h-full w-full"
        loading="lazy"
      />
    </figure>
  );
}

function getArticleImageAspectRatio(item: PostBookmarkArticlePreviewItem) {
  return item.width > 0 && item.height > 0
    ? item.width / item.height
    : DEFAULT_ARTICLE_MEDIA_ASPECT_RATIO;
}

function getArticleImageClassName(variant: "body" | "cover") {
  return variant === "cover"
    ? "bg-muted/30 dark:border-border overflow-hidden"
    : "bg-muted/30 dark:border-border my-6 overflow-hidden rounded-xl";
}

function ArticleTweetEmbed({item, post}: {item: PostBookmark; post: FreebirdXPostResponse}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const preparedText = preparePostBookmarkText(post.post, {
    expanded: isExpanded,
    maxLength: ARTICLE_TWEET_TEXT_MAX_LENGTH,
  });
  const translationToggle = useTranslationToggle(post.post, {initialTranslationExpanded: true});
  const preparedTranslationText = preparePostBookmarkTranslationText(post.post, {
    expanded: translationToggle.isTranslationExpanded,
  });
  const mediaItems = getResolvedTweetMediaPreviewItems(post);
  const profileUrl = `https://x.com/${post.user.user_screen_name}`;
  const handleExpandOriginal = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsExpanded(true);
  };
  const handleExpandTranslation = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    translationToggle.expandTranslation();
  };

  return (
    <Link
      href={post.post.tweetURL}
      {...articleExternalLinkProps}
      onClick={(e) => e.stopPropagation()}>
      <article className="hover:bg-muted/80 grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 rounded-2xl border border-[#CFD9DE] p-4 shadow-[0_0_6px_rgba(0,0,0,0.1)]">
        <PostBookmarkAuthorAvatar user={post.user} profileUrl={profileUrl} />

        <div className="min-w-0 space-y-2">
          <PostBookmarkAuthorLine
            user={post.user}
            profileUrl={profileUrl}
            timestampEpoch={post.post.date_epoch}
            showTimestamp
            className="text-[15px] leading-5"
          />

          <ArticleTweetEmbedText
            preparedText={preparedText}
            preparedTranslationText={preparedTranslationText}
            translationToggle={translationToggle}
            isExpanded={isExpanded}
            onExpandOriginal={handleExpandOriginal}
            onExpandTranslation={handleExpandTranslation}
          />

          {post.post.card ? (
            <PostBookmarkExternalCard
              card={post.post.card}
              item={item}
              tweetId={post.post.tweetID}
            />
          ) : null}
          <PostBookmarkMediaPreviewGrid media={mediaItems} />
        </div>
      </article>
    </Link>
  );
}

function ArticleTweetEmbedText({
  isExpanded,
  onExpandOriginal,
  onExpandTranslation,
  preparedText,
  preparedTranslationText,
  translationToggle,
}: {
  isExpanded: boolean;
  onExpandOriginal: (event: MouseEvent<HTMLButtonElement>) => void;
  onExpandTranslation: (event: MouseEvent<HTMLButtonElement>) => void;
  preparedText: ReturnType<typeof preparePostBookmarkText>;
  preparedTranslationText: ReturnType<typeof preparePostBookmarkTranslationText>;
  translationToggle: ReturnType<typeof useTranslationToggle>;
}) {
  const showTranslationMore =
    translationToggle.isTranslated &&
    preparedTranslationText.isLongText &&
    !translationToggle.isTranslationExpanded;
  const showOriginalMore =
    !isExpanded && !translationToggle.isTranslated && preparedText.isLongText;

  return (
    <>
      {translationToggle.hasTranslation ? (
        <PostTranslationLabel
          sourceLanguage={translationToggle.sourceLanguage}
          showOriginal={translationToggle.showOriginal}
          provider={translationToggle.provider}
          onToggle={translationToggle.toggleOriginal}
        />
      ) : null}
      <ArticleTweetEmbedTextParagraph
        preparedText={preparedText}
        preparedTranslationText={preparedTranslationText}
        translationToggle={translationToggle}
      />
      {showTranslationMore ? (
        <ArticleTweetEmbedShowMoreButton onClick={onExpandTranslation} />
      ) : null}
      {showOriginalMore ? <ArticleTweetEmbedShowMoreButton onClick={onExpandOriginal} /> : null}
    </>
  );
}

function ArticleTweetEmbedTextParagraph({
  preparedText,
  preparedTranslationText,
  translationToggle,
}: {
  preparedText: ReturnType<typeof preparePostBookmarkText>;
  preparedTranslationText: ReturnType<typeof preparePostBookmarkTranslationText>;
  translationToggle: ReturnType<typeof useTranslationToggle>;
}) {
  if (translationToggle.isTranslated) {
    return (
      <p className="text-foreground text-[15px] leading-5 whitespace-pre-wrap">
        <PostBookmarkText preparedText={preparedTranslationText} />
      </p>
    );
  }

  if (!preparedText.hasText) return null;

  return (
    <p className="text-foreground text-[15px] leading-5 whitespace-pre-wrap">
      <PostBookmarkText preparedText={preparedText} />
    </p>
  );
}

function ArticleTweetEmbedShowMoreButton({
  onClick,
}: {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mt-1 block cursor-pointer text-[15px] leading-5 text-[#1D9BF0] hover:underline focus:outline-none">
      Show more
    </button>
  );
}

function renderInlineText(
  block: ArticleContentBlock,
  entityMap: Map<string, ArticleEntity>,
): ReactNode[] {
  const textLength = block.text.length;
  const breakpoints = new Set([0, textLength]);

  for (const range of block.inlineStyleRanges) {
    addRangeBreakpoints(breakpoints, range.offset, range.length, textLength);
  }

  for (const range of block.entityRanges) {
    addRangeBreakpoints(breakpoints, range.offset, range.length, textLength);
  }

  const sortedBreakpoints = [...breakpoints].sort((a, b) => a - b);
  const nodes: ReactNode[] = [];

  for (let index = 0; index < sortedBreakpoints.length - 1; index += 1) {
    const start = sortedBreakpoints.at(index);
    const end = sortedBreakpoints.at(index + 1);
    if (start == null || end == null) {
      continue;
    }

    const text = block.text.slice(start, end);

    if (!text) {
      continue;
    }

    const isBold = hasActiveInlineStyle(block.inlineStyleRanges, "Bold", start, end);
    const isItalic = hasActiveInlineStyle(block.inlineStyleRanges, "Italic", start, end);
    const linkHref = getActiveLinkHref(block.entityRanges, entityMap, start, end);
    let node: ReactNode = text;

    if (isBold) {
      node = <strong className="font-semibold">{node}</strong>;
    }

    if (isItalic) {
      node = <em>{node}</em>;
    }

    if (linkHref) {
      node = (
        <Link
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={ARTICLE_LINK_CLASS_NAME}>
          {node}
        </Link>
      );
    }

    nodes.push(<Fragment key={`${block.key}-${start}-${end}`}>{node}</Fragment>);
  }

  return nodes;
}

function parseArticleContentState(input: unknown): ArticleContentState | null {
  if (!isRecord(input) || !Array.isArray(input.blocks)) {
    return null;
  }

  const entityMap = parseEntityMap(input.entityMap);
  const blocks = input.blocks
    .map(parseArticleBlock)
    .filter((block): block is ArticleContentBlock => Boolean(block));

  if (!blocks.some((block) => isRenderableArticleBlock(block, entityMap))) {
    return null;
  }

  return {blocks, entityMap};
}

function parseArticleBlock(input: unknown): ArticleContentBlock | null {
  if (!isRecord(input) || typeof input.key !== "string" || typeof input.type !== "string") {
    return null;
  }

  return {
    entityRanges: parseEntityRanges(input.entityRanges),
    inlineStyleRanges: parseInlineStyleRanges(input.inlineStyleRanges),
    key: input.key,
    text: typeof input.text === "string" ? input.text : "",
    type: input.type,
  };
}

function parseEntityMap(input: unknown): Map<string, ArticleEntity> {
  const entityMap = new Map<string, ArticleEntity>();

  if (Array.isArray(input)) {
    input.forEach((entry, index) => {
      if (isRecord(entry) && "value" in entry) {
        const entity = parseArticleEntity(entry.value);
        if (entity) {
          entityMap.set(String(entry.key ?? index), entity);
        }
        return;
      }

      const entity = parseArticleEntity(entry);
      if (entity) {
        entityMap.set(String(index), entity);
      }
    });
    return entityMap;
  }

  if (!isRecord(input)) {
    return entityMap;
  }

  for (const [key, value] of Object.entries(input)) {
    const entity = parseArticleEntity(value);
    if (entity) {
      entityMap.set(key, entity);
    }
  }

  return entityMap;
}

function parseArticleEntity(input: unknown): ArticleEntity | null {
  if (!isRecord(input) || typeof input.type !== "string") {
    return null;
  }

  return {
    data: input.data,
    type: input.type,
  };
}

function parseInlineStyleRanges(input: unknown): ArticleInlineStyleRange[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((range) => {
      if (!isRecord(range) || typeof range.style !== "string") {
        return null;
      }

      return parseRange(range, {style: range.style});
    })
    .filter((range): range is ArticleInlineStyleRange => Boolean(range));
}

function parseEntityRanges(input: unknown): ArticleEntityRange[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((range) => {
      if (!isRecord(range) || (typeof range.key !== "string" && typeof range.key !== "number")) {
        return null;
      }

      return parseRange(range, {key: String(range.key)});
    })
    .filter((range): range is ArticleEntityRange => Boolean(range));
}

function parseRange<T extends {key: string} | {style: string}>(
  range: Record<string, unknown>,
  extra: T,
) {
  if (
    typeof range.offset !== "number" ||
    typeof range.length !== "number" ||
    range.offset < 0 ||
    range.length <= 0
  ) {
    return null;
  }

  return {
    ...extra,
    length: range.length,
    offset: range.offset,
  };
}

function isRenderableArticleBlock(
  block: ArticleContentBlock,
  entityMap: Map<string, ArticleEntity>,
) {
  if (block.type !== "atomic") {
    return block.text.trim().length > 0;
  }

  const entity = getFirstBlockEntity(block, entityMap);
  return (
    entity?.type === "DIVIDER" ||
    entity?.type === "MEDIA" ||
    entity?.type === "TWEET" ||
    entity?.type === "MARKDOWN"
  );
}

function isListBlock(block: ArticleContentBlock) {
  return block.type === "ordered-list-item" || block.type === "unordered-list-item";
}

function getFirstBlockEntity(
  block: ArticleContentBlock,
  entityMap: Map<string, ArticleEntity>,
): ArticleEntity | null {
  const firstRange = block.entityRanges[0];
  return firstRange ? (entityMap.get(firstRange.key) ?? null) : null;
}

function getEntityMediaIds(entity: ArticleEntity): string[] {
  if (!isRecord(entity.data) || !Array.isArray(entity.data.mediaItems)) {
    return [];
  }

  return entity.data.mediaItems
    .map((mediaItem) => (isRecord(mediaItem) ? mediaItem.mediaId : null))
    .filter((mediaId): mediaId is string => typeof mediaId === "string" && mediaId.length > 0);
}

function getResolvedTweetEntityPost(entity: ArticleEntity): FreebirdXPostResponse | null {
  if (!isRecord(entity.data) || !isRecord(entity.data.resolvedTweet)) {
    return null;
  }

  const resolvedTweet = entity.data.resolvedTweet;
  if (
    !isRecord(resolvedTweet.post) ||
    !isRecord(resolvedTweet.user) ||
    !isRecord(resolvedTweet.metrics)
  ) {
    return null;
  }

  return resolvedTweet as FreebirdXPostResponse;
}

function getResolvedTweetMediaPreviewItems(
  resolvedTweet: FreebirdXPostResponse,
): PostBookmarkPreviewItem[] {
  return resolvedTweet.post.media_extended
    .map((mediaItem, index) => getResolvedTweetMediaPreviewItem(mediaItem, index))
    .filter((mediaItem): mediaItem is PostBookmarkPreviewItem => Boolean(mediaItem));
}

function getResolvedTweetMediaPreviewItem(
  mediaItem: FreebirdXPostMediaItem,
  index: number,
): PostBookmarkPreviewItem | null {
  const sourceUrl = mediaItem.url || mediaItem.thumbnail_url;
  if (!sourceUrl) {
    return null;
  }

  const [aspectWidth, aspectHeight] = mediaItem.aspect_ratio ?? [];
  const width = mediaItem.size?.width ?? aspectWidth ?? 1200;
  const height = mediaItem.size?.height ?? aspectHeight ?? 1200;
  const type = mediaItem.type === "photo" ? "image" : "video";

  return {
    alt: mediaItem.altText ?? "",
    aspectRatio: width > 0 && height > 0 ? width / height : undefined,
    durationMillis: mediaItem.duration_millis,
    fullSizeSrc: type === "image" ? sourceUrl : undefined,
    height,
    key: mediaItem.id_str || sourceUrl || `resolved-tweet-media-${index}`,
    poster: mediaItem.thumbnail_url ?? undefined,
    src: sourceUrl,
    type,
    width,
  };
}

function addRangeBreakpoints(
  breakpoints: Set<number>,
  offset: number,
  length: number,
  textLength: number,
) {
  const start = Math.max(0, Math.min(offset, textLength));
  const end = Math.max(start, Math.min(offset + length, textLength));

  breakpoints.add(start);
  breakpoints.add(end);
}

function hasActiveInlineStyle(
  ranges: ArticleInlineStyleRange[],
  style: string,
  start: number,
  end: number,
) {
  return ranges.some((range) => {
    const rangeEnd = range.offset + range.length;
    return range.style === style && range.offset <= start && rangeEnd >= end;
  });
}

function getActiveLinkHref(
  ranges: ArticleEntityRange[],
  entityMap: Map<string, ArticleEntity>,
  start: number,
  end: number,
) {
  const linkRange = ranges.find((range) => {
    const rangeEnd = range.offset + range.length;
    const entity = entityMap.get(range.key);
    return entity?.type === "LINK" && range.offset <= start && rangeEnd >= end;
  });

  if (!linkRange) {
    return null;
  }

  const entity = entityMap.get(linkRange.key);
  if (!entity || !isRecord(entity.data) || typeof entity.data.url !== "string") {
    return null;
  }

  return toSafeHttpUrl(entity.data.url);
}

function getArticleHref(post: FreebirdXPost, fallbackHref: string) {
  const articleId = post.article?.rest_id;
  const articleEntity = post.entities?.urls?.find((entity) => {
    if (!articleId) {
      return entity.expanded_url.includes("/i/article/");
    }

    return entity.expanded_url.includes(`/i/article/${articleId}`);
  });

  return (
    articleEntity?.expanded_url ??
    (articleId ? `https://x.com/i/article/${articleId}` : fallbackHref)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
