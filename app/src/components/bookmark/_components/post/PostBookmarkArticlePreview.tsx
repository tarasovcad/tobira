"use client";

import Image from "next/image";
import Link from "next/link";

import type {FreebirdXArticle, FreebirdXPost} from "@/lib/fetch/post";
import {cn} from "@/lib/utils";
import type {PostBookmarkPreviewItem} from "../../_utils/post-bookmark-preview";

type ArticlePreviewImage = {
  alt: string;
  aspectRatio: number;
  height: number;
  src: string;
  width: number;
};

type PostBookmarkArticlePreviewProps = {
  className?: string;
  fallbackHref: string;
  post: FreebirdXPost;
  previewItem: PostBookmarkPreviewItem | null;
};

export default function PostBookmarkArticlePreview({
  className,
  fallbackHref,
  post,
  previewItem,
}: PostBookmarkArticlePreviewProps) {
  if (!post.article) {
    return null;
  }

  const image = getArticlePreviewImage(post.article, previewItem);
  const href = getArticlePreviewHref(post, fallbackHref);

  return (
    <ArticlePreviewCard article={post.article} className={className} href={href} image={image} />
  );
}

function ArticlePreviewCard({
  article,
  className,
  href,
  image,
}: {
  article: FreebirdXArticle;
  className?: string;
  href: string;
  image: ArticlePreviewImage | null;
}) {
  const title = article.title?.trim();
  const previewText = article.preview_text?.trim();

  if (!title && !previewText && !image) {
    return null;
  }

  return (
    <div className={cn("mt-3", className)}>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="group/article border-border/60 hover:bg-muted block overflow-hidden rounded-2xl border group-data-[selection-mode=true]/bookmark-row:pointer-events-none">
        {image ? (
          <div
            className="bg-muted relative w-full overflow-hidden border-b border-[#EFF3F4]"
            style={{aspectRatio: image.aspectRatio}}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="h-full w-full object-contain"
              loading="lazy"
            />
            <div className="absolute bottom-3 left-3 flex items-center rounded-[5px] bg-black/75 px-1.5 py-0.5">
              <Image
                src="/socials/x_transparent.svg"
                alt="X logo"
                width={16}
                height={16}
                className="h-4 w-4"
              />
              <p className="text-[12px] leading-4 font-[450] text-white">Article</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-2 px-3 py-3">
          {title ? (
            <p className="text-foreground line-clamp-2 text-[17px] leading-5 font-bold">{title}</p>
          ) : null}
          {previewText ? (
            <p className="line-clamp-4 text-[15px] leading-5 whitespace-pre-line text-[#0F1419] dark:text-[#E7E9EA]">
              {previewText}...
            </p>
          ) : null}
        </div>
      </Link>
    </div>
  );
}

function getArticlePreviewHref(post: FreebirdXPost, fallbackHref: string) {
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

function getArticlePreviewImage(
  article: FreebirdXArticle,
  previewItem: PostBookmarkPreviewItem | null,
): ArticlePreviewImage | null {
  const coverMedia = article.cover_media?.media_info;

  if (previewItem) {
    return {
      alt: previewItem.alt || article.title || "Article image",
      aspectRatio:
        getImageAspectRatio(coverMedia?.original_img_width, coverMedia?.original_img_height) ??
        getImageAspectRatio(previewItem.width, previewItem.height) ??
        1.777,
      height: previewItem.height,
      src: previewItem.src,
      width: previewItem.width,
    };
  }

  if (!coverMedia?.original_img_url) {
    return null;
  }

  return {
    alt: article.title || "Article image",
    aspectRatio:
      getImageAspectRatio(coverMedia.original_img_width, coverMedia.original_img_height) ?? 1.777,
    height: coverMedia.original_img_height,
    src: coverMedia.original_img_url,
    width: coverMedia.original_img_width,
  };
}

function getImageAspectRatio(width?: number, height?: number) {
  return width && height && width > 0 && height > 0 ? width / height : undefined;
}
