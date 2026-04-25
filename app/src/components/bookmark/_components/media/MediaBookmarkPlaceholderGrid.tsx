import {cn} from "@/lib/utils";
import {Skeleton} from "@/components/ui/coss/skeleton";
import type {Bookmark} from "@/components/bookmark/types";
import {useViewOptionsStore} from "@/store/use-view-options";

import CrossFade from "../shared/NewBookmarkCrossFade";
import type {MediaMediaItem} from "@/components/bookmark/types/metadata";
import {
  getBookmarkMediaPreviewItem,
  getBookmarkMediaPreviewSizeForColumnSize,
  getBookmarkMediaQualityForColumnSize,
  getBookmarkMediaSizesForColumnSize,
} from "@/features/media/components/bookmark/bookmark-images";
import {useEffect} from "react";
import {PLACEHOLDER_DONE_DELAY_MS} from "../../_hooks/use-placeholder-transition";
import MediaPreview from "@/features/media/components/MediaPreview";

export default function MediaBookmarkPlaceholderGrid({
  bookmark,
  mediaIndex = 0,
  pendingMediaItem,
  onDone,
}: {
  url: string;
  bookmark: Bookmark | null;
  mediaIndex?: number;
  pendingMediaItem?: MediaMediaItem;
  onDone: () => void;
}) {
  const loaded = !!bookmark;
  const {borderRadius, columnSize, gridGap} = useViewOptionsStore();
  const previewSize = getBookmarkMediaPreviewSizeForColumnSize(columnSize);
  const imageSizes = getBookmarkMediaSizesForColumnSize(columnSize);
  const imageQuality = getBookmarkMediaQualityForColumnSize(columnSize);
  const previewItem = bookmark
    ? getBookmarkMediaPreviewItem(bookmark, mediaIndex, previewSize)
    : null;

  const radiusClass =
    borderRadius === "none"
      ? "rounded-none"
      : borderRadius === "sm"
        ? "rounded-sm"
        : borderRadius === "md"
          ? "rounded-md"
          : "rounded-lg";

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(onDone, PLACEHOLDER_DONE_DELAY_MS);
    return () => clearTimeout(t);
  }, [loaded, onDone]);

  const aspectRatio =
    (previewItem?.width ?? pendingMediaItem?.size?.width ?? 0) > 0 &&
    (previewItem?.height ?? pendingMediaItem?.size?.height ?? 0) > 0
      ? `${previewItem?.width ?? pendingMediaItem?.size?.width} / ${previewItem?.height ?? pendingMediaItem?.size?.height}`
      : "16/9";

  return (
    <div
      className={cn(
        "bg-background relative block w-full overflow-hidden text-left",
        gridGap !== "none" && "border",
        radiusClass,
      )}
      style={{
        aspectRatio,
      }}>
      <CrossFade
        loaded={loaded}
        delay={0}
        fill
        className="h-full w-full"
        skeleton={<Skeleton className="h-full w-full" />}>
        {previewItem ? (
          <MediaPreview
            src={previewItem.src}
            fullSizeSrc={previewItem.type === "image" ? previewItem.fullSizeSrc : undefined}
            alt={previewItem.alt}
            width={previewItem.width}
            height={previewItem.height}
            poster={previewItem.poster}
            type={previewItem.type}
            sizes={imageSizes}
            quality={imageQuality}
            loading="lazy"
            className="h-full w-full object-cover"
            buttonClassName="h-full w-full"
          />
        ) : (
          <div className="bg-muted h-full w-full" />
        )}
      </CrossFade>
    </div>
  );
}
