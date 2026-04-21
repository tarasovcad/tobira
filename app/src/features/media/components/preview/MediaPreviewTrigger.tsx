import Image from "next/image";
import {useState, type KeyboardEvent, type RefObject} from "react";
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
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);

  const canOpenPreview = type !== "video" && !disableClickToOpen;
  const isThumbnailPlaying = isHovered && !isManuallyPaused;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canOpenPreview) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    openPreview();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      ref={triggerRef}
      onClick={canOpenPreview ? openPreview : undefined}
      onMouseEnter={() => {
        setIsHovered(true);
        setHasInteracted(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsManuallyPaused(false);
      }}
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
            setIsManuallyPaused((prev) => !prev);
          }}>
          {poster && !hasInteracted ? (
            <Image
              src={poster}
              alt={alt}
              width={width}
              height={height}
              sizes={sizes}
              quality={quality}
              loading={loading}
              className={cn(className, "absolute inset-0 h-full w-full object-cover")}
              unoptimized={unoptimized}
              onLoad={onCanPlay}
              onError={onError}
            />
          ) : (
            <CustomVideoPlayer
              src={src}
              className={className}
              videoClassName="h-full w-full object-cover"
              loop
              autoPlay={isThumbnailPlaying}
              playing={isThumbnailPlaying}
              muted
              playsInline
              preload="metadata"
              showMainPlayIcon={false}
              minimal
              controlsVisible={isHovered}
              disableClickToggle
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
