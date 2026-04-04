"use client";

import * as React from "react";
import {formatDateAbsolute} from "@/lib/utils/dates";
import {cn} from "@/lib/utils/classnames";
import {Tag} from "@/components/ui/Tag";

export function getDomainName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface BookmarkMetaProps {
  title: string;
  url: string;
  createdAt: string;
  description?: string;
  tags?: string[];
  showSource?: boolean;
  showSavedDate?: boolean;
  showDescription?: boolean;
  showTags?: boolean;
  sourceMode?: "url" | "domain";
  sourceDateSeparator?: string;
  titleClassName?: string;
  sourceRowClassName?: string;
  descriptionClassName?: string;
  tagsWrapperClassName?: string;
  tagClassName?: string;
  descriptionMarginWhenMetaVisible?: string;
  descriptionMarginWhenMetaHidden?: string;
  maxTags?: number;
}

function BookmarkMetaImpl({
  title,
  url,
  createdAt,
  description,
  tags,
  showSource = false,
  showSavedDate = false,
  showDescription = false,
  showTags = false,
  sourceMode = "url",
  sourceDateSeparator = "-",
  titleClassName,
  sourceRowClassName,
  descriptionClassName,
  tagsWrapperClassName,
  tagClassName,
  descriptionMarginWhenMetaVisible = "mt-1.5",
  descriptionMarginWhenMetaHidden = "mt-0.5",
  maxTags,
}: BookmarkMetaProps) {
  const hasMetaRow = showSource || showSavedDate;
  const visibleTags = maxTags ? tags?.slice(0, maxTags) : tags;
  const sourceText = sourceMode === "domain" ? getDomainName(url) : url;

  return (
    <>
      {title ? <div className={titleClassName}>{title}</div> : null}

      {hasMetaRow ? (
        <div className={sourceRowClassName}>
          <div className="flex min-w-0 items-center gap-1">
            {showSource ? <span className="min-w-0 truncate">{sourceText}</span> : null}
            {showSource && showSavedDate ? (
              <span className="shrink-0">{sourceDateSeparator}</span>
            ) : null}
            {showSavedDate ? (
              <span className="shrink-0">{formatDateAbsolute(createdAt)}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {showDescription && description ? (
        <div
          className={cn(
            hasMetaRow ? descriptionMarginWhenMetaVisible : descriptionMarginWhenMetaHidden,
            descriptionClassName,
          )}>
          {description}
        </div>
      ) : null}

      {showTags && visibleTags && visibleTags.length > 0 ? (
        <div className={tagsWrapperClassName}>
          {visibleTags.map((tag) => (
            <Tag key={tag} className={tagClassName}>
              {tag}
            </Tag>
          ))}
        </div>
      ) : null}
    </>
  );
}

export const BookmarkMeta = React.memo(BookmarkMetaImpl);
