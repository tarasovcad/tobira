"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import MediaPreview from "@/features/media/components/MediaPreview";
import type {WebsiteBookmark} from "@/components/bookmark/types";
import type {WebsiteImages} from "@/db/schema";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {useViewOptionsStore} from "@/store/use-view-options";
import {isWebsiteImages} from "@/features/media/components/bookmark/bookmark-images";
import {useEffect, useState} from "react";

interface WebsiteBookmarkGridImageProps {
  item: WebsiteBookmark;
  previewOpenSignal?: number;
  divClassName?: string;
  skeletonClassName?: string;
  fallbackClassName?: string;
  onPreviewOpenChange?: (open: boolean) => void;
}

const MAX_RETRIES = 12;
const RETRY_MS = 2000;

function getPreferredGridImage(
  images: WebsiteImages | undefined,
): {key: string; width: number; height: number} | null {
  if (!images) return null;

  const resolved = images.selected === "og" ? images.og : images.preview;

  return {
    key: resolved?.key ?? "",
    width: resolved?.width ?? 1200,
    height: resolved?.height ?? 750,
  };
}

export default function WebsiteBookmarkGridImage({
  item,
  previewOpenSignal,
  divClassName,
  skeletonClassName,
  fallbackClassName,
  onPreviewOpenChange,
}: WebsiteBookmarkGridImageProps) {
  const websiteImages = isWebsiteImages(item.images) ? item.images : undefined;
  const preferredImage = getPreferredGridImage(websiteImages);
  const baseSrc = preferredImage?.key ? buildR2PublicUrl(preferredImage.key) : "";
  const columnSize = useViewOptionsStore((state) => state.columnSize);

  const previewSize = (() => {
    if (columnSize <= 2) return "large";
    if (columnSize <= 4) return "medium";
    return "small";
  })();

  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    if (!baseSrc) return;
    if (status !== "error") return;
    if (attempt >= MAX_RETRIES) return;

    const timer = window.setTimeout(() => {
      setAttempt((current) => current + 1);
      setStatus("loading");
    }, RETRY_MS);

    return () => window.clearTimeout(timer);
  }, [attempt, baseSrc, status]);

  const hasValidImage = !!baseSrc && status === "loaded";

  return (
    <div
      className={cn("absolute inset-0", "grid place-items-center overflow-hidden", divClassName)}>
      {!hasValidImage ? (
        <div
          className={cn(
            "text-muted-foreground/30 z-10 col-start-1 row-start-1",
            fallbackClassName,
          )}>
          <svg
            width={20}
            height={20}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M14.375 2.5C16.1009 2.5 17.5 3.89911 17.5 5.625V14.375C17.5 16.1009 16.1009 17.5 14.375 17.5H5.625C3.89911 17.5 2.5 16.1009 2.5 14.375V5.625C2.5 3.89911 3.89911 2.5 5.625 2.5H14.375ZM7.99235 11.3257C7.26015 10.5937 6.07318 10.5937 5.34098 11.3257L3.75 12.9167V14.375C3.75 15.4105 4.58947 16.25 5.625 16.25H12.9167L7.99235 11.3257ZM12.5 5.41667C11.3494 5.41667 10.4167 6.34941 10.4167 7.5C10.4167 8.65058 11.3494 9.58333 12.5 9.58333C13.6506 9.58333 14.5833 8.65058 14.5833 7.5C14.5833 6.34941 13.6506 5.41667 12.5 5.41667Z"
              fill="currentColor"
            />
          </svg>
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-0",
          "col-start-1 row-start-1 flex items-center justify-center",
          !hasValidImage && "bg-muted animate-pulse",
          skeletonClassName,
        )}>
        {baseSrc ? (
          <MediaPreview
            src={`${baseSrc}?size=${previewSize}&format=webp&v=${attempt}`}
            fullSizeSrc={`${baseSrc}?size=large&&v=${attempt}`}
            alt={`${item.title || item.url} preview`}
            width={preferredImage?.width ?? 1200}
            height={preferredImage?.height ?? 750}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={60}
            loading="lazy"
            openSignal={previewOpenSignal}
            disableClickToOpen={true}
            showFallback={!hasValidImage}
            className={cn(
              status === "loaded" ? "opacity-100" : "opacity-0",
              "h-full w-full object-cover transition-opacity duration-300 ease-in-out",
            )}
            buttonClassName="flex h-full w-full items-center justify-center"
            onOpenChange={onPreviewOpenChange}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
        ) : null}
      </div>
    </div>
  );
}
