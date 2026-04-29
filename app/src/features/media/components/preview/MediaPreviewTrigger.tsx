import Image from "next/image";
import {useState, type FocusEvent, type KeyboardEvent, type RefObject} from "react";
import CustomVideoPlayer from "@/features/video-player/components/CustomVideoPlayer";
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
  openPreview,
}: MediaPreviewTriggerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isThumbnailMuted, setIsThumbnailMuted] = useState(true);

  const canOpenPreview = type !== "video" && !disableClickToOpen;
  const isThumbnailPlaying = isVideoReady && isHovered && !isManuallyPaused;
  const shouldRenderVideo = type === "video" && (shouldLoadVideo || !poster);
  const shouldShowPoster = type === "video" && !!poster && !isVideoReady;

  // Check if the element is in selection mode and if so, don't show the hover state
  const isSelectionModeActive = (element: HTMLDivElement) =>
    element.closest('[data-selection-mode="true"]') !== null;

  const warmVideo = () => {
    if (type !== "video") return;
    setShouldLoadVideo(true);
  };

  const handleVideoIntentStart = (element: HTMLDivElement) => {
    if (isSelectionModeActive(element)) {
      setIsHovered(false);
      return;
    }

    setIsHovered(true);
    warmVideo();
  };

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (type !== "video") return;
    if (isSelectionModeActive(event.currentTarget)) {
      return;
    }

    warmVideo();
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
          setIsHovered(false);
          setIsManuallyPaused(false);
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

            if (!shouldLoadVideo) {
              setIsHovered(true);
              warmVideo();
              return;
            }

            if (!isVideoReady) {
              return;
            }

            if (isThumbnailMuted) {
              setIsThumbnailMuted(false);
              return;
            }

            setIsManuallyPaused((prev) => !prev);
          }}>
          {shouldRenderVideo ? (
            <CustomVideoPlayer
              src={src}
              className={cn(className, "absolute inset-0 h-full w-full")}
              videoClassName="h-full w-full"
              loop
              autoPlay={isThumbnailPlaying}
              playing={isThumbnailPlaying}
              muted={isThumbnailMuted}
              playsInline
              preload="auto"
              showMainPlayIcon={false}
              minimal
              controlsVisible={isHovered}
              disableClickToggle
              onCanPlay={() => {
                setIsVideoReady(true);
                onCanPlay?.();
              }}
              onError={onError}
              poster={poster}
            />
          ) : null}

          {shouldShowPoster ? (
            <Image
              src={poster}
              alt={alt}
              width={width}
              height={height}
              sizes={sizes}
              quality={quality}
              loading={loading}
              className={cn(
                className,
                "absolute inset-0 h-full w-full object-contain transition-opacity",
                shouldRenderVideo ? "pointer-events-none" : undefined,
              )}
              unoptimized={unoptimized}
              onLoad={onCanPlay}
              onError={onError}
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
