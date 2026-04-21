import type {PointerEventHandler, ReactNode, RefObject, WheelEventHandler} from "react";
import {PreviewToolbar} from "./PreviewToolbar";
import {PreviewSurface} from "./PreviewSurface";
import type {Pan, Rect} from "./types";
import CustomVideoPlayer from "@/features/video-player/components/CustomVideoPlayer";
import {cn} from "@/lib/utils";

type MediaPreviewOverlayProps = {
  overlayRef: RefObject<HTMLDivElement | null>;
  expanded: boolean;
  animatedRect: Rect;
  zoom: number;
  pan: Pan;
  isDragging: boolean;
  src: string;
  fullSizeSrc?: string;
  alt: string;
  previewClassName?: string;
  type: "image" | "video";
  addZoom: boolean;
  showFallback: boolean;
  fallback?: ReactNode;
  poster?: string;
  closePreview: () => void;
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
  zoom,
  pan,
  isDragging,
  src,
  fullSizeSrc,
  alt,
  previewClassName,
  type,
  addZoom,
  showFallback,
  fallback,
  poster,
  closePreview,
  handleZoomControlClick,
  handleMediaClick,
  handleWheelZoom,
  handleMediaPointerDown,
  handleMediaPointerMove,
  handleMediaPointerUp,
  handleMediaPointerCancel,
}: MediaPreviewOverlayProps) {
  const isInteractive = addZoom && !showFallback;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-100">
      <button
        type="button"
        aria-label="Close image preview"
        className={cn(
          "absolute inset-0 bg-black/60 transition-opacity duration-250",
          expanded ? "opacity-100" : "opacity-0",
        )}
        onClick={closePreview}
      />
      <PreviewToolbar
        zoom={zoom}
        expanded={expanded}
        onZoomToggle={handleZoomControlClick}
        onClose={closePreview}
        addZoom={isInteractive}
      />

      <PreviewSurface
        animatedRect={animatedRect}
        zoom={zoom}
        pan={pan}
        isDragging={isDragging}
        interactive={isInteractive}
        onClick={handleMediaClick}
        onWheel={handleWheelZoom}
        onPointerDown={handleMediaPointerDown}
        onPointerMove={handleMediaPointerMove}
        onPointerUp={handleMediaPointerUp}
        onPointerCancel={handleMediaPointerCancel}
        className={cn(
          previewClassName,
          showFallback && "bg-muted flex flex-col items-center justify-center gap-3",
        )}>
        {type === "video" ? (
          <CustomVideoPlayer
            src={src}
            className="h-full w-full object-cover"
            loop
            autoPlay
            muted={false}
            playsInline
            showMainPlayIcon
            minimal
            poster={poster}
          />
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
