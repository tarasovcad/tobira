"use client";

import {createPortal} from "react-dom";
import type {MediaPreviewProps} from "./preview/types";
import {useMediaPreview} from "../hooks/useMediaPreview";
import {useCallback, useEffect, useRef, useState} from "react";
import {MediaPreviewOverlay} from "./preview/MediaPreviewOverlay";
import {MediaPreviewTrigger} from "./preview/MediaPreviewTrigger";
import {useVideoPlayerSession} from "@/features/video-player/hooks/useVideoPlayerSession";

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
  } = useMediaPreview({width, height, onOpenChange, type, addZoom});

  const isVideo = type === "video";
  const [shouldLoadVideo, setShouldLoadVideo] = useState(isVideo && !poster);
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const [hasTriggeredFirstRevealAutoplay, setHasTriggeredFirstRevealAutoplay] = useState(
    isVideo && !poster,
  );
  const pendingFirstRevealAutoplayRef = useRef(false);

  const videoSession = useVideoPlayerSession({
    enabled: isVideo,
    src: isVideo && (shouldLoadVideo || open) ? src : undefined,
    poster,
    loop: isVideo,
    playsInline: isVideo,
    preload: isVideo && (shouldLoadVideo || open) ? "auto" : undefined,
    unmuteOnFirstInteraction: isVideo,
    onCanPlay: isVideo ? onCanPlay : undefined,
    onError: isVideo ? onError : undefined,
  });

  const openMediaPreview = useCallback(() => {
    if (isVideo) {
      setShouldLoadVideo(true);
      videoSession.actions.consumeFirstInteractionUnmute();
    }

    openPreview();
  }, [isVideo, openPreview, videoSession]);

  useEffect(() => {
    if (!isVideo || !isVideoHovered || open || !pendingFirstRevealAutoplayRef.current) {
      return;
    }

    const video = videoSession.videoRef.current;
    if (!video || !video.getAttribute("src")) {
      return;
    }

    pendingFirstRevealAutoplayRef.current = false;
    videoSession.actions.startMutedPlayback();
  }, [isVideo, isVideoHovered, open, shouldLoadVideo, videoSession]);

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
        videoSession={isVideo ? videoSession : undefined}
        attachVideo={isVideo ? !open : false}
        controlsVisible={isVideo ? isVideoHovered : false}
        warmVideo={
          isVideo
            ? () => {
                if (!shouldLoadVideo) {
                  setShouldLoadVideo(true);

                  if (!hasTriggeredFirstRevealAutoplay) {
                    pendingFirstRevealAutoplayRef.current = true;
                    setHasTriggeredFirstRevealAutoplay(true);
                  }
                }
              }
            : undefined
        }
        setVideoHovered={isVideo ? setIsVideoHovered : undefined}
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
