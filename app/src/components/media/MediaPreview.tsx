"use client";

import {createPortal} from "react-dom";
import type {MediaPreviewProps} from "./preview/types";
import {useMediaPreview} from "./preview/useMediaPreview";
import {useEffect} from "react";
import {MediaPreviewOverlay} from "./preview/MediaPreviewOverlay";
import {MediaPreviewTrigger} from "./preview/MediaPreviewTrigger";

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
  className,
  buttonClassName,
  previewClassName,
  type = "image",
  unoptimized,
  onLoad,
  onError,
  onCanPlay,
  addZoom = true,
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
    fromRect,
    activeRect,
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
  } = useMediaPreview({width, height, onOpenChange});

  useEffect(() => {
    if (!openSignal) return;
    openPreview();
  }, [openPreview, openSignal]);

  const shouldRenderOverlay =
    typeof document !== "undefined" && open && fromRect && activeRect && animatedRect;

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
        openPreview={openPreview}
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
              addZoom={addZoom}
              showFallback={showFallback}
              fallback={fallback}
              poster={poster}
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
