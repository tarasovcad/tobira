"use client";

import {createPortal} from "react-dom";
import type {MediaPreviewProps} from "./preview/types";
import {useMediaPreview} from "../hooks/useMediaPreview";
import {useCallback, useEffect, useRef} from "react";
import {MediaPreviewOverlay} from "./preview/MediaPreviewOverlay";
import {MediaPreviewTrigger} from "./preview/MediaPreviewTrigger";
import {useVideoPreviewSession} from "@/features/media/hooks/useVideoPreviewSession";

// Renders a thumbnail image or video with fullscreen, zoom, and pan preview behavior.
export default function MediaPreview({
  src,
  fullSizeSrc,
  alt,
  width = 1200,
  height = 1200,
  sizes,
  quality,
  loading = "lazy",
  openSignal,
  disableClickToOpen = false,
  isGallery = false,
  className,
  buttonClassName,
  previewClassName,
  type = "image",
  unoptimized,
  onLoad,
  onError,
  onCanPlay,
  addZoom = true,
  closeAnimation = "default",
  poster,
  showFallback = false,
  fallback,
  onOpenChange,
}: MediaPreviewProps & {poster?: string}) {
  const {
    triggerRef,
    overlayRef,
    open,
    expanded,
    animatedRect,
    zoom,
    pan,
    isDragging,
    openPreview,
    closePreview,
    handleZoomControlClick,
    handleWheelZoom,
    handleMediaPointerDown,
    handleMediaPointerMove,
    handleMediaPointerUp,
    handleMediaPointerCancel,
    handleMediaClick,
  } = useMediaPreview({width, height, onOpenChange, type, addZoom, closeAnimation});

  const handledOpenSignalRef = useRef<number | undefined>(undefined);
  const isVideo = type === "video";
  const {videoSession, isVideoHovered, prepareForOpen, setVideoHovered, warmVideo} =
    useVideoPreviewSession({
      enabled: isVideo,
      src,
      poster,
      open,
      onCanPlay,
      onError,
    });

  const openMediaPreview = useCallback(() => {
    if (isVideo) {
      prepareForOpen();
    }

    openPreview();
  }, [isVideo, openPreview, prepareForOpen]);

  useEffect(() => {
    if (!openSignal) return;
    if (handledOpenSignalRef.current === openSignal) return;

    handledOpenSignalRef.current = openSignal;
    openMediaPreview();
  }, [openMediaPreview, openSignal]);

  const shouldRenderOverlay = typeof document !== "undefined" && open && animatedRect;

  return (
    <>
      <MediaPreviewTrigger
        triggerRef={triggerRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        quality={quality}
        loading={loading}
        disableClickToOpen={disableClickToOpen}
        className={className}
        buttonClassName={buttonClassName}
        type={type}
        unoptimized={unoptimized}
        onLoad={onLoad}
        onError={onError}
        onCanPlay={onCanPlay}
        poster={poster}
        videoSession={isVideo ? videoSession : undefined}
        attachVideo={isVideo ? !open : false}
        controlsVisible={isVideo ? isVideoHovered : false}
        warmVideo={isVideo ? warmVideo : undefined}
        setVideoHovered={isVideo ? setVideoHovered : undefined}
        onVideoLeave={undefined}
        openPreview={openMediaPreview}
      />

      {shouldRenderOverlay
        ? createPortal(
            <MediaPreviewOverlay
              overlayRef={overlayRef}
              expanded={expanded}
              animatedRect={animatedRect}
              zoom={zoom}
              pan={pan}
              isDragging={isDragging}
              src={src}
              fullSizeSrc={fullSizeSrc}
              alt={alt}
              previewClassName={previewClassName}
              type={type}
              isGallery={isGallery}
              addZoom={addZoom}
              showFallback={showFallback}
              fallback={fallback}
              videoSession={isVideo ? videoSession : undefined}
              closePreview={closePreview}
              handleZoomControlClick={handleZoomControlClick}
              handleMediaClick={handleMediaClick}
              handleWheelZoom={handleWheelZoom}
              handleMediaPointerDown={handleMediaPointerDown}
              handleMediaPointerMove={handleMediaPointerMove}
              handleMediaPointerUp={handleMediaPointerUp}
              handleMediaPointerCancel={handleMediaPointerCancel}
            />,
            document.body,
          )
        : null}
    </>
  );
}
