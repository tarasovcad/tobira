"use client";

import {createPortal} from "react-dom";
import Image from "next/image";
import {MIN_ZOOM} from "./media-preview/constants";
import {PreviewToolbar} from "./media-preview/PreviewToolbar";
import type {MediaPreviewProps} from "./media-preview/types";
import {useMediaPreview} from "./media-preview/useMediaPreview";
import {cn} from "@/lib/utils";
import CustomVideoPlayer from "./CustomVideoPlayer";
import {useState} from "react";

// Renders a thumbnail image or video with fullscreen, zoom, and pan preview behavior.
export default function MediaPreview({
  src,
  alt,
  width = 1200,
  height = 1200,
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
}: MediaPreviewProps & {poster?: string}) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

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
    handleMediaPointerDown,
    handleMediaPointerMove,
    handleMediaPointerUp,
    handleMediaPointerCancel,
    handleMediaClick,
    handleToggleFullscreen,
  } = useMediaPreview({width, height});

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        ref={triggerRef}
        onClick={openPreview}
        onMouseEnter={() => {
          setIsHovered(true);
          setHasInteracted(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPreview();
          }
        }}
        className={cn(
          "focus-visible:ring-ring block h-full w-full cursor-pointer focus-visible:ring-2 focus-visible:outline-none",
          type === "video" && "pointer-events-auto relative overflow-hidden",
          buttonClassName,
        )}>
        {type === "video" ? (
          <div className="bg-muted pointer-events-none relative h-full w-full">
            {poster && !hasInteracted ? (
              <>
                <Image
                  src={poster}
                  alt={alt}
                  width={width}
                  height={height}
                  className={cn(className, "absolute inset-0 h-full w-full object-cover")}
                  unoptimized={unoptimized}
                  onLoad={onCanPlay}
                  onError={onError}
                />
              </>
            ) : (
              <CustomVideoPlayer
                src={src}
                className={className}
                videoClassName="h-full w-full cursor-pointer object-cover"
                loop
                autoPlay={isHovered}
                playing={isHovered}
                muted
                playsInline
                showMainPlayIcon={false}
                minimal={true}
                onCanPlay={onCanPlay}
                onError={onError}
                poster={poster}
              />
            )}
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            unoptimized={unoptimized}
            onLoad={onLoad}
            onError={onError}
          />
        )}
      </div>

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
                addZoom={addZoom}
              />
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => e.stopPropagation()}
                className={`absolute top-1/2 left-4 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/40 p-2.5 text-white/90 shadow-xl backdrop-blur-md transition-all duration-250 hover:bg-white/10 ${
                  expanded ? "opacity-100" : "pointer-events-none opacity-0"
                }`}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.2071 18.707C15.8166 19.0975 15.1836 19.0975 14.793 18.707L8.793 12.707C8.4025 12.3165 8.4025 11.6835 8.793 11.2929L14.793 5.29288C15.1836 4.90238 15.8166 4.90238 16.2071 5.29288C16.5976 5.68348 16.5976 6.31648 16.2071 6.70698L10.9141 12L16.2071 17.2929C16.5976 17.6834 16.5976 18.3165 16.2071 18.707Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => e.stopPropagation()}
                className={`absolute top-1/2 right-4 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/40 p-2.5 text-white/90 shadow-xl backdrop-blur-md transition-all duration-250 hover:bg-white/10 ${
                  expanded ? "opacity-100" : "pointer-events-none opacity-0"
                }`}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8.79289 5.29289C9.18342 4.90237 9.81643 4.90237 10.207 5.29289L16.207 11.2929C16.5975 11.6834 16.5975 12.3164 16.207 12.707L10.207 18.707C9.81643 19.0975 9.18342 19.0975 8.79289 18.707C8.40237 18.3164 8.40237 17.6834 8.79289 17.2929L14.0859 11.9999L8.79289 6.70696C8.40237 6.31643 8.40237 5.68342 8.79289 5.29289Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              {type === "video" ? (
                <div
                  onClick={addZoom ? handleMediaClick : undefined}
                  onWheel={addZoom ? handleWheelZoom : undefined}
                  onPointerDown={addZoom ? handleMediaPointerDown : undefined}
                  onPointerMove={addZoom ? handleMediaPointerMove : undefined}
                  onPointerUp={addZoom ? handleMediaPointerUp : undefined}
                  onPointerCancel={addZoom ? handleMediaPointerCancel : undefined}
                  className={`absolute overflow-hidden rounded-xl shadow-2xl transition-all duration-250 ease-out ${previewClassName ?? ""}`}
                  style={{
                    top: isFullscreen ? 0 : animatedRect.top,
                    left: isFullscreen ? 0 : animatedRect.left,
                    width: isFullscreen ? "100dvw" : animatedRect.width,
                    height: isFullscreen ? "100dvh" : animatedRect.height,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "center center",
                    borderRadius: isFullscreen ? 0 : undefined,
                    cursor: !addZoom
                      ? "auto"
                      : isDragging
                        ? "grabbing"
                        : zoom > MIN_ZOOM
                          ? "grab"
                          : "zoom-in",
                    touchAction: "none",
                  }}>
                  <CustomVideoPlayer
                    src={src}
                    className="h-full w-full object-cover"
                    loop
                    autoPlay
                    muted={false}
                    playsInline
                    showMainPlayIcon={true}
                    minimal={true}
                    poster={poster}
                  />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={src}
                  alt={alt}
                  onClick={addZoom ? handleMediaClick : undefined}
                  onWheel={addZoom ? handleWheelZoom : undefined}
                  onPointerDown={addZoom ? handleMediaPointerDown : undefined}
                  onPointerMove={addZoom ? handleMediaPointerMove : undefined}
                  onPointerUp={addZoom ? handleMediaPointerUp : undefined}
                  onPointerCancel={addZoom ? handleMediaPointerCancel : undefined}
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
                    cursor: !addZoom
                      ? "auto"
                      : isDragging
                        ? "grabbing"
                        : zoom > MIN_ZOOM
                          ? "grab"
                          : "zoom-in",
                    touchAction: "none",
                  }}
                />
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
