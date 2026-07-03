"use client";

import MediaPreview from "@/features/media/components/MediaPreview";
import {useWebsiteImageLoading} from "@/components/bookmark/_hooks/use-website-image-loading";
import {buildWebsiteAssetUrl} from "@/components/bookmark/_utils/website-asset-url";
import type {WebsiteBookmark} from "@/components/bookmark/types";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {cn} from "@/lib/utils";
import {getCompactPreviewWidthPx, type CompactPreviewSize} from "@/store/use-view-options";

const DEFAULT_PREVIEW_WIDTH = 1200;
const DEFAULT_PREVIEW_HEIGHT = 675;

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

function getPreviewAltText(item: WebsiteBookmark) {
  return `${item.title || item.url} preview`;
}

export function hasWebsiteBookmarkPreviewImage(item: WebsiteBookmark) {
  return Boolean(getSelectedWebsitePreviewImage(item.images)?.key);
}

export default function WebsiteBookmarkCompactHoverPreviewContent({
  item,
  previewSize,
  onOpenFullscreen,
}: WebsiteBookmarkCompactHoverPreviewContentProps) {
  const previewImage = getSelectedWebsitePreviewImage(item.images);
  const baseSrc = previewImage?.key ? buildR2PublicUrl(previewImage.key) : "";
  const image = useWebsiteImageLoading({
    baseSrc,
    assetVersion: previewImage?.fetchedAt,
    assetStatus: previewImage?.status,
    width: previewImage?.width ?? DEFAULT_PREVIEW_WIDTH,
    height: previewImage?.height ?? DEFAULT_PREVIEW_HEIGHT,
  });

  if (!baseSrc) return null;

  const assetVersion = previewImage?.fetchedAt;
  const previewSrc = buildWebsiteAssetUrl(baseSrc, {
    size: "small",
    format: "webp",
    fetchedAt: assetVersion,
    attempt: image.attempt,
  });
  const fullSizeSrc = buildWebsiteAssetUrl(baseSrc, {
    size: "orig",
    fetchedAt: assetVersion,
    attempt: image.attempt,
  });
  const previewWidth = getCompactPreviewWidthPx(previewSize);
  const isImageVisible = image.status === "loaded";

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
        alt={getPreviewAltText(item)}
        width={image.imageWidth}
        height={image.imageHeight}
        sizes={`${previewWidth}px`}
        quality={60}
        loading="lazy"
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
