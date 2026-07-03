"use client";

import {useMemo} from "react";
import MediaPreview from "@/features/media/components/MediaPreview";
import {useWebsiteImageLoading} from "@/components/bookmark/_hooks/use-website-image-loading";
import {buildWebsiteAssetUrl} from "@/components/bookmark/_utils/website-asset-url";
import type {WebsiteBookmark} from "@/components/bookmark/types";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {cn} from "@/lib/utils";
import {getCompactPreviewWidthPx, type CompactPreviewSize} from "@/store/use-view-options";

const DEFAULT_PREVIEW_WIDTH = 1200;
const DEFAULT_PREVIEW_HEIGHT = 675;
const HOVER_PREVIEW_MAX_RETRIES = 2;

type WebsiteBookmarkCompactHoverPreviewContentProps = {
  item: WebsiteBookmark;
  previewSize: CompactPreviewSize;
  onOpenFullscreen: () => void;
};

function getSelectedWebsitePreviewImage(images: WebsiteBookmark["images"]) {
  if (!images) return undefined;

  const selectedImage = images.selected === "og" ? images.og : images.preview;

  return {
    key: selectedImage?.key ?? "",
    width: selectedImage?.width ?? DEFAULT_PREVIEW_WIDTH,
    height: selectedImage?.height ?? DEFAULT_PREVIEW_HEIGHT,
    status: selectedImage?.status,
    fetchedAt: selectedImage?.fetchedAt,
  };
}

export function hasWebsiteBookmarkPreviewImage(item: WebsiteBookmark) {
  return Boolean(getSelectedWebsitePreviewImage(item.images)?.key);
}

export default function WebsiteBookmarkCompactHoverPreviewContent({
  item,
  previewSize,
  onOpenFullscreen,
}: WebsiteBookmarkCompactHoverPreviewContentProps) {
  const previewImage = useMemo(() => getSelectedWebsitePreviewImage(item.images), [item.images]);
  const baseSrc = useMemo(
    () => (previewImage?.key ? buildR2PublicUrl(previewImage.key) : ""),
    [previewImage],
  );
  const image = useWebsiteImageLoading({
    baseSrc,
    assetVersion: previewImage?.fetchedAt,
    assetStatus: previewImage?.status,
    width: previewImage?.width ?? DEFAULT_PREVIEW_WIDTH,
    height: previewImage?.height ?? DEFAULT_PREVIEW_HEIGHT,
    maxRetries: HOVER_PREVIEW_MAX_RETRIES,
  });
  const assetVersion = previewImage?.fetchedAt;
  const previewSrc = useMemo(
    () =>
      buildWebsiteAssetUrl(baseSrc, {
        size: "small",
        format: "webp",
        fetchedAt: assetVersion,
        attempt: image.attempt,
      }),
    [assetVersion, baseSrc, image.attempt],
  );
  const fullSizeSrc = useMemo(
    () =>
      buildWebsiteAssetUrl(baseSrc, {
        size: "orig",
        fetchedAt: assetVersion,
        attempt: image.attempt,
      }),
    [assetVersion, baseSrc, image.attempt],
  );
  const alt = useMemo(() => `${item.title || item.url} preview`, [item.title, item.url]);
  const previewWidth = getCompactPreviewWidthPx(previewSize);
  const isImageVisible = image.status === "loaded";

  if (!baseSrc) return null;

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden",
        image.showSkeleton && "bg-muted animate-pulse",
        image.isFailed && "bg-muted",
      )}>
      <MediaPreview
        src={previewSrc}
        fullSizeSrc={fullSizeSrc}
        alt={alt}
        width={image.imageWidth}
        height={image.imageHeight}
        sizes={`${previewWidth}px`}
        quality={60}
        loading="eager"
        unoptimized
        disableClickToOpen={false}
        closeAnimation="none"
        showFallback={!image.hasValidImage}
        className={cn(
          isImageVisible ? "opacity-100" : "opacity-0",
          "h-full w-full object-cover transition-none! duration-0",
        )}
        buttonClassName="h-full w-full"
        onLoad={image.markLoaded}
        onError={image.markFailed}
        onOpenChange={(open) => {
          if (open) onOpenFullscreen();
        }}
      />
    </div>
  );
}
