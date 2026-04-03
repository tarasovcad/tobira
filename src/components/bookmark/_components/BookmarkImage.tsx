"use client";

import {useEffect, useState} from "react";
import {cn} from "@/lib/utils/classnames";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import MediaPreview from "@/components/ui/MediaPreview";
import type {Bookmark} from "../types";

export const BookmarkImage = ({
  bookmark_id,
  item,
  type,
  previewOpenSignal,
  disablePreviewOnClick,
  divClassName,
  imageClassName,
  skeletonClassName,
  height,
  width,
  fallbackClassName,
  fill,
}: {
  bookmark_id: string;
  item: Bookmark;
  type: "preview" | "favicon" | "og";
  previewOpenSignal?: number;
  disablePreviewOnClick?: boolean;
  divClassName?: string;
  imageClassName?: string;
  skeletonClassName?: string;
  height?: number;
  width?: number;
  fallbackClassName?: string;
  fill?: boolean;
}) => {
  let BASE_SRC = "";

  switch (type) {
    case "preview":
      BASE_SRC = item.preview_image ?? "";
      break;
    case "favicon":
      BASE_SRC = buildR2PublicUrl(`favicons/${bookmark_id}/favicon.png`);
      break;
  }
  const MAX_RETRIES = 12; // ~24s at 2s interval
  const RETRY_MS = 2000;

  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  const isVideo =
    BASE_SRC.toLowerCase().endsWith(".mp4") || BASE_SRC.toLowerCase().endsWith(".mov");

  const hasValidImage = !!BASE_SRC && status === "loaded";
  const showFallbackInPreview = type === "preview" && !hasValidImage;

  // If the image 404s (still uploading), retry with a cache-busting query param.
  useEffect(() => {
    if (status !== "error") return;
    if (attempt >= MAX_RETRIES) return;

    const t = window.setTimeout(() => {
      setAttempt((a) => a + 1);
      setStatus("loading");
    }, RETRY_MS);

    return () => window.clearTimeout(t);
  }, [attempt, status]);

  return (
    <div
      className={cn(
        fill ? "absolute inset-0" : "relative",
        "grid place-items-center",
        divClassName,
      )}>
      {status !== "loaded" ? (
        <div
          className={cn(
            "text-muted-foreground/30 z-10 col-start-1 row-start-1",
            fallbackClassName,
          )}>
          <svg
            width={type === "favicon" && width ? width : 20}
            height={type === "favicon" && height ? height : 20}
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

      {/* Cache-busted favicon attempts. Keep hidden until loaded to avoid alt text flashes. */}
      <div
        className={cn(
          fill ? "absolute inset-0" : "relative h-full w-full",
          "col-start-1 row-start-1 flex items-center justify-center",
          status !== "loaded" && "bg-muted animate-pulse",
          skeletonClassName,
        )}>
        <MediaPreview
          src={`${BASE_SRC}?v=${attempt}`}
          alt={`${bookmark_id} ${type}`}
          width={width ?? 1200}
          height={height ?? 1200}
          openSignal={previewOpenSignal}
          disableClickToOpen={disablePreviewOnClick}
          addZoom={!isVideo && hasValidImage}
          type={isVideo ? "video" : "image"}
          showFallback={showFallbackInPreview}
          poster={isVideo && item.metadata?.thumbnail_url ? item.metadata.thumbnail_url : undefined}
          className={cn(
            status === "loaded" ? "opacity-100" : "opacity-0",
            "transition-opacity duration-300 ease-in-out",
            imageClassName,
          )}
          buttonClassName="flex items-center justify-center h-full w-full"
          unoptimized={!isVideo ? true : undefined}
          onLoad={!isVideo ? () => setStatus("loaded") : undefined}
          onCanPlay={isVideo ? () => setStatus("loaded") : undefined}
          onError={() => setStatus("error")}
        />
      </div>
    </div>
  );
};
