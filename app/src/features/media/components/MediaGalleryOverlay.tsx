"use client";

import {useCallback, useEffect, useState} from "react";
import {createPortal} from "react-dom";
import type {MediaGalleryEntry} from "@/components/bookmark/_utils/media-grid-render";
import {MediaPreviewOverlay} from "./preview/MediaPreviewOverlay";
import {PreviewThumbnailRail} from "./preview/PreviewThumbnailRail";
import {useVideoPlayerSession} from "@/features/video-player/hooks/useVideoPlayerSession";
import {
  useMediaGalleryControllerSnapshot,
  type MediaGalleryController,
} from "@/features/media/hooks/useMediaGalleryController";
import type {UseMediaGalleryPreviewResult} from "@/features/media/hooks/useMediaGalleryPreview";
import {isEditableElementActive} from "@/features/video-player/utils";

type MediaGalleryOverlayProps = {
  entries: MediaGalleryEntry[];
  controller: MediaGalleryController;
  isFetchingNextPage: boolean;
} & UseMediaGalleryPreviewResult;

const SLIDESHOW_DURATION_MS = 2500;
const SLIDESHOW_TICK_MS = 100;

export function MediaGalleryOverlay({
  entries,
  controller,
  isFetchingNextPage,
  overlayRef,
  open,
  expanded,
  animatedRect,
  animateLayout,
  fadeSurfaceOnClose,
  zoom,
  pan,
  isDragging,
  handleZoomControlClick,
  handleMediaClick,
  handleWheelZoom,
  handleMediaPointerDown,
  handleMediaPointerMove,
  handleMediaPointerUp,
  handleMediaPointerCancel,
}: MediaGalleryOverlayProps) {
  const galleryState = useMediaGalleryControllerSnapshot(controller);
  const [thumbnailRailVisible, setThumbnailRailVisible] = useState(true);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [slideshowProgress, setSlideshowProgress] = useState(0);
  const activeIndex = galleryState.currentIndex;
  const currentEntry = activeIndex !== null ? (entries.at(activeIndex) ?? null) : null;
  const hasPrevious = activeIndex !== null && activeIndex > 0;
  const hasNext = activeIndex !== null && activeIndex < entries.length - 1;
  const canRunSlideshow = entries.length > 1 && activeIndex !== null;

  const activePreviewItem = currentEntry?.previewItem ?? null;
  const isCenterVideo = activePreviewItem?.type === "video";
  const sharedCenterVideoSession = controller.getVideoSession(
    isCenterVideo ? (currentEntry?.renderId ?? null) : null,
  );

  const fallbackCenterVideoSession = useVideoPlayerSession({
    enabled: isCenterVideo && !sharedCenterVideoSession,
    src: isCenterVideo && open ? activePreviewItem?.src : undefined,
    poster: isCenterVideo ? activePreviewItem?.poster : undefined,
    loop: isCenterVideo,
    playsInline: isCenterVideo,
    preload: isCenterVideo && open ? "auto" : undefined,
    unmuteOnFirstInteraction: isCenterVideo,
  });
  const centerVideoSession = sharedCenterVideoSession ?? fallbackCenterVideoSession;

  const handleSelectEntry = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= entries.length) {
        return;
      }

      const nextEntry = entries.at(nextIndex);

      if (!nextEntry || nextIndex === activeIndex) {
        return;
      }

      setSlideshowProgress(0);
      controller.selectItem({
        index: nextIndex,
        renderId: nextEntry.renderId,
        width: nextEntry.previewItem.width,
        height: nextEntry.previewItem.height,
      });
    },
    [activeIndex, controller, entries],
  );

  const handlePrevious = useCallback(() => {
    if (activeIndex === null) {
      return;
    }

    handleSelectEntry(activeIndex - 1);
  }, [activeIndex, handleSelectEntry]);

  const handleNext = useCallback(() => {
    if (activeIndex === null) {
      return;
    }

    handleSelectEntry(activeIndex + 1);
  }, [activeIndex, handleSelectEntry]);

  const handleToggleThumbnailRail = useCallback(() => {
    setThumbnailRailVisible((visible) => !visible);
  }, []);

  const handleToggleSlideshow = useCallback(() => {
    if (!canRunSlideshow) {
      return;
    }

    setIsSlideshowActive((active) => !active);
    setSlideshowProgress(0);
  }, [canRunSlideshow]);

  useEffect(() => {
    if (open && canRunSlideshow) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSlideshowActive(false);
      setSlideshowProgress(0);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [canRunSlideshow, open]);

  useEffect(() => {
    if (!open || !isSlideshowActive || activeIndex === null || entries.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSlideshowProgress((currentProgress) => {
        const nextProgress = currentProgress + SLIDESHOW_TICK_MS / SLIDESHOW_DURATION_MS;

        if (nextProgress < 1) {
          return nextProgress;
        }

        const nextIndex = activeIndex + 1 < entries.length ? activeIndex + 1 : 0;
        handleSelectEntry(nextIndex);
        return 0;
      });
    }, SLIDESHOW_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [activeIndex, entries.length, handleSelectEntry, isSlideshowActive, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableElementActive()) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrevious();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown, {capture: true});
    return () => window.removeEventListener("keydown", handleKeyDown, {capture: true});
  }, [handleNext, handlePrevious, open]);

  if (typeof document === "undefined" || !open || !animatedRect || !activePreviewItem) {
    return null;
  }

  const overlayRect =
    thumbnailRailVisible && expanded
      ? (() => {
          const scale = 0.96;
          const width = animatedRect.width * scale;
          const height = animatedRect.height * scale;

          return {
            top: animatedRect.top - 28 + (animatedRect.height - height) / 2,
            left: animatedRect.left + (animatedRect.width - width) / 2,
            width,
            height,
          };
        })()
      : animatedRect;

  return createPortal(
    <>
      <MediaPreviewOverlay
        overlayRef={overlayRef}
        expanded={expanded}
        animatedRect={overlayRect}
        animateLayout={animateLayout}
        fadeSurfaceOnClose={fadeSurfaceOnClose}
        zoom={zoom}
        pan={pan}
        isDragging={isDragging}
        src={activePreviewItem.src}
        fullSizeSrc={activePreviewItem.type === "image" ? activePreviewItem.fullSizeSrc : undefined}
        alt={activePreviewItem.alt}
        type={activePreviewItem.type}
        isGallery
        addZoom={activePreviewItem.type === "image"}
        showFallback={false}
        videoSession={isCenterVideo ? centerVideoSession : undefined}
        closePreview={controller.requestClose}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        slideshowActive={isSlideshowActive}
        slideshowProgress={slideshowProgress}
        onToggleSlideshow={handleToggleSlideshow}
        slideshowDisabled={!canRunSlideshow}
        onToggleThumbnailRail={handleToggleThumbnailRail}
        handleZoomControlClick={handleZoomControlClick}
        handleMediaClick={handleMediaClick}
        handleWheelZoom={handleWheelZoom}
        handleMediaPointerDown={handleMediaPointerDown}
        handleMediaPointerMove={handleMediaPointerMove}
        handleMediaPointerUp={handleMediaPointerUp}
        handleMediaPointerCancel={handleMediaPointerCancel}
      />
      <PreviewThumbnailRail
        entries={entries}
        currentIndex={activeIndex}
        expanded={expanded}
        visible={thumbnailRailVisible}
        isFetchingNextPage={isFetchingNextPage}
        onSelect={handleSelectEntry}
      />
    </>,
    document.body,
  );
}
