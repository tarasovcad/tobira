"use client";

import Link from "next/link";

import type {FreebirdXPostCard} from "@/lib/fetch/post";

export default function PostBookmarkExternalCard({card}: {card: FreebirdXPostCard}) {
  const isLarge = card.name === "summary_large_image" || card.name === "summary_large_image:player";

  return (
    <div className="mt-3">
      <Link
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="group/card border-border block overflow-hidden rounded-2xl border group-data-[selection-mode=true]/bookmark-row:pointer-events-none">
        {isLarge ? (
          <div className="bg-muted relative aspect-[1.91/1] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image.url}
              alt={card.image.altText ?? card.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div
              className="absolute right-0 bottom-0 left-0 mx-3 mb-3 h-5.25 w-fit rounded-[5px] px-2"
              style={{backgroundColor: "rgba(0, 0, 0, 0.77)"}}>
              <p className="truncate text-[13px] leading-5.25 font-[450] text-white">
                {card.title}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-stretch">
            <div className="border-border bg-muted h-29 w-29 shrink-0 overflow-hidden border-r">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image.url}
                alt={card.image.altText ?? card.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-0.5 px-3 py-2">
              <p className="text-x-secondary truncate text-[13px]">{card.domain}</p>
              <p className="text-foreground line-clamp-2 text-[15px] font-semibold">{card.title}</p>
              {card.description ? (
                <p className="text-x-secondary line-clamp-2 text-[13px]">{card.description}</p>
              ) : null}
            </div>
          </div>
        )}
      </Link>
      <Link
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-x-secondary mt-1.5 block text-[13px] hover:underline">
        From {card.domain}
      </Link>
    </div>
  );
}
