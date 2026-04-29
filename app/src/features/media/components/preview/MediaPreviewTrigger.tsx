import Image from "next/image";
import {type FocusEvent, type KeyboardEvent, type RefObject} from "react";
import {VideoPlayerShell} from "@/features/video-player/components/VideoPlayerShell";
import type {VideoPlayerSession} from "@/features/video-player/types";
import {cn} from "@/lib/utils";

type MediaPreviewTriggerProps = {
  triggerRef: RefObject<HTMLDivElement | null>;
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  quality?: number;
  loading: "eager" | "lazy";
  disableClickToOpen: boolean;
  className?: string;
  buttonClassName?: string;
  type: "image" | "video";
  unoptimized?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  onCanPlay?: () => void;
  poster?: string;
  videoSession?: VideoPlayerSession;
  attachVideo?: boolean;
  controlsVisible?: boolean;
  warmVideo?: () => void;
  setVideoHovered?: (hovered: boolean) => void;
  onVideoLeave?: () => void;
  openPreview: () => void;
};

export function MediaPreviewTrigger({
  triggerRef,
  src,
  alt,
  width,
  height,
  sizes,
  quality,
  loading,
  disableClickToOpen,
  className,
  buttonClassName,
  type,
  unoptimized,
  onLoad,
  onError,
  onCanPlay,
  poster,
  videoSession,
  attachVideo = false,
  controlsVisible = false,
  warmVideo,
  setVideoHovered,
  onVideoLeave,
  openPreview,
}: MediaPreviewTriggerProps) {
  const canOpenPreview = !disableClickToOpen;

  // Check if the element is in selection mode and if so, don't show the hover state
  const isSelectionModeActive = (element: HTMLDivElement) =>
    element.closest('[data-selection-mode="true"]') !== null;

  const handleVideoIntentStart = (element: HTMLDivElement) => {
    if (isSelectionModeActive(element)) {
      setVideoHovered?.(false);
      return;
    }

    setVideoHovered?.(true);
    warmVideo?.();
  };

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (type !== "video") return;
    if (isSelectionModeActive(event.currentTarget)) {
      return;
    }

    warmVideo?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canOpenPreview) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openPreview();
  };

  return (
    <div
      role={canOpenPreview ? "button" : undefined}
      tabIndex={canOpenPreview ? 0 : undefined}
      ref={triggerRef}
      onClick={canOpenPreview ? openPreview : undefined}
      onMouseEnter={(event) => {
        if (type === "video") {
          handleVideoIntentStart(event.currentTarget);
        }
      }}
      onMouseLeave={() => {
        if (type === "video") {
          setVideoHovered?.(false);
          onVideoLeave?.();
        }
      }}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      className={cn(
        "block h-full w-full focus-visible:outline-none",
        canOpenPreview && "focus-visible:ring-ring cursor-pointer focus-visible:ring-2",
        type === "video" && "pointer-events-auto relative overflow-hidden",
        buttonClassName,
      )}>
      {type === "video" ? (
        <div
          className="bg-muted relative h-full w-full"
          onClick={(event) => {
            event.stopPropagation();
            if (canOpenPreview) {
              openPreview();
            }
          }}>
          {videoSession ? (
            <VideoPlayerShell
              session={videoSession}
              className={cn(className, "absolute inset-0 h-full w-full")}
              videoClassName="h-full w-full"
              showMainPlayIcon={false}
              minimal
              controlsVisible={controlsVisible}
              disableClickToggle
              onRequestFullscreen={canOpenPreview ? openPreview : undefined}
              attachVideo={attachVideo}
              placeholder={
                poster ? (
                  <Image
                    src={poster}
                    alt={alt}
                    width={width}
                    height={height}
                    sizes={sizes}
                    quality={quality}
                    loading={loading}
                    className={cn(className, "h-full w-full object-contain")}
                    unoptimized={unoptimized}
                    onLoad={onCanPlay}
                    onError={onError}
                  />
                ) : (
                  <div className={cn(className, "h-full w-full bg-black")} />
                )
              }
            />
          ) : null}
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          quality={quality}
          loading={loading}
          className={className}
          unoptimized={unoptimized}
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </div>
  );
}
