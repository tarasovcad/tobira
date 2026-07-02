"use client";

import * as React from "react";
import {formatDateAbsolute} from "@/lib/utils/dates";
import {cn} from "@/lib/utils";
import {Tag} from "@/components/ui/app/tag";
import {TextShimmer} from "@/components/ui/app/text-shimmer";
import type {WebsiteTextMetadataStatus} from "@/components/bookmark/types/metadata";
import WebsiteBookmarkTitle, {getDomainName} from "./WebsiteBookmarkTitle";

export {getDomainName};

interface BookmarkMetaProps {
  title?: string | null;
  url: string;
  createdAt: string;
  description?: string;
  textMetadataStatus?: WebsiteTextMetadataStatus;
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

export default function WebsiteBookmarkMeta({
  title,
  url,
  createdAt,
  description,
  textMetadataStatus,
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
  const showPendingDescription = textMetadataStatus === "pending" && !description;

  return (
    <>
      {title || textMetadataStatus ? (
        <WebsiteBookmarkTitle
          title={title}
          url={url}
          textMetadataStatus={textMetadataStatus}
          className={titleClassName}
        />
      ) : null}

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

      {showDescription && (description || showPendingDescription) ? (
        <div
          className={cn(
            hasMetaRow ? descriptionMarginWhenMetaVisible : descriptionMarginWhenMetaHidden,
            descriptionClassName,
          )}>
          {showPendingDescription ? <TextShimmer>Loading...</TextShimmer> : description}
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
