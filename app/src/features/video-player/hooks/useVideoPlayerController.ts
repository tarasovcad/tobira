"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import type {CustomVideoPlayerProps, VideoPlayerController} from "@/features/video-player/types";
import {isEditableElementActive, shouldSilencePlayError} from "@/features/video-player/utils";

type UseVideoPlayerControllerOptions = Pick<
  CustomVideoPlayerProps,
  "src" | "autoPlay" | "muted" | "playing"
>;

export function useVideoPlayerController({
  src,
  autoPlay,
  muted,
  playing,
}: UseVideoPlayerControllerOptions): VideoPlayerController {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay ?? false);
  const [isMuted, setIsMuted] = useState(muted ?? false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadedFraction, setLoadedFraction] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fastForwardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasFastForwardingRef = useRef(false);
  const previousVolumeRef = useRef(1);

  const safePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch((err) => {
      if (shouldSilencePlayError(err)) return;

      console.error("Error attempting to play video:", err);
      setIsPlaying(false);
    });
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      safePlay();
      return;
    }

    video.pause();
  }, [safePlay]);

  const seekTo = useCallback(
    (nextTime: number) => {
      const video = videoRef.current;
      if (!video) return;

      const maxDuration =
        Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
      const clampedTime = Math.max(0, Math.min(maxDuration, nextTime));

      video.currentTime = clampedTime;
    },
    [duration],
  );

  const setVideoVolume = useCallback((nextVolume: number, options?: {commit?: boolean}) => {
    const video = videoRef.current;
    if (!video) return;

    const clampedVolume = Math.max(0, Math.min(1, nextVolume));
    const nextMutedState = clampedVolume === 0;
    const shouldCommit = options?.commit ?? true;

    video.volume = clampedVolume;
    video.muted = nextMutedState;

    if (shouldCommit) {
      setVolume(clampedVolume);
      setIsMuted(nextMutedState);
    }

    if (clampedVolume > 0) {
      previousVolumeRef.current = clampedVolume;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted || volume === 0) {
      const restoredVolume = previousVolumeRef.current > 0 ? previousVolumeRef.current : 1;
      video.muted = false;
      setIsMuted(false);
      setVideoVolume(restoredVolume);
      return;
    }

    if (volume > 0) {
      previousVolumeRef.current = volume;
    }

    setVideoVolume(0);
  }, [isMuted, setVideoVolume, volume]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      return;
    }

    document.exitFullscreen();
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);

    if (Number.isFinite(video.duration) && duration !== video.duration) {
      setDuration(video.duration);
    }
  }, [duration]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }

    setIsLoading(false);
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.duration <= 0) return;

    const {buffered} = video;
    if (buffered.length === 0) return;

    const bufferedEnd = buffered.end(buffered.length - 1);
    setLoadedFraction(bufferedEnd / video.duration);
  }, []);

  const handleContainerMouseMove = useCallback(() => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2500);
  }, []);

  const handleContainerMouseLeave = useCallback(() => {
    setShowControls(false);
  }, []);

  const handleVideoPointerDown = useCallback(
    (event: React.PointerEvent<HTMLVideoElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      wasFastForwardingRef.current = false;

      if (fastForwardTimeoutRef.current) {
        clearTimeout(fastForwardTimeoutRef.current);
      }

      fastForwardTimeoutRef.current = setTimeout(() => {
        const video = videoRef.current;
        if (!video) return;

        video.playbackRate = 2;
        setIsFastForwarding(true);
        wasFastForwardingRef.current = true;

        if (video.paused) {
          safePlay();
          setIsPlaying(true);
        }
      }, 400);
    },
    [safePlay],
  );

  const handleVideoPointerUpOrLeave = useCallback(() => {
    if (fastForwardTimeoutRef.current) {
      clearTimeout(fastForwardTimeoutRef.current);
      fastForwardTimeoutRef.current = null;
    }

    const video = videoRef.current;
    if (video && video.playbackRate === 2) {
      video.playbackRate = 1;
    }

    setIsFastForwarding(false);
  }, []);

  const handleVideoClick = useCallback(() => {
    if (wasFastForwardingRef.current) {
      wasFastForwardingRef.current = false;
      return;
    }

    togglePlay();
  }, [togglePlay]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePlaying = useCallback(() => {
    setIsPlaying(true);
    setIsLoading(false);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      if (fastForwardTimeoutRef.current) {
        clearTimeout(fastForwardTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      setCurrentTime(video.currentTime);
      setIsPlaying(!video.paused);

      if (video.readyState >= 3) {
        setIsLoading(false);
      }

      const nextVolume = video.volume;
      setVolume(nextVolume);

      if (nextVolume > 0) {
        previousVolumeRef.current = nextVolume;
      }

      setIsMuted(video.muted || nextVolume === 0);

      if (Number.isFinite(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      }

      if (video.duration > 0 && video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setLoadedFraction(bufferedEnd / video.duration);
      } else {
        setLoadedFraction(0);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (playing === undefined || !video) return;

    if (playing) {
      safePlay();
      return;
    }

    video.pause();
  }, [playing, safePlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const nextMutedState = Boolean(muted) || video.volume === 0;
    video.muted = nextMutedState;
    const syncMutedStateFrame = requestAnimationFrame(() => {
      setIsMuted(nextMutedState);
    });

    if (video.volume > 0) {
      previousVolumeRef.current = video.volume;
    }

    return () => cancelAnimationFrame(syncMutedStateFrame);
  }, [muted]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableElementActive()) return;

      const container = containerRef.current;
      if (!container) return;

      const isHovered = container.matches(":hover");
      const isFocusedWithin = container.contains(document.activeElement);
      const isFullscreenTarget = document.fullscreenElement === container;

      if (!isHovered && !isFocusedWithin && !isFullscreenTarget) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case " ":
        case "k":
          event.preventDefault();
          togglePlay();
          break;
        case "m":
          event.preventDefault();
          toggleMute();
          break;
        case "f":
          event.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen, toggleMute, togglePlay]);

  return {
    containerRef,
    videoRef,
    state: {
      isPlaying,
      isMuted,
      volume,
      currentTime,
      duration,
      loadedFraction,
      isFullscreen,
      isLoading,
      showControls,
      isFastForwarding,
    },
    actions: {
      togglePlay,
      seekTo,
      setVideoVolume,
      toggleMute,
      toggleFullscreen,
      handleContainerMouseMove,
      handleContainerMouseLeave,
      handleVideoPointerDown,
      handleVideoPointerUpOrLeave,
      handleVideoClick,
      handleTimeUpdate,
      handleLoadedMetadata,
      handleLoadedData,
      handleProgress,
      handleEnded,
      handleCanPlay,
      handlePlay,
      handlePlaying,
      handlePause,
    },
  };
}
