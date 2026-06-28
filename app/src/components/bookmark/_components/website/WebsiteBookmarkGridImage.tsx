"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import MediaPreview from "@/features/media/components/MediaPreview";
import type {Bookmark} from "@/components/bookmark/types";
import type {WebsiteImages, WebsiteImageStatus} from "@/db/schema";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {useViewOptionsStore} from "@/store/use-view-options";
import {isWebsiteImages} from "@/components/bookmark/_utils/bookmark-image-guards";
import {useWebsiteImageLoading} from "@/components/bookmark/_hooks/use-website-image-loading";

interface WebsiteBookmarkGridImageProps {
  item: Bookmark;
  previewOpenSignal?: number;
  divClassName?: string;
  skeletonClassName?: string;
  onPreviewOpenChange?: (open: boolean) => void;
}

function getPreferredGridImage(
  images: WebsiteImages | undefined,
): {key: string; width: number; height: number; status?: WebsiteImageStatus} | null {
  if (!images) return null;

  const resolved = images.selected === "og" ? images.og : images.preview;

  return {
    key: resolved?.key ?? "",
    width: resolved?.width ?? 1200,
    height: resolved?.height ?? 750,
    status: resolved?.status,
  };
}

export default function WebsiteBookmarkGridImage({
  item,
  previewOpenSignal,
  divClassName,
  skeletonClassName,
  onPreviewOpenChange,
}: WebsiteBookmarkGridImageProps) {
  const websiteImages = isWebsiteImages(item.images) ? item.images : undefined;
  const preferredImage = getPreferredGridImage(websiteImages);
  const baseSrc = preferredImage?.key ? buildR2PublicUrl(preferredImage.key) : "";
  const columnSize = useViewOptionsStore((state) => state.columnSize);
  const image = useWebsiteImageLoading({
    baseSrc,
    assetStatus: preferredImage?.status,
    width: preferredImage?.width ?? 1200,
    height: preferredImage?.height ?? 750,
  });

  const previewSize = (() => {
    if (columnSize <= 2) return "large";
    if (columnSize <= 4) return "medium";
    return "small";
  })();

  return (
    <div
      className={cn("absolute inset-0", "grid place-items-center overflow-hidden", divClassName)}>
      <div
        className={cn(
          "absolute inset-0",
          "col-start-1 row-start-1 flex items-center justify-center",
          image.showSkeleton && "bg-muted animate-pulse",
          image.isFailed && "bg-muted",
          skeletonClassName,
        )}>
        {baseSrc ? (
          <MediaPreview
            src={`${baseSrc}?size=${previewSize}&format=webp&v=${image.attempt}`}
            fullSizeSrc={`${baseSrc}?size=orig&v=${image.attempt}`}
            alt={`${item.title || item.url} preview`}
            width={image.imageWidth}
            height={image.imageHeight}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={60}
            loading="lazy"
            openSignal={previewOpenSignal}
            disableClickToOpen={true}
            isGallery={false}
            showFallback={!image.hasValidImage}
            className={cn(
              image.status === "loaded" ? "opacity-100" : "opacity-0",
              "h-full w-full object-cover transition-opacity duration-300 ease-in-out",
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
