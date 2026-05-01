"use client";

import {useLayoutEffect, useRef, useSyncExternalStore} from "react";
import {VideoPlayerControls} from "@/features/video-player/components/VideoPlayerControls";
import {VideoPlayerOverlays} from "@/features/video-player/components/VideoPlayerOverlays";
import type {VideoPlayerShellProps} from "@/features/video-player/types";
import {formatVideoTime} from "@/features/video-player/utils";
import {cn} from "@/lib/utils";

export function VideoPlayerShell({
  session,
  className,
  videoClassName,
  showMainPlayIcon = false,
  minimal = false,
  controlsVisible,
  disableClickToggle = false,
  onRequestFullscreen,
  attachVideo = true,
  placeholder,
}: VideoPlayerShellProps) {
  const {attachToHost, detachFromHost} = session;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const {state} = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot,
  );

  useLayoutEffect(() => {
    if (!attachVideo) return;

    const containerNode = containerRef.current;

    attachToHost({
      containerNode,
      mountNode: mountRef.current,
      videoClassName,
      disableClickToggle,
      onRequestFullscreen,
    });

    return () => {
      detachFromHost(containerNode);
    };
  }, [
    attachToHost,
    attachVideo,
    detachFromHost,
    disableClickToggle,
    onRequestFullscreen,
    videoClassName,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/video @container/video-player relative overflow-hidden",
        minimal ? "h-full w-full bg-transparent" : "bg-black",
        className,
      )}
      onMouseMove={attachVideo ? session.actions.handleContainerMouseMove : undefined}
      onMouseLeave={attachVideo ? session.actions.handleContainerMouseLeave : undefined}>
      {attachVideo ? (
        <>
          <VideoPlayerOverlays
            isFastForwarding={state.isFastForwarding}
            isLoading={state.isLoading}
            isPlaying={state.isPlaying}
            minimal={minimal}
            showControls={state.showControls}
            showMainPlayIcon={showMainPlayIcon}
            onTogglePlay={session.actions.togglePlay}
          />

          <div ref={mountRef} className="h-full w-full" />

          <VideoPlayerControls
            state={state}
            controlsVisible={controlsVisible}
            formatTime={formatVideoTime}
            onSeek={session.actions.seekTo}
            onToggleFullscreen={session.actions.toggleFullscreen}
            onToggleMute={session.actions.toggleMute}
            onTogglePlay={session.actions.togglePlay}
            onVolumeChange={session.actions.setVideoVolume}
          />
        </>
      ) : (
        <div className="h-full w-full">{placeholder}</div>
      )}
    </div>
  );
}
