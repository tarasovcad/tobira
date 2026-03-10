"use client";

import {createPortal} from "react-dom";
import Image from "next/image";
import {MIN_ZOOM} from "./image-preview/constants";
import {PreviewToolbar} from "./image-preview/PreviewToolbar";
import type {ImagePreviewProps} from "./image-preview/types";
import {useImagePreview} from "./image-preview/useImagePreview";

// Renders a thumbnail image with fullscreen, zoom, and pan preview behavior.
export default function ImagePreview({
  src,
  alt,
  width,
  height,
  className,
  previewClassName,
}: ImagePreviewProps) {
  const {
    triggerRef,
    overlayRef,
    open,
    expanded,
    isFullscreen,
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
    handleImagePointerDown,
    handleImagePointerMove,
    handleImagePointerUp,
    handleImagePointerCancel,
    handleImageClick,
    handleToggleFullscreen,
  } = useImagePreview({width, height});

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={openPreview}
        className="focus-visible:ring-ring rounded-lg focus-visible:ring-2 focus-visible:outline-none">
        <Image src={src} alt={alt} width={width} height={height} className={className} />
      </button>

      {typeof document !== "undefined" && open && fromRect && activeRect && animatedRect
        ? createPortal(
            <div ref={overlayRef} className="fixed inset-0 z-100">
              <button
                type="button"
                aria-label="Close image preview"
                className={`absolute inset-0 bg-black/60 transition-opacity duration-250 ${
                  expanded ? "opacity-100" : "opacity-0"
                }`}
                onClick={closePreview}
              />
              <PreviewToolbar
                zoom={zoom}
                isFullscreen={isFullscreen}
                expanded={expanded}
                onZoomToggle={handleZoomControlClick}
                onToggleFullscreen={handleToggleFullscreen}
                onClose={closePreview}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                onClick={handleImageClick}
                onWheel={handleWheelZoom}
                onPointerDown={handleImagePointerDown}
                onPointerMove={handleImagePointerMove}
                onPointerUp={handleImagePointerUp}
                onPointerCancel={handleImagePointerCancel}
                className={`absolute rounded-xl object-cover shadow-2xl transition-all duration-250 ease-out ${previewClassName ?? ""}`}
                style={{
                  top: isFullscreen ? 0 : animatedRect.top,
                  left: isFullscreen ? 0 : animatedRect.left,
                  width: isFullscreen ? "100dvw" : animatedRect.width,
                  height: isFullscreen ? "100dvh" : animatedRect.height,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  objectFit: isFullscreen ? "cover" : undefined,
                  borderRadius: isFullscreen ? 0 : undefined,
                  cursor: isDragging ? "grabbing" : zoom > MIN_ZOOM ? "grab" : "zoom-in",
                  touchAction: "none",
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
