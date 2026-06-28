"use client";

import type {WebsiteTextMetadataStatus} from "@/components/bookmark/types/metadata";
import {TextShimmer} from "@/components/ui/app/text-shimmer";

export function getDomainName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface WebsiteBookmarkTitleProps {
  title?: string | null;
  url: string;
  textMetadataStatus?: WebsiteTextMetadataStatus;
  className?: string;
}

export default function WebsiteBookmarkTitle({
  title,
  url,
  textMetadataStatus,
  className,
}: WebsiteBookmarkTitleProps) {
  const trimmedTitle = title?.trim();
  const isPending = textMetadataStatus === "pending" && !trimmedTitle;
  const displayTitle = isPending ? "Loading..." : trimmedTitle || getDomainName(url);
  const showFailedIcon = textMetadataStatus === "failed";

  return (
    <div
      className={className}
      title={displayTitle}
      data-text-metadata-status={textMetadataStatus}
      data-fallback-title={trimmedTitle ? undefined : "true"}>
      {isPending ? (
        <TextShimmer>{displayTitle}</TextShimmer>
      ) : showFailedIcon ? (
        <span className="relative block max-w-full min-w-0 pl-6">
          <TextMetadataFailedIcon className="text-warning absolute top-1/2 left-0 shrink-0 -translate-y-1/2" />
          <span className="block min-w-0 truncate">{displayTitle}</span>
        </span>
      ) : (
        displayTitle
      )}
    </div>
  );
}

function TextMetadataFailedIcon({className}: {className?: string}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.45195 3.05316C7.62578 1.1649 10.3739 1.1649 11.5477 3.05316L16.1247 10.4163C17.367 12.4147 15.9299 15.0001 13.5769 15.0001H4.42274C2.06971 15.0001 0.632644 12.4147 1.87489 10.4163L6.45195 3.05316ZM9 6C9.41422 6 9.75 6.33578 9.75 6.75V9C9.75 9.41422 9.41422 9.75 9 9.75C8.58578 9.75 8.25 9.41422 8.25 9V6.75C8.25 6.33578 8.58578 6 9 6ZM8.0625 11.25C8.0625 10.7322 8.4822 10.3125 9 10.3125C9.5178 10.3125 9.9375 10.7322 9.9375 11.25C9.9375 11.7678 9.5178 12.1875 9 12.1875C8.4822 12.1875 8.0625 11.7678 8.0625 11.25Z"
        fill="currentColor"
      />
    </svg>
  );
}
