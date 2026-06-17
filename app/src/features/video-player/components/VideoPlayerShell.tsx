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
  errorFallback,
}: VideoPlayerShellProps) {
  const {attachToHost, detachFromHost} = session;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const {state} = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot,
  );

  const hasError = state.hasError;

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
      {attachVideo && hasError ? (
        <div className="h-full w-full">{errorFallback ?? <DefaultVideoErrorFallback />}</div>
      ) : attachVideo ? (
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

function DefaultVideoErrorFallback() {
  return (
    <div className="bg-muted text-muted-foreground/50 flex h-full w-full flex-col items-center justify-center gap-3">
      <svg
        width={64}
        height={64}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.375 2.5C16.1009 2.5 17.5 3.89911 17.5 5.625V14.375C17.5 16.1009 16.1009 17.5 14.375 17.5H5.625C3.89911 17.5 2.5 16.1009 2.5 14.375V5.625C2.5 3.89911 3.89911 2.5 5.625 2.5H14.375ZM7.99235 11.3257C7.26015 10.5937 6.07318 10.5937 5.34098 11.3257L3.75 12.9167V14.375C3.75 15.4105 4.58947 16.25 5.625 16.25H12.9167L7.99235 11.3257ZM12.5 5.41667C11.3494 5.41667 10.4167 6.34941 10.4167 7.5C10.4167 8.65058 11.3494 9.58333 12.5 9.58333C13.6506 9.58333 14.5833 8.65058 14.5833 7.5C14.5833 6.34941 13.6506 5.41667 12.5 5.41667Z"
          fill="currentColor"
        />
      </svg>
      <span className="text-center text-sm">No preview available</span>
    </div>
  );
}
