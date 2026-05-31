"use client";

import {cn} from "@/lib/utils";
import {useClipboardCopy} from "@/lib/hooks/use-clipboard-copy";
import type {BookmarkMetadata, PostBookmarkMetadata} from "@/components/bookmark/types/metadata";
import Link from "next/link";
import {Button} from "@/components/ui/coss/button";
import {AnimatePresence, motion} from "motion/react";

interface BookmarkDetailsProps {
  source?: string;
  type?: string;
  kind?: "website" | "media" | "post";
  metadata?: BookmarkMetadata;
  saved: string;
  updated?: string;
  showUpdated: boolean;
}

function formatPostedDate(epoch: number): string {
  const d = new Date(epoch * 1000);
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = d.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
  return `${date} -  ${time}`;
}

function CopyableExternalLink({
  href,
  copyKey,
  copied,
  onCopy,
  children,
  className,
}: {
  href: string;
  copyKey: string;
  copied: boolean;
  onCopy: (text: string, key: string) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className="group/copy-link inline-flex min-w-0 items-center gap-1">
      <Link
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex min-w-0 items-center gap-1.5 rounded-sm underline-offset-4",
          "focus-visible:ring-ring/50 outline-none hover:underline focus-visible:ring-2",
          className,
        )}>
        {children}
      </Link>
      <Button
        type="button"
        size="icon-xs"
        variant="outline"
        aria-label="Copy link"
        onClick={() => onCopy(href, copyKey)}
        className={cn(
          "hit-area-1 rounded-sm!",
          copied
            ? "opacity-100"
            : "opacity-0 transition-opacity duration-100 group-hover/copy-link:opacity-100 focus-visible:opacity-100",
        )}>
        {/*className={cn(
          "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex size-6 shrink-0 items-center justify-center rounded-sm outline-none transition-opacity duration-150 focus-visible:ring-2",
          copied ? "opacity-100" : "opacity-0 group-hover/copy-link:opacity-100 focus-visible:opacity-100",
        )}>*/}

        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              className="flex items-center justify-center"
              initial={{opacity: 0, filter: "blur(2px)", scale: 0.9}}
              animate={{opacity: 1, filter: "blur(0px)", scale: 1}}
              exit={{opacity: 0, filter: "blur(4px)", scale: 0.85}}
              transition={{duration: 0.05, ease: "easeOut"}}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 7.1731L5.625 10L10 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              className="flex items-center justify-center"
              initial={{opacity: 0, filter: "blur(4px)", scale: 0.85}}
              animate={{opacity: 1, filter: "blur(0px)", scale: 1}}
              exit={{opacity: 0, filter: "blur(4px)", scale: 0.85}}
              transition={{duration: 0.1, ease: "easeOut"}}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M1.16699 2.47916C1.16699 1.75428 1.75462 1.16666 2.47949 1.16666H8.02116C8.74601 1.16666 9.33366 1.75428 9.33366 2.47916V4.66666H11.5212C12.246 4.66666 12.8337 5.25428 12.8337 5.97916V11.5208C12.8337 12.2457 12.246 12.8333 11.5212 12.8333H5.97949C5.25462 12.8333 4.66699 12.2457 4.66699 11.5208V9.33332H2.47949C1.75462 9.33332 1.16699 8.74567 1.16699 8.02082V2.47916ZM8.16699 4.66666H5.97949C5.25462 4.66666 4.66699 5.25428 4.66699 5.97916V8.16666H2.47949C2.39895 8.16666 2.33366 8.10138 2.33366 8.02082V2.47916C2.33366 2.39862 2.39895 2.33332 2.47949 2.33332H8.02116C8.10172 2.33332 8.16699 2.39862 8.16699 2.47916V4.66666Z"
                  fill="currentColor"
                />
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </span>
  );
}

export default function BookmarkDetails({
  source,
  type,
  kind,
  metadata,
  saved,
  updated,
  showUpdated,
}: BookmarkDetailsProps) {
  const {copiedKey, copyText} = useClipboardCopy(2000);

  const publisherName = metadata?.user_name?.trim() || "";
  const publisherHandle = (metadata?.user_screen_name ?? "").trim().replace(/^@+/, "");
  const publisherUrl = publisherHandle ? `https://x.com/${publisherHandle}` : undefined;
  const shouldShowPublisher =
    kind === "media" && (publisherName.length > 0 || publisherHandle.length > 0) && !!publisherUrl;

  const postMeta = kind === "post" ? (metadata as PostBookmarkMetadata | undefined) : undefined;

  const postedDate = postMeta?.date_epoch ? formatPostedDate(postMeta.date_epoch) : null;

  const handleCopyLink = async (href: string, key: string) => {
    await copyText(href, key);
  };

  return (
    <div className="p-6 text-[14px]">
      <div className="text-foreground text-[15px] font-[550]">Details</div>

      <div className="mt-3 grid grid-cols-[120px_1fr] gap-y-3">
        <div className="text-muted-foreground">Source</div>
        {source ? (
          <CopyableExternalLink
            href={source}
            copyKey="source"
            copied={copiedKey === "source"}
            onCopy={handleCopyLink}
            className="max-w-full">
            <span className="min-w-0 truncate">{source}</span>
          </CopyableExternalLink>
        ) : (
          <div />
        )}

        <div className="text-muted-foreground">Type</div>
        <div>{type}</div>

        {shouldShowPublisher && (
          <>
            <div className="text-muted-foreground">Publisher</div>
            <CopyableExternalLink
              href={publisherUrl}
              copyKey="publisher"
              copied={copiedKey === "publisher"}
              onCopy={handleCopyLink}
              className="text-foreground">
              <span>
                {publisherName} - @{publisherHandle}
              </span>
            </CopyableExternalLink>
          </>
        )}

        {postMeta && (
          <>
            <div className="text-muted-foreground">Author</div>
            <CopyableExternalLink
              href={`https://x.com/${postMeta.user_screen_name}`}
              copyKey="author"
              copied={copiedKey === "author"}
              onCopy={handleCopyLink}>
              <span>
                {postMeta.user_name}
                <span className="text-muted-foreground"> @{postMeta.user_screen_name}</span>
              </span>
            </CopyableExternalLink>

            {postedDate && (
              <>
                <div className="text-muted-foreground">Posted</div>
                <div>{postedDate}</div>
              </>
            )}

            {postMeta.hashtags.length > 0 && (
              <>
                <div className="text-muted-foreground">Hashtags</div>
                <div className="flex flex-wrap gap-1">
                  {postMeta.hashtags.map((tag) => (
                    <CopyableExternalLink
                      key={tag}
                      href={`https://x.com/hashtag/${tag}`}
                      copyKey={`hashtag-${tag}`}
                      copied={copiedKey === `hashtag-${tag}`}
                      onCopy={handleCopyLink}
                      className="text-[#1D9BF0]">
                      #{tag}
                    </CopyableExternalLink>
                  ))}
                </div>
              </>
            )}
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
