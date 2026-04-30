"use client";

import {useCallback, useEffect} from "react";
import {createPortal} from "react-dom";
import type {MediaGalleryEntry} from "@/components/bookmark/_utils/media-grid-render";
import {MediaPreviewOverlay} from "./preview/MediaPreviewOverlay";
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
} & UseMediaGalleryPreviewResult;

export function MediaGalleryOverlay({
  entries,
  controller,
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
  const activeIndex = galleryState.currentIndex;
  const currentEntry = activeIndex !== null ? (entries.at(activeIndex) ?? null) : null;
  const hasPrevious = activeIndex !== null && activeIndex > 0;
  const hasNext = activeIndex !== null && activeIndex < entries.length - 1;

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

  return createPortal(
    <MediaPreviewOverlay
      overlayRef={overlayRef}
      expanded={expanded}
      animatedRect={animatedRect}
      animateLayout={animateLayout}
      fadeSurfaceOnClose={fadeSurfaceOnClose}
      zoom={zoom}
      pan={pan}
      isDragging={isDragging}
      src={activePreviewItem.src}
      fullSizeSrc={activePreviewItem.type === "image" ? activePreviewItem.fullSizeSrc : undefined}
      alt={activePreviewItem.alt}
      type={activePreviewItem.type}
      addZoom={activePreviewItem.type === "image"}
      showFallback={false}
      videoSession={isCenterVideo ? centerVideoSession : undefined}
      closePreview={controller.requestClose}
      onPrevious={handlePrevious}
      onNext={handleNext}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      handleZoomControlClick={handleZoomControlClick}
      handleMediaClick={handleMediaClick}
      handleWheelZoom={handleWheelZoom}
      handleMediaPointerDown={handleMediaPointerDown}
      handleMediaPointerMove={handleMediaPointerMove}
      handleMediaPointerUp={handleMediaPointerUp}
      handleMediaPointerCancel={handleMediaPointerCancel}
    />,
    document.body,
  );
}
