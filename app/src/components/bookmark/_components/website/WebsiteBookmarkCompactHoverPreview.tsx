"use client";

import MediaPreview from "@/features/media/components/MediaPreview";
import {useWebsiteImageLoading} from "@/components/bookmark/_hooks/use-website-image-loading";
import {buildWebsiteAssetUrl} from "@/components/bookmark/_utils/website-asset-url";
import type {WebsiteBookmark} from "@/components/bookmark/types";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {cn} from "@/lib/utils";

function getSelectedWebsitePreviewImage(images: WebsiteBookmark["images"]) {
  if (!images) return undefined;

  const resolved = images.selected === "og" ? images.og : images.preview;

  return {
    key: resolved?.key ?? "",
    width: resolved?.width ?? 1200,
    height: resolved?.height ?? 675,
    status: resolved?.status,
    fetchedAt: resolved?.fetchedAt,
  };
}

export function hasWebsiteBookmarkPreviewImage(item: WebsiteBookmark) {
  return Boolean(getSelectedWebsitePreviewImage(item.images)?.key);
}

export default function WebsiteBookmarkCompactHoverPreviewContent({item}: {item: WebsiteBookmark}) {
  const previewImage = getSelectedWebsitePreviewImage(item.images);
  const baseSrc = previewImage?.key ? buildR2PublicUrl(previewImage.key) : "";
  const image = useWebsiteImageLoading({
    baseSrc,
    assetVersion: previewImage?.fetchedAt,
    assetStatus: previewImage?.status,
    width: previewImage?.width ?? 1200,
    height: previewImage?.height ?? 675,
  });

  if (!baseSrc) return null;

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden",
        image.showSkeleton && "bg-muted animate-pulse",
        image.isFailed && "bg-muted",
      )}>
      <MediaPreview
        src={buildWebsiteAssetUrl(baseSrc, {
          size: "small",
          format: "webp",
          fetchedAt: previewImage?.fetchedAt,
          attempt: image.attempt,
        })}
        fullSizeSrc={buildWebsiteAssetUrl(baseSrc, {
          size: "orig",
          fetchedAt: previewImage?.fetchedAt,
          attempt: image.attempt,
        })}
        alt={`${item.title || item.url} preview`}
        width={image.imageWidth}
        height={image.imageHeight}
        sizes="176px"
        quality={60}
        loading="lazy"
        disableClickToOpen={true}
        showFallback={!image.hasValidImage}
        className={cn(
          image.status === "loaded" ? "opacity-100" : "opacity-0",
          "h-full w-full object-cover transition-opacity duration-200 ease-out",
        )}
        buttonClassName="h-full w-full"
        onLoad={image.markLoaded}
        onError={image.markFailed}
      />
    </div>
  );
}
