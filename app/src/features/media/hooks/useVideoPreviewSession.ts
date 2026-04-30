"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {useVideoPlayerSession} from "@/features/video-player/hooks/useVideoPlayerSession";

type UseVideoPreviewSessionParams = {
  enabled: boolean;
  src: string;
  poster?: string;
  open: boolean;
  keepVideoLoaded?: boolean;
  resetVideoState?: boolean;
  onCanPlay?: () => void;
  onError?: () => void;
};

export function useVideoPreviewSession({
  enabled,
  src,
  poster,
  open,
  keepVideoLoaded = false,
  resetVideoState = false,
  onCanPlay,
  onError,
}: UseVideoPreviewSessionParams) {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(enabled && !poster);
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const [hasTriggeredFirstRevealAutoplay, setHasTriggeredFirstRevealAutoplay] = useState(
    enabled && !poster,
  );
  const pendingFirstRevealAutoplayRef = useRef(false);

  const videoSession = useVideoPlayerSession({
    enabled,
    src: enabled && (shouldLoadVideo || open || keepVideoLoaded) ? src : undefined,
    poster,
    loop: enabled,
    playsInline: enabled,
    preload: enabled && (shouldLoadVideo || open || keepVideoLoaded) ? "auto" : undefined,
    unmuteOnFirstInteraction: enabled,
    onCanPlay: enabled ? onCanPlay : undefined,
    onError: enabled ? onError : undefined,
  });

  const resetPreviewVideoState = useCallback(() => {
    if (!enabled) {
      return;
    }

    setShouldLoadVideo(!poster);
    setIsVideoHovered(false);
    setHasTriggeredFirstRevealAutoplay(!poster);
    pendingFirstRevealAutoplayRef.current = false;
  }, [enabled, poster]);

  const prepareForOpen = useCallback(() => {
    if (!enabled) {
      return;
    }

    setShouldLoadVideo(true);
    videoSession.actions.consumeFirstInteractionUnmute();
  }, [enabled, videoSession.actions]);

  const warmVideo = useCallback(() => {
    if (!enabled || shouldLoadVideo) {
      return;
    }

    setShouldLoadVideo(true);

    if (!hasTriggeredFirstRevealAutoplay) {
      pendingFirstRevealAutoplayRef.current = true;
      setHasTriggeredFirstRevealAutoplay(true);
    }
  }, [enabled, hasTriggeredFirstRevealAutoplay, shouldLoadVideo]);

  useEffect(() => {
    if (!enabled || !isVideoHovered || open || !pendingFirstRevealAutoplayRef.current) {
      return;
    }

    const video = videoSession.videoRef.current;
    if (!video || !video.getAttribute("src")) {
      return;
    }

    pendingFirstRevealAutoplayRef.current = false;
    videoSession.actions.startMutedPlayback();
  }, [enabled, isVideoHovered, open, videoSession]);

  useEffect(() => {
    if (!resetVideoState) {
      return;
    }

    const resetFrame = requestAnimationFrame(() => {
      resetPreviewVideoState();
      videoSession.actions.pausePlayback();
    });

    return () => cancelAnimationFrame(resetFrame);
  }, [resetPreviewVideoState, resetVideoState, videoSession.actions]);

  return {
    videoSession,
    isVideoHovered,
    setVideoHovered: setIsVideoHovered,
    prepareForOpen,
    warmVideo,
  };
}
