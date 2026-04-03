"use client";

import * as React from "react";
import {useEffect, useState} from "react";
import {cn} from "@/lib/utils/classnames";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import MediaPreview from "@/components/ui/MediaPreview";
import type {Bookmark} from "../types";

interface BookmarkImageProps {
  bookmark_id: string;
  item: Bookmark;
  type: "preview" | "favicon" | "og";
  sizes?: string;
  quality?: number;
  loading?: "eager" | "lazy";
  previewOpenSignal?: number;
  disablePreviewOnClick?: boolean;
  divClassName?: string;
  imageClassName?: string;
  skeletonClassName?: string;
  height?: number;
  width?: number;
  fallbackClassName?: string;
  fill?: boolean;
}

function BookmarkImageImpl({
  bookmark_id,
  item,
  type,
  sizes,
  quality,
  loading,
  previewOpenSignal,
  disablePreviewOnClick,
  divClassName,
  imageClassName,
  skeletonClassName,
  height,
  width,
  fallbackClassName,
  fill,
}: BookmarkImageProps) {
  let baseSrc = "";

  switch (type) {
    case "preview":
      baseSrc = item.preview_image ?? "";
      break;
    case "favicon":
      baseSrc = buildR2PublicUrl(`favicons/${bookmark_id}/favicon.png`);
      break;
  }

  const maxRetries = 12;
  const retryMs = 2000;
  const imageWidth = width ?? 1200;
  const imageHeight = height ?? 1200;
  const imageLoading = loading ?? "lazy";
  const imageQuality = quality ?? (type === "preview" ? 50 : 60);
  const imageSizes =
    sizes ??
    (type === "favicon"
      ? `${imageWidth}px`
      : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw");

  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  const isVideo = baseSrc.toLowerCase().endsWith(".mp4") || baseSrc.toLowerCase().endsWith(".mov");
  const hasValidImage = !!baseSrc && status === "loaded";
  const showFallbackInPreview = type === "preview" && !hasValidImage;

  useEffect(() => {
    if (status !== "error") return;
    if (attempt >= maxRetries) return;

    const timer = window.setTimeout(() => {
      setAttempt((current) => current + 1);
      setStatus("loading");
    }, retryMs);

    return () => window.clearTimeout(timer);
  }, [attempt, status]);

  return (
    <div
      className={cn(
        fill ? "absolute inset-0" : "relative",
        "grid place-items-center",
        divClassName,
      )}
      style={
        !fill && imageWidth > 0 && imageHeight > 0
          ? {aspectRatio: `${imageWidth} / ${imageHeight}`}
          : undefined
      }>
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

      <div
        className={cn(
          fill ? "absolute inset-0" : "relative h-full w-full",
          "col-start-1 row-start-1 flex items-center justify-center",
          status !== "loaded" && "bg-muted animate-pulse",
          skeletonClassName,
        )}>
        <MediaPreview
          src={`${baseSrc}?v=${attempt}`}
          alt={`${bookmark_id} ${type}`}
          width={imageWidth}
          height={imageHeight}
          sizes={imageSizes}
          quality={imageQuality}
          loading={imageLoading}
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
          buttonClassName="flex h-full w-full items-center justify-center"
          onLoad={!isVideo ? () => setStatus("loaded") : undefined}
          onCanPlay={isVideo ? () => setStatus("loaded") : undefined}
          onError={() => setStatus("error")}
        />
      </div>
    </div>
  );
}

export const BookmarkImage = React.memo(BookmarkImageImpl, (prev, next) => {
  return (
    prev.bookmark_id === next.bookmark_id &&
    prev.type === next.type &&
    prev.sizes === next.sizes &&
    prev.quality === next.quality &&
    prev.loading === next.loading &&
    prev.previewOpenSignal === next.previewOpenSignal &&
    prev.disablePreviewOnClick === next.disablePreviewOnClick &&
    prev.divClassName === next.divClassName &&
    prev.imageClassName === next.imageClassName &&
    prev.skeletonClassName === next.skeletonClassName &&
    prev.height === next.height &&
    prev.width === next.width &&
    prev.fallbackClassName === next.fallbackClassName &&
    prev.fill === next.fill &&
    prev.item.id === next.item.id &&
    prev.item.preview_image === next.item.preview_image &&
    prev.item.metadata?.thumbnail_url === next.item.metadata?.thumbnail_url
  );
});
