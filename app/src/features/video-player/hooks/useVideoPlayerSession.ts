"use client";

import {startTransition, useCallback, useEffect, useMemo, useRef, useState} from "react";
import type {
  VideoPlayerActions,
  VideoPlayerHostOptions,
  VideoPlayerSession,
  VideoPlayerSessionOptions,
} from "@/features/video-player/types";
import {isEditableElementActive, shouldSilencePlayError} from "@/features/video-player/utils";
import {cn} from "@/lib/utils";

type ExternalVideoHandlers = Pick<
  VideoPlayerSessionOptions,
  | "onCanPlay"
  | "onClick"
  | "onEnded"
  | "onError"
  | "onLoadedData"
  | "onLoadedMetadata"
  | "onPause"
  | "onPlay"
  | "onPlaying"
  | "onPointerCancel"
  | "onPointerDown"
  | "onPointerLeave"
  | "onPointerUp"
  | "onProgress"
  | "onTimeUpdate"
>;

function callVideoHandler<TEvent>(handler: ((event: TEvent) => void) | undefined, event: TEvent) {
  handler?.(event);
}

export function useVideoPlayerSession({
  enabled = true,
  src,
  poster,
  loop,
  autoPlay,
  muted,
  playsInline,
  preload,
  playing,
  unmuteOnFirstInteraction = false,
  onCanPlay,
  onClick,
  onEnded,
  onError,
  onLoadedData,
  onLoadedMetadata,
  onPause,
  onPlay,
  onPlaying,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  onProgress,
  onTimeUpdate,
}: VideoPlayerSessionOptions): VideoPlayerSession {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeContainerRef = useRef<HTMLDivElement | null>(null);
  const activeMountRef = useRef<HTMLDivElement | null>(null);
  const hostOptionsRef = useRef<Omit<VideoPlayerHostOptions, "containerNode" | "mountNode">>({});
  const handlersRef = useRef<ExternalVideoHandlers>({
    onCanPlay,
    onClick,
    onEnded,
    onError,
    onLoadedData,
    onLoadedMetadata,
    onPause,
    onPlay,
    onPlaying,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerUp,
    onProgress,
    onTimeUpdate,
  });

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay ?? false);
  const [isMuted, setIsMuted] = useState(muted ?? false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadedFraction, setLoadedFraction] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(src));
  const [showControls, setShowControls] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fastForwardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasFastForwardingRef = useRef(false);
  const previousVolumeRef = useRef(1);
  const hasConsumedFirstInteractionUnmuteRef = useRef(false);

  const applyVideoClassName = useCallback((className?: string) => {
    const video = videoRef.current;
    if (!video) return;

    video.className = cn("h-full w-full cursor-pointer object-contain", className);
  }, []);

  const safePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch((err) => {
      if (shouldSilencePlayError(err)) return;

      console.error("Error attempting to play video:", err);
      setIsPlaying(false);
    });
  }, []);

  const consumeFirstInteractionUnmute = useCallback(() => {
    const video = videoRef.current;
    if (!video || !unmuteOnFirstInteraction || hasConsumedFirstInteractionUnmuteRef.current) {
      return;
    }

    hasConsumedFirstInteractionUnmuteRef.current = true;
    video.muted = false;
    setIsMuted(false);

    const nextVolume = video.volume > 0 ? video.volume : previousVolumeRef.current || 1;
    if (video.volume === 0) {
      video.volume = nextVolume;
    }

    setVolume(video.volume);

    if (video.volume > 0) {
      previousVolumeRef.current = video.volume;
    }
  }, [unmuteOnFirstInteraction]);

  const seekTo = useCallback(
    (nextTime: number) => {
      const video = videoRef.current;
      if (!video) return;

      consumeFirstInteractionUnmute();

      const maxDuration =
        Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
      const clampedTime = Math.max(0, Math.min(maxDuration, nextTime));

      video.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    },
    [consumeFirstInteractionUnmute, duration],
  );

  const setVideoVolume = useCallback(
    (nextVolume: number, options?: {commit?: boolean}) => {
      const video = videoRef.current;
      if (!video) return;

      consumeFirstInteractionUnmute();

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
    },
    [consumeFirstInteractionUnmute],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    consumeFirstInteractionUnmute();

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
  }, [consumeFirstInteractionUnmute, isMuted, setVideoVolume, volume]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    consumeFirstInteractionUnmute();

    if (video.paused) {
      safePlay();
      return;
    }

    video.pause();
  }, [consumeFirstInteractionUnmute, safePlay]);

  const startMutedPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    setIsMuted(true);
    safePlay();
  }, [safePlay]);

  const toggleFullscreen = useCallback(() => {
    consumeFirstInteractionUnmute();

    const onRequestFullscreen = hostOptionsRef.current.onRequestFullscreen;
    if (onRequestFullscreen) {
      onRequestFullscreen();
      return;
    }

    const container = activeContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      return;
    }

    document.exitFullscreen();
  }, [consumeFirstInteractionUnmute]);

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
    (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      consumeFirstInteractionUnmute();

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
    [consumeFirstInteractionUnmute, safePlay],
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

  const actions = useMemo<VideoPlayerActions>(
    () => ({
      consumeFirstInteractionUnmute,
      togglePlay,
      startMutedPlayback,
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
    }),
    [
      consumeFirstInteractionUnmute,
      handleCanPlay,
      handleContainerMouseLeave,
      handleContainerMouseMove,
      handleEnded,
      handleLoadedData,
      handleLoadedMetadata,
      handlePause,
      handlePlay,
      handlePlaying,
      handleProgress,
      handleTimeUpdate,
      handleVideoClick,
      handleVideoPointerDown,
      handleVideoPointerUpOrLeave,
      seekTo,
      setVideoVolume,
      toggleFullscreen,
      toggleMute,
      togglePlay,
      startMutedPlayback,
    ],
  );
  const actionsRef = useRef<VideoPlayerActions | null>(null);

  useEffect(() => {
    handlersRef.current = {
      onCanPlay,
      onClick,
      onEnded,
      onError,
      onLoadedData,
      onLoadedMetadata,
      onPause,
      onPlay,
      onPlaying,
      onPointerCancel,
      onPointerDown,
      onPointerLeave,
      onPointerUp,
      onProgress,
      onTimeUpdate,
    };
  }, [
    onCanPlay,
    onClick,
    onEnded,
    onError,
    onLoadedData,
    onLoadedMetadata,
    onPause,
    onPlay,
    onPlaying,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerUp,
    onProgress,
    onTimeUpdate,
  ]);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  const attachToHost = useCallback(
    ({containerNode, mountNode, ...hostOptions}: VideoPlayerHostOptions) => {
      activeContainerRef.current = containerNode;
      activeMountRef.current = mountNode;
      hostOptionsRef.current = hostOptions;
      applyVideoClassName(hostOptions.videoClassName);

      const video = videoRef.current;
      if (!video || !mountNode) return;

      const wasPlayingBeforeAttach = !video.paused && !video.ended;

      if (video.parentElement !== mountNode || mountNode.childNodes.length !== 1) {
        mountNode.replaceChildren(video);
      }

      if (wasPlayingBeforeAttach) {
        requestAnimationFrame(() => {
          if (videoRef.current !== video || video.parentElement !== mountNode || !video.paused) {
            return;
          }

          safePlay();
        });
      }
    },
    [applyVideoClassName, safePlay],
  );

  const detachFromHost = useCallback((containerNode: HTMLDivElement | null) => {
    if (activeContainerRef.current === containerNode) {
      activeContainerRef.current = null;
      activeMountRef.current = null;
      hostOptionsRef.current = {};
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const video = document.createElement("video");
    videoRef.current = video;
    video.controls = false;
    video.disablePictureInPicture = true;
    applyVideoClassName(hostOptionsRef.current.videoClassName);

    const handleClickEvent = (event: MouseEvent) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      if (!hostOptionsRef.current.disableClickToggle) {
        currentActions.handleVideoClick();
      }
      callVideoHandler(
        handlersRef.current.onClick as ((event: MouseEvent) => void) | undefined,
        event,
      );
    };
    const handlePointerDownEvent = (event: PointerEvent) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      if (!hostOptionsRef.current.disableClickToggle) {
        currentActions.handleVideoPointerDown(event);
      }
      callVideoHandler(
        handlersRef.current.onPointerDown as ((event: PointerEvent) => void) | undefined,
        event,
      );
    };
    const handlePointerUpEvent = (event: PointerEvent) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handleVideoPointerUpOrLeave();
      callVideoHandler(
        handlersRef.current.onPointerUp as ((event: PointerEvent) => void) | undefined,
        event,
      );
    };
    const handlePointerLeaveEvent = (event: PointerEvent) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handleVideoPointerUpOrLeave();
      callVideoHandler(
        handlersRef.current.onPointerLeave as ((event: PointerEvent) => void) | undefined,
        event,
      );
    };
    const handlePointerCancelEvent = (event: PointerEvent) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handleVideoPointerUpOrLeave();
      callVideoHandler(
        handlersRef.current.onPointerCancel as ((event: PointerEvent) => void) | undefined,
        event,
      );
    };
    const handleTimeUpdateEvent = (event: Event) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handleTimeUpdate();
      callVideoHandler(
        handlersRef.current.onTimeUpdate as ((event: Event) => void) | undefined,
        event,
      );
    };
    const handleLoadedMetadataEvent = (event: Event) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handleLoadedMetadata();
      callVideoHandler(
        handlersRef.current.onLoadedMetadata as ((event: Event) => void) | undefined,
        event,
      );
    };
    const handleLoadedDataEvent = (event: Event) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handleLoadedData();
      callVideoHandler(
        handlersRef.current.onLoadedData as ((event: Event) => void) | undefined,
        event,
      );
    };
    const handleProgressEvent = (event: Event) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handleProgress();
      callVideoHandler(
        handlersRef.current.onProgress as ((event: Event) => void) | undefined,
        event,
      );
    };
    const handleEndedEvent = (event: Event) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handleEnded();
      callVideoHandler(handlersRef.current.onEnded as ((event: Event) => void) | undefined, event);
    };
    const handleCanPlayEvent = (event: Event) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handleCanPlay();
      callVideoHandler(
        handlersRef.current.onCanPlay as ((event: Event) => void) | undefined,
        event,
      );
    };
    const handlePlayEvent = (event: Event) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handlePlay();
      callVideoHandler(handlersRef.current.onPlay as ((event: Event) => void) | undefined, event);
    };
    const handlePlayingEvent = (event: Event) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handlePlaying();
      callVideoHandler(
        handlersRef.current.onPlaying as ((event: Event) => void) | undefined,
        event,
      );
    };
    const handlePauseEvent = (event: Event) => {
      const currentActions = actionsRef.current;
      if (!currentActions) return;

      currentActions.handlePause();
      callVideoHandler(handlersRef.current.onPause as ((event: Event) => void) | undefined, event);
    };
    const handleErrorEvent = (event: Event) => {
      callVideoHandler(handlersRef.current.onError as ((event: Event) => void) | undefined, event);
    };

    video.addEventListener("click", handleClickEvent);
    video.addEventListener("pointerdown", handlePointerDownEvent);
    video.addEventListener("pointerup", handlePointerUpEvent);
    video.addEventListener("pointerleave", handlePointerLeaveEvent);
    video.addEventListener("pointercancel", handlePointerCancelEvent);
    video.addEventListener("timeupdate", handleTimeUpdateEvent);
    video.addEventListener("loadedmetadata", handleLoadedMetadataEvent);
    video.addEventListener("loadeddata", handleLoadedDataEvent);
    video.addEventListener("progress", handleProgressEvent);
    video.addEventListener("ended", handleEndedEvent);
    video.addEventListener("canplay", handleCanPlayEvent);
    video.addEventListener("play", handlePlayEvent);
    video.addEventListener("playing", handlePlayingEvent);
    video.addEventListener("pause", handlePauseEvent);
    video.addEventListener("error", handleErrorEvent);

    if (activeMountRef.current) {
      activeMountRef.current.replaceChildren(video);
    }

    startTransition(() => {
      setIsReady(true);
    });

    return () => {
      video.pause();
      video.removeEventListener("click", handleClickEvent);
      video.removeEventListener("pointerdown", handlePointerDownEvent);
      video.removeEventListener("pointerup", handlePointerUpEvent);
      video.removeEventListener("pointerleave", handlePointerLeaveEvent);
      video.removeEventListener("pointercancel", handlePointerCancelEvent);
      video.removeEventListener("timeupdate", handleTimeUpdateEvent);
      video.removeEventListener("loadedmetadata", handleLoadedMetadataEvent);
      video.removeEventListener("loadeddata", handleLoadedDataEvent);
      video.removeEventListener("progress", handleProgressEvent);
      video.removeEventListener("ended", handleEndedEvent);
      video.removeEventListener("canplay", handleCanPlayEvent);
      video.removeEventListener("play", handlePlayEvent);
      video.removeEventListener("playing", handlePlayingEvent);
      video.removeEventListener("pause", handlePauseEvent);
      video.removeEventListener("error", handleErrorEvent);
      video.remove();
      videoRef.current = null;
      startTransition(() => {
        setIsReady(false);
      });
    };
  }, [applyVideoClassName, enabled]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const container = activeContainerRef.current;
      setIsFullscreen(Boolean(container && document.fullscreenElement === container));
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
    const video = videoRef.current;
    if (!video) return;

    if (src === undefined) {
      hasConsumedFirstInteractionUnmuteRef.current = false;

      if (video.getAttribute("src") !== null) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }

      startTransition(() => {
        setIsLoading(false);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setLoadedFraction(0);
      });
      return;
    }

    if (video.getAttribute("src") !== src) {
      hasConsumedFirstInteractionUnmuteRef.current = false;
      video.src = src;
      video.load();
      startTransition(() => {
        setIsLoading(true);
        setLoadedFraction(0);
      });
    }
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.poster = poster ?? "";
  }, [poster]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.loop = Boolean(loop);
  }, [loop]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.autoplay = Boolean(autoPlay);
  }, [autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playsInline = Boolean(playsInline);
  }, [playsInline]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const nextPreload =
      preload === "none" || preload === "metadata" || preload === "auto" ? preload : "auto";
    video.preload = nextPreload;
  }, [preload]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const timer = setTimeout(() => {
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
    if (muted === undefined || !video) return;

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
    const video = videoRef.current;
    if (playing === undefined || !video) return;

    if (playing) {
      if (muted) {
        video.muted = true;
      }

      safePlay();
      return;
    }

    video.pause();
  }, [muted, playing, safePlay]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableElementActive()) return;

      const container = activeContainerRef.current;
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
    videoRef,
    isReady,
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
    actions,
    attachToHost,
    detachFromHost,
  };
}
