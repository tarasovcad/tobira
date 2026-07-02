"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import MediaPreview from "@/features/media/components/MediaPreview";
import type {WebsiteBookmark} from "@/components/bookmark/types";
import type {WebsiteImageAsset, WebsiteImages} from "@/db/schema";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {isWebsiteImages} from "@/components/bookmark/_utils/bookmark-image-guards";
import {useWebsiteImageLoading} from "@/components/bookmark/_hooks/use-website-image-loading";
import {buildWebsiteAssetUrl} from "@/components/bookmark/_utils/website-asset-url";

interface BookmarkImageProps {
  item: WebsiteBookmark;
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
  fill?: boolean;
  onPreviewOpenChange?: (open: boolean) => void;
}

function getWebsiteImageAsset(
  images: WebsiteImages | undefined,
  type: "preview" | "favicon" | "og",
): WebsiteImageAsset | undefined {
  if (!images) return undefined;

  switch (type) {
    case "preview":
      return images.preview;
    case "favicon":
      return images.favicon;
    case "og":
      return images.og;
    default:
      return undefined;
  }
}

export default function WebsiteBookmarkMenuImage({
  item,
  type,
  loading,
  previewOpenSignal,
  disablePreviewOnClick,
  divClassName,
  imageClassName,
  skeletonClassName,
  height,
  width,
  fill,
  onPreviewOpenChange,
}: BookmarkImageProps) {
  const imageAsset = isWebsiteImages(item.images)
    ? getWebsiteImageAsset(item.images, type)
    : undefined;
  const imageKey = imageAsset?.key;
  const baseSrc = imageKey ? buildR2PublicUrl(imageKey) : "";
  const image = useWebsiteImageLoading({
    baseSrc,
    assetVersion: imageAsset?.fetchedAt,
    assetStatus: imageAsset?.status,
    width,
    height,
    loading,
  });

  return (
    <div
      className={cn(
        fill ? "absolute inset-0" : "relative",
        "grid place-items-center",
        divClassName,
      )}
      style={
        !fill && image.imageWidth > 0 && image.imageHeight > 0
          ? {aspectRatio: `${image.imageWidth} / ${image.imageHeight}`}
          : undefined
      }>
      <div
        className={cn(
          fill ? "absolute inset-0" : "relative h-full w-full",
          "col-start-1 row-start-1 flex items-center justify-center",
          image.showSkeleton && "bg-muted animate-pulse",
          image.isFailed && "bg-muted",
          skeletonClassName,
        )}>
        {baseSrc ? (
          <MediaPreview
            src={buildWebsiteAssetUrl(baseSrc, {
              size: "medium",
              fetchedAt: imageAsset?.fetchedAt,
              attempt: image.attempt,
            })}
            fullSizeSrc={buildWebsiteAssetUrl(baseSrc, {
              size: "orig",
              fetchedAt: imageAsset?.fetchedAt,
              attempt: image.attempt,
            })}
            alt={`${item.id} ${type}`}
            width={image.imageWidth}
            height={image.imageHeight}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw)"
            quality={100}
            loading={image.imageLoading}
            openSignal={previewOpenSignal}
            disableClickToOpen={disablePreviewOnClick}
            showFallback={!image.hasValidImage}
            className={cn(
              image.status === "loaded" ? "opacity-100" : "opacity-0",
              "transition-opacity duration-300 ease-in-out",
              imageClassName,
            )}
            buttonClassName="flex h-full w-full items-center justify-center"
            onOpenChange={onPreviewOpenChange}
            onLoad={image.markLoaded}
            onError={image.markFailed}
          />
        ) : null}
      </div>
    </div>
  );
}
