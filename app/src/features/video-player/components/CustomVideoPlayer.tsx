"use client";

import React from "react";
import {VideoPlayerShell} from "@/features/video-player/components/VideoPlayerShell";
import {useVideoPlayerSession} from "@/features/video-player/hooks/useVideoPlayerSession";
import type {CustomVideoPlayerProps} from "@/features/video-player/types";

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  src,
  poster,
  className,
  videoClassName,
  loop,
  autoPlay,
  muted,
  playsInline,
  showMainPlayIcon = false,
  minimal = false,
  playing,
  controlsVisible,
  disableClickToggle = false,
  onRequestFullscreen,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onTimeUpdate,
  onLoadedMetadata,
  onLoadedData,
  onProgress,
  onEnded,
  onCanPlay,
  onPlay,
  onPlaying,
  onPause,
  ...videoProps
}) => {
  const session = useVideoPlayerSession({
    src,
    poster,
    loop,
    autoPlay,
    muted,
    playsInline,
    preload: videoProps.preload,
    playing,
    onClick,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onTimeUpdate,
    onLoadedMetadata,
    onLoadedData,
    onProgress,
    onEnded,
    onCanPlay,
    onPlay,
    onPlaying,
    onPause,
    onError: videoProps.onError,
  });

  return (
    <VideoPlayerShell
      session={session}
      className={className}
      videoClassName={videoClassName}
      showMainPlayIcon={showMainPlayIcon}
      minimal={minimal}
      controlsVisible={controlsVisible}
      disableClickToggle={disableClickToggle}
      onRequestFullscreen={onRequestFullscreen}
    />
  );
};

export default CustomVideoPlayer;
