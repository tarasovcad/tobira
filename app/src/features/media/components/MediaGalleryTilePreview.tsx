"use client";

import {useCallback, useEffect, useRef} from "react";
import {MediaPreviewTrigger} from "./preview/MediaPreviewTrigger";
import {
  useMediaGalleryVideoMode,
  type MediaGalleryController,
} from "@/features/media/hooks/useMediaGalleryController";
import {useVideoPreviewSession} from "@/features/media/hooks/useVideoPreviewSession";

type MediaGalleryTilePreviewProps = {
  controller: MediaGalleryController;
  index: number;
  renderId: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  quality?: number;
  loading?: "eager" | "lazy";
  className?: string;
  buttonClassName?: string;
  type?: "image" | "video";
  unoptimized?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  onCanPlay?: () => void;
  poster?: string;
};

export function MediaGalleryTilePreview({
  controller,
  index,
  renderId,
  src,
  alt,
  width,
  height,
  sizes,
  quality,
  loading = "lazy",
  className,
  buttonClassName,
  type = "image",
  unoptimized,
  onLoad,
  onError,
  onCanPlay,
  poster,
}: MediaGalleryTilePreviewProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const isVideo = type === "video";
  const videoMode = useMediaGalleryVideoMode(controller, isVideo ? renderId : null);
  const {videoSession, isVideoHovered, prepareForOpen, setVideoHovered, warmVideo} =
    useVideoPreviewSession({
      enabled: isVideo,
      src,
      poster,
      open: false,
      keepVideoLoaded: isVideo && videoMode === "overlay",
      resetVideoState: isVideo && videoMode === "released",
      onCanPlay,
      onError,
    });

  useEffect(() => {
    if (!isVideo) {
      return;
    }

    return controller.registerVideoSession(renderId, () => videoSession);
  }, [controller, isVideo, renderId, videoSession]);

  const warmGalleryVideo = useCallback(() => {
    if (!isVideo) {
      return;
    }

    controller.restoreInlineVideo(renderId);
    warmVideo();
  }, [controller, isVideo, renderId, warmVideo]);

  const openGalleryPreview = useCallback(() => {
    const triggerElement = triggerRef.current;
    if (!triggerElement) {
      return;
    }

    if (isVideo) {
      controller.restoreInlineVideo(renderId);
      prepareForOpen();
    }

    controller.openFromTrigger({
      index,
      renderId,
      triggerElement,
      width,
      height,
    });
  }, [controller, height, index, isVideo, prepareForOpen, renderId, width]);

  return (
    <MediaPreviewTrigger
      triggerRef={triggerRef}
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      quality={quality}
      loading={loading}
      disableClickToOpen={false}
      className={className}
      buttonClassName={buttonClassName}
      type={type}
      unoptimized={unoptimized}
      onLoad={onLoad}
      onError={onError}
      onCanPlay={onCanPlay}
      poster={poster}
      videoSession={isVideo ? videoSession : undefined}
      attachVideo={isVideo ? videoMode === "inline" : false}
      controlsVisible={isVideo ? isVideoHovered : false}
      warmVideo={isVideo ? warmGalleryVideo : undefined}
      setVideoHovered={isVideo ? setVideoHovered : undefined}
      openPreview={openGalleryPreview}
    />
  );
}
