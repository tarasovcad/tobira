"use client";

import Link from "next/link";

import type {FreebirdXPostCard} from "@/lib/fetch/post";
import type {PostBookmark} from "@/components/bookmark/types";
import {FallbackImage} from "@/features/media/components/preview/FallbackImage";
import {getPostBookmarkCardPreviewItem} from "../../_utils/post-bookmark-preview";

type PostBookmarkExternalCardProps = {
  card: FreebirdXPostCard;
  item: PostBookmark;
  tweetId: string;
};

const LARGE_CARD_NAMES = new Set(["summary_large_image", "summary_large_image:player"]);
const externalLinkProps = {
  rel: "noopener noreferrer",
  target: "_blank",
} as const;

export default function PostBookmarkExternalCard({
  card,
  item,
  tweetId,
}: PostBookmarkExternalCardProps) {
  return (
    <div className="mt-3">
      <Link
        href={card.url}
        {...externalLinkProps}
        onClick={(e) => e.stopPropagation()}
        className="group/card border-border block overflow-hidden rounded-2xl border group-data-[selection-mode=true]/bookmark-row:pointer-events-none">
        {isLargeExternalCard(card) ? (
          <LargeExternalCardContent card={card} item={item} tweetId={tweetId} />
        ) : (
          <CompactExternalCardContent card={card} item={item} tweetId={tweetId} />
        )}
      </Link>
      <Link
        href={card.url}
        {...externalLinkProps}
        onClick={(e) => e.stopPropagation()}
        className="text-x-secondary mt-1.5 block text-[13px] hover:underline">
        From {card.domain}
      </Link>
    </div>
  );
}

function isLargeExternalCard(card: FreebirdXPostCard) {
  return LARGE_CARD_NAMES.has(card.name);
}

function LargeExternalCardContent({card, item, tweetId}: PostBookmarkExternalCardProps) {
  return (
    <div className="bg-muted relative aspect-[1.91/1] w-full overflow-hidden">
      <ExternalCardImage card={card} item={item} tweetId={tweetId} />
      <div
        className="absolute bottom-3 left-3 w-fit max-w-[calc(100%-1.5rem)] rounded-[5px] px-2"
        style={{backgroundColor: "rgba(0, 0, 0, 0.77)"}}>
        <p className="truncate text-[13px] leading-5.25 font-[450] text-white">{card.title}</p>
      </div>
    </div>
  );
}

function CompactExternalCardContent({card, item, tweetId}: PostBookmarkExternalCardProps) {
  return (
    <div className="flex items-stretch">
      <div className="border-border bg-muted h-29 w-29 shrink-0 overflow-hidden border-r">
        <ExternalCardImage card={card} item={item} tweetId={tweetId} />
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-0.5 px-3 py-2">
        <p className="text-x-secondary truncate text-[13px]">{card.domain}</p>
        <p className="text-foreground line-clamp-2 text-[15px] font-semibold">{card.title}</p>
        {card.description ? (
          <p className="text-x-secondary line-clamp-2 text-[13px]">{card.description}</p>
        ) : null}
      </div>
    </div>
  );
}

function ExternalCardImage({card, item, tweetId}: PostBookmarkExternalCardProps) {
  const previewItem = getPostBookmarkCardPreviewItem(item, tweetId, card, "list");

  if (!previewItem) {
    return null;
  }

  return (
    <FallbackImage
      src={previewItem.src}
      alt={previewItem.alt}
      width={previewItem.width}
      height={previewItem.height}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  );
}
