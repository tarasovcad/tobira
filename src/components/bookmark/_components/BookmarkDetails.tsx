"use client";

import * as React from "react";
import {cn} from "@/lib/utils/classnames";
import {useClipboardCopy} from "@/lib/hooks/use-clipboard-copy";
import type {BookmarkMetadata} from "@/app/home/_types/bookmark-metadata";
import Link from "next/link";

interface BookmarkDetailsProps {
  source?: string;
  type?: string;
  kind?: "website" | "media";
  metadata?: BookmarkMetadata;
  collections: {id: string; name: string}[];
  saved: string;
  updated?: string;
  showUpdated: boolean;
}

function BookmarkDetailsImpl({
  source,
  type,
  kind,
  metadata,
  collections,
  saved,
  updated,
  showUpdated,
}: BookmarkDetailsProps) {
  const {copiedKey, copyText} = useClipboardCopy(2000);
  const sourceCopied = copiedKey === "source";
  const publisherName = metadata?.user_name?.trim() || "";
  const publisherHandle = (metadata?.user_screen_name ?? "").trim().replace(/^@+/, "");
  const publisherUrl = publisherHandle ? `https://x.com/${publisherHandle}` : undefined;
  const shouldShowPublisher =
    kind === "media" && (publisherName.length > 0 || publisherHandle.length > 0) && !!publisherUrl;

  const handleCopySource = async () => {
    if (!source) return;
    await copyText(source, "source");
  };

  return (
    <div className="p-6 text-[14px]">
      <div className="text-foreground text-[15px] font-[550]">Details</div>

      <div className="mt-3 grid grid-cols-[120px_1fr] gap-y-3">
        <div className="text-muted-foreground">Source</div>
        <button
          type="button"
          onClick={handleCopySource}
          className={cn(
            "inline-flex min-w-0 items-center gap-2 text-left",
            "hover:text-foreground focus-visible:ring-ring/50 rounded-sm outline-none focus-visible:ring-2",
          )}>
          <span className="min-w-0 truncate underline-offset-4 hover:underline">{source}</span>
          <span
            aria-hidden="true"
            className={cn(
              "text-muted-foreground inline-flex shrink-0 items-center transition-opacity duration-200",
              sourceCopied ? "opacity-100" : "opacity-0",
            )}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13.3332 4L6.33317 11L2.6665 7.33333"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        <div className="text-muted-foreground">Type</div>
        <div>{type}</div>

        {shouldShowPublisher && (
          <>
            <div className="text-muted-foreground">Publisher</div>

            <Link
              href={publisherUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "text-foreground inline-flex min-w-0 items-center gap-1.5 rounded-sm",
                "focus-visible:ring-ring/50 outline-none hover:underline focus-visible:ring-2",
              )}>
              <span>
                {publisherName} - @{publisherHandle}
              </span>
            </Link>
          </>
        )}

        {collections.length > 0 && (
          <>
            <div className="text-muted-foreground">Collection</div>
            <div className="flex flex-wrap gap-1">
              {collections.map((c) => (
                <span key={c.id} className="">
                  {c.name}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="text-muted-foreground">Saved</div>
        <div>{saved}</div>

        {showUpdated && (
          <>
            <div className="text-muted-foreground">Updated</div>
            <div>{updated}</div>
          </>
        )}
      </div>
    </div>
  );
}

export const BookmarkDetails = React.memo(BookmarkDetailsImpl);
