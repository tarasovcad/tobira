"use client";

import React from "react";
import {VideoPlayerControls} from "@/features/video-player/components/VideoPlayerControls";
import {VideoPlayerOverlays} from "@/features/video-player/components/VideoPlayerOverlays";
import {useVideoPlayerController} from "@/features/video-player/hooks/useVideoPlayerController";
import type {CustomVideoPlayerProps} from "@/features/video-player/types";
import {callEventHandler, formatVideoTime} from "@/features/video-player/utils";
import {cn} from "@/lib/utils";

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
  const {containerRef, videoRef, state, actions} = useVideoPlayerController({
    src,
    autoPlay,
    muted,
    playing,
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/video @container/video-player relative overflow-hidden",
        minimal ? "h-full w-full bg-transparent" : "bg-black",
        className,
      )}
      onMouseMove={actions.handleContainerMouseMove}
      onMouseLeave={actions.handleContainerMouseLeave}>
      <VideoPlayerOverlays
        isFastForwarding={state.isFastForwarding}
        isLoading={state.isLoading}
        isPlaying={state.isPlaying}
        minimal={minimal}
        showControls={state.showControls}
        showMainPlayIcon={showMainPlayIcon}
        onTogglePlay={actions.togglePlay}
      />

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop={loop}
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        className={videoClassName ?? "h-full w-full cursor-pointer object-contain"}
        onClick={(event) => {
          if (!disableClickToggle) {
            actions.handleVideoClick();
          }
          callEventHandler(onClick, event);
        }}
        onPointerDown={(event) => {
          if (!disableClickToggle) {
            actions.handleVideoPointerDown(event);
          }
          callEventHandler(onPointerDown, event);
        }}
        onPointerUp={(event) => {
          actions.handleVideoPointerUpOrLeave();
          callEventHandler(onPointerUp, event);
        }}
        onPointerLeave={(event) => {
          actions.handleVideoPointerUpOrLeave();
          callEventHandler(onPointerLeave, event);
        }}
        onPointerCancel={(event) => {
          actions.handleVideoPointerUpOrLeave();
          callEventHandler(onPointerCancel, event);
        }}
        onTimeUpdate={(event) => {
          actions.handleTimeUpdate();
          callEventHandler(onTimeUpdate, event);
        }}
        onLoadedMetadata={(event) => {
          actions.handleLoadedMetadata();
          callEventHandler(onLoadedMetadata, event);
        }}
        onLoadedData={(event) => {
          actions.handleLoadedData();
          callEventHandler(onLoadedData, event);
        }}
        onProgress={(event) => {
          actions.handleProgress();
          callEventHandler(onProgress, event);
        }}
        onEnded={(event) => {
          actions.handleEnded();
          callEventHandler(onEnded, event);
        }}
        onCanPlay={(event) => {
          actions.handleCanPlay();
          callEventHandler(onCanPlay, event);
        }}
        onPlay={(event) => {
          actions.handlePlay();
          callEventHandler(onPlay, event);
        }}
        onPlaying={(event) => {
          actions.handlePlaying();
          callEventHandler(onPlaying, event);
        }}
        onPause={(event) => {
          actions.handlePause();
          callEventHandler(onPause, event);
        }}
        {...videoProps}
      />

      <VideoPlayerControls
        state={state}
        controlsVisible={controlsVisible}
        formatTime={formatVideoTime}
        onSeek={actions.seekTo}
        onToggleFullscreen={actions.toggleFullscreen}
        onToggleMute={actions.toggleMute}
        onTogglePlay={actions.togglePlay}
        onVolumeChange={actions.setVideoVolume}
      />
    </div>
  );
};

export default CustomVideoPlayer;
