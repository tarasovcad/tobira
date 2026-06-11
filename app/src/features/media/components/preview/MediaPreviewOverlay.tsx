import type {PointerEventHandler, ReactNode, RefObject, WheelEventHandler} from "react";
import {PreviewToolbar} from "./PreviewToolbar";
import {PreviewSurface} from "./PreviewSurface";
import type {Pan, Rect} from "./types";
import {VideoPlayerShell} from "@/features/video-player/components/VideoPlayerShell";
import type {VideoPlayerSession} from "@/features/video-player/types";
import {cn} from "@/lib/utils";

type MediaPreviewOverlayProps = {
  overlayRef: RefObject<HTMLDivElement | null>;
  expanded: boolean;
  animatedRect: Rect;
  fadeSurfaceOnClose?: boolean;
  zoom: number;
  pan: Pan;
  isDragging: boolean;
  src: string;
  fullSizeSrc?: string;
  alt: string;
  previewClassName?: string;
  type: "image" | "video";
  isGallery?: boolean;
  addZoom: boolean;
  showFallback: boolean;
  fallback?: ReactNode;
  videoSession?: VideoPlayerSession;
  closePreview: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  slideshowActive?: boolean;
  slideshowProgress?: number;
  onToggleSlideshow?: () => void;
  slideshowDisabled?: boolean;
  animateLayout?: boolean;
  onToggleThumbnailRail?: () => void;
  handleZoomControlClick: () => void;
  handleMediaClick: () => void;
  handleWheelZoom: WheelEventHandler<HTMLDivElement>;
  handleMediaPointerDown: PointerEventHandler<HTMLDivElement>;
  handleMediaPointerMove: PointerEventHandler<HTMLDivElement>;
  handleMediaPointerUp: PointerEventHandler<HTMLDivElement>;
  handleMediaPointerCancel: PointerEventHandler<HTMLDivElement>;
};

function DefaultFallback() {
  return (
    <>
      <svg
        width={64}
        height={64}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground/50">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.375 2.5C16.1009 2.5 17.5 3.89911 17.5 5.625V14.375C17.5 16.1009 16.1009 17.5 14.375 17.5H5.625C3.89911 17.5 2.5 16.1009 2.5 14.375V5.625C2.5 3.89911 3.89911 2.5 5.625 2.5H14.375ZM7.99235 11.3257C7.26015 10.5937 6.07318 10.5937 5.34098 11.3257L3.75 12.9167V14.375C3.75 15.4105 4.58947 16.25 5.625 16.25H12.9167L7.99235 11.3257ZM12.5 5.41667C11.3494 5.41667 10.4167 6.34941 10.4167 7.5C10.4167 8.65058 11.3494 9.58333 12.5 9.58333C13.6506 9.58333 14.5833 8.65058 14.5833 7.5C14.5833 6.34941 13.6506 5.41667 12.5 5.41667Z"
          fill="currentColor"
        />
      </svg>
      <span className="text-muted-foreground/50 text-center text-sm">No preview available</span>
    </>
  );
}

export function MediaPreviewOverlay({
  overlayRef,
  expanded,
  animatedRect,
  fadeSurfaceOnClose = false,
  zoom,
  pan,
  isDragging,
  src,
  fullSizeSrc,
  alt,
  previewClassName,
  type,
  isGallery = false,
  addZoom,
  showFallback,
  fallback,
  videoSession,
  closePreview,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  slideshowActive = false,
  slideshowProgress = 0,
  onToggleSlideshow,
  slideshowDisabled = false,
  animateLayout = true,
  onToggleThumbnailRail,
  handleZoomControlClick,
  handleMediaClick,
  handleWheelZoom,
  handleMediaPointerDown,
  handleMediaPointerMove,
  handleMediaPointerUp,
  handleMediaPointerCancel,
}: MediaPreviewOverlayProps) {
  const isInteractive = type === "image" && addZoom && !showFallback;
  const previewContentClassName =
    type === "video"
      ? "bg-black flex items-center justify-center"
      : showFallback
        ? "bg-muted flex flex-col items-center justify-center gap-3"
        : undefined;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-100" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Close preview"
        className={cn(
          "absolute inset-0 bg-black/60 transition-opacity duration-[180ms]",
          expanded ? "opacity-100" : "opacity-0",
        )}
        onClick={closePreview}
      />
      <PreviewToolbar
        zoom={zoom}
        expanded={expanded}
        onZoomToggle={handleZoomControlClick}
        slideshowActive={slideshowActive}
        slideshowProgress={slideshowProgress}
        onToggleSlideshow={onToggleSlideshow}
        slideshowDisabled={slideshowDisabled}
        onToggleDisplayMode={onToggleThumbnailRail}
        onClose={closePreview}
        isGallery={isGallery}
        addZoom={isInteractive}
      />
      {isGallery ? (
        <>
          <button
            type="button"
            aria-label="Previous item"
            onClick={(event) => {
              event.stopPropagation();
              onPrevious?.();
            }}
            disabled={!onPrevious || !hasPrevious}
            className={cn(
              "hit-area-4 absolute top-1/2 left-4 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/40 p-2.5 text-white/90 shadow-xl backdrop-blur-md transition-all duration-[180ms] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-black/40",
              expanded ? "opacity-100" : "pointer-events-none opacity-0",
            )}>
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
            aria-label="Next item"
            onClick={(event) => {
              event.stopPropagation();
              onNext?.();
            }}
            disabled={!onNext || !hasNext}
            className={cn(
              "hit-area-4 absolute top-1/2 right-4 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/40 p-2.5 text-white/90 shadow-xl backdrop-blur-md transition-all duration-[180ms] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-black/40",
              expanded ? "opacity-100" : "pointer-events-none opacity-0",
            )}>
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
        </>
      ) : null}

      <PreviewSurface
        animatedRect={animatedRect}
        expanded={expanded}
        zoom={zoom}
        pan={pan}
        isDragging={isDragging}
        interactive={isInteractive}
        animateLayout={animateLayout}
        fadeWhenCollapsed={fadeSurfaceOnClose}
        onClick={handleMediaClick}
        onWheel={handleWheelZoom}
        onPointerDown={handleMediaPointerDown}
        onPointerMove={handleMediaPointerMove}
        onPointerUp={handleMediaPointerUp}
        onPointerCancel={handleMediaPointerCancel}
        className={cn(previewClassName, previewContentClassName)}>
        {type === "video" ? (
          videoSession ? (
            <VideoPlayerShell
              session={videoSession}
              className="h-full w-full bg-black"
              videoClassName="h-full w-full object-contain"
              showMainPlayIcon
              minimal
            />
          ) : null
        ) : showFallback ? (
          (fallback ?? <DefaultFallback />)
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={fullSizeSrc ?? src} alt={alt} className="h-full w-full object-cover" />
        )}
      </PreviewSurface>
    </div>
  );
}
