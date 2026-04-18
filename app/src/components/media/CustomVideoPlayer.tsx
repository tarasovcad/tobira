"use client";

import React, {useRef, useState, useEffect, useCallback} from "react";
import {Loader2} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipPopupBlur,
} from "@/components/coss-ui/tooltip";

interface CustomVideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  className?: string;
  videoClassName?: string;
  showMainPlayIcon?: boolean;
  minimal?: boolean;
  playing?: boolean;
  controlsVisible?: boolean;
  disableClickToggle?: boolean;
}

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
  ...props
}) => {
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
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);

  // Hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fastForwardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasFastForwardingRef = useRef(false);

  const shouldSilencePlayError = (err: unknown) => {
    if (!err || typeof err !== "object") return false;
    const name = "name" in err ? String((err as {name?: unknown}).name) : "";
    const message = "message" in err ? String((err as {message?: unknown}).message) : "";
    return (
      name === "AbortError" ||
      message.includes("play() request was interrupted") ||
      message.includes("interrupted by a call to pause") ||
      message.includes("interrupted by a new load request")
    );
  };

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
    if (videoRef.current) {
      if (videoRef.current.paused) {
        safePlay();
      } else {
        videoRef.current.pause();
      }
    }
  }, [safePlay]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      if (newMutedState) {
        setVolume(0);
      } else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return "0:00";
    const validTime = Math.max(0, timeInSeconds);
    const minutes = Math.floor(validTime / 60);
    const seconds = Math.floor(validTime % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const videoDuration = videoRef.current.duration;
      if (!isNaN(videoDuration) && isFinite(videoDuration) && duration !== videoDuration) {
        setDuration(videoDuration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      if (!isNaN(videoDuration) && isFinite(videoDuration)) {
        setDuration(videoDuration);
      }
      setIsLoading(false);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.duration > 0) {
      const buffered = videoRef.current.buffered;
      if (buffered.length > 0) {
        const bufferedEnd = buffered.end(buffered.length - 1);
        setLoadedFraction(bufferedEnd / videoRef.current.duration);
      }
    }
  };

  const updateProgressFromEvent = (
    clientX: number,
    currentTarget: EventTarget & HTMLDivElement,
  ) => {
    if (videoRef.current && duration > 0) {
      const rect = currentTarget.getBoundingClientRect();
      let pos = (clientX - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos));
      videoRef.current.currentTime = pos * duration;
      setCurrentTime(pos * duration);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      updateProgressFromEvent(e.clientX, e.currentTarget);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      let pos = (e.clientX - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos));
      setHoverPosition(pos * 100);
      setHoverTime(pos * duration);

      if (isDragging) {
        updateProgressFromEvent(e.clientX, e.currentTarget);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverPosition(null);
      setHoverTime(null);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2500);
  };

  const handleMouseLeave = () => {
    setShowControls(false);
  };

  const handleVideoPointerDown = useCallback(
    (e: React.PointerEvent<HTMLVideoElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      wasFastForwardingRef.current = false;
      if (fastForwardTimeoutRef.current) {
        clearTimeout(fastForwardTimeoutRef.current);
      }

      fastForwardTimeoutRef.current = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.playbackRate = 2;
          setIsFastForwarding(true);
          wasFastForwardingRef.current = true;
          if (videoRef.current.paused) {
            safePlay();
            setIsPlaying(true);
          }
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

    if (videoRef.current && videoRef.current.playbackRate === 2) {
      videoRef.current.playbackRate = 1;
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (fastForwardTimeoutRef.current) clearTimeout(fastForwardTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (videoRef.current) {
        setIsPlaying(!videoRef.current.paused);
        if (videoRef.current.readyState >= 3) {
          setIsLoading(false);
        }
        const videoDuration = videoRef.current.duration;
        if (!isNaN(videoDuration) && isFinite(videoDuration) && videoDuration > 0) {
          setDuration(videoDuration);
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [src]);

  useEffect(() => {
    if (playing !== undefined && videoRef.current) {
      if (playing) {
        // Let the video element's natural 'onPlay' and 'onPause' events handle the 'isPlaying' state.
        // This avoids calling setState synchronously within the effect.
        videoRef.current.play().catch((err) => {
          if (shouldSilencePlayError(err)) return;
          console.error("Error attempting to play video from prop:", err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`group/video relative overflow-hidden ${minimal ? "h-full w-full bg-transparent" : "bg-black"} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}>
      {/* Loading overlay */}
      {isLoading && !minimal && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop={loop}
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        className={videoClassName || "h-full w-full cursor-pointer object-contain"}
        onClick={disableClickToggle ? undefined : handleVideoClick}
        onPointerDown={disableClickToggle ? undefined : handleVideoPointerDown}
        onPointerUp={handleVideoPointerUpOrLeave}
        onPointerLeave={handleVideoPointerUpOrLeave}
        onPointerCancel={handleVideoPointerUpOrLeave}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={() => setIsLoading(false)}
        onProgress={handleProgress}
        onEnded={() => setIsPlaying(false)}
        onCanPlay={() => setIsLoading(false)}
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        {...props}
      />

      {/* Fast Forward Overlay */}
      <AnimatePresence>
        {isFastForwarding && (
          <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            transition={{duration: 0.2}}
            className="pointer-events-none absolute top-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md">
            <span>2x</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2.6665 4.80273C2.6665 3.65718 4.01573 3.04494 4.87784 3.79929L7.99984 6.53103V4.80273C7.99984 3.65718 9.34904 3.04494 10.2112 3.79929L13.8654 6.9968C14.4726 7.528 14.4726 8.47247 13.8654 9.00367L10.2112 12.2011C9.34904 12.9555 7.99984 12.3433 7.99984 11.1977V9.4694L4.87784 12.2011C4.01573 12.9555 2.6665 12.3433 2.6665 11.1977V4.80273Z"
                fill="currentColor"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Central Play/Pause button overlay - visible when paused */}
      <AnimatePresence>
        {!isPlaying && !isLoading && showControls && showMainPlayIcon && (
          <motion.div
            initial={{opacity: 1, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.9}}
            transition={{duration: 0.2}}
            className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center"
            onClick={togglePlay}>
            {/* Outer glow ring */}
            <div
              className="absolute h-20 w-20 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)",
                filter: "blur(6px)",
              }}
            />
            {/* Glass button */}
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(24px) saturate(180%) brightness(1.1)",
                WebkitBackdropFilter: "blur(24px) saturate(180%) brightness(1.1)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                boxShadow:
                  "0 4px 32px rgba(0, 0, 0, 0.25), 0 1.5px 0px rgba(255,255,255,0.35) inset, 0 -1px 0px rgba(0,0,0,0.15) inset",
              }}>
              {/* Inner top-edge specular highlight */}
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 40%, transparent 60%)",
                }}
              />
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))"}}>
                <path
                  d="M14.9293 3.62437C11.3828 1.2938 6.66699 3.83773 6.66699 8.08146V23.9183C6.66699 28.162 11.3828 30.7059 14.9293 28.3753L26.979 20.4569C30.1849 18.3503 30.1849 13.6495 26.979 11.5427L14.9293 3.62437Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute right-0 bottom-0 left-0 z-20 transform bg-linear-to-t from-black/20 to-transparent px-5 pt-10 pb-4 transition duration-150 ease-in will-change-transform group-hover/video:translate-y-0 group-hover/video:opacity-100 group-hover/video:duration-200 group-hover/video:ease-out group-has-[video:focus-visible]/video:translate-y-0 group-has-[video:focus-visible]/video:opacity-100 group-has-[video:focus-visible]/video:duration-200 group-has-[video:focus-visible]/video:ease-out ${showControls || controlsVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
        <TooltipProvider delay={300}>
          <div className="flex w-full items-center gap-0.5 text-white">
            {/* Play/Pause */}
            <Tooltip>
              <TooltipTrigger
                onClick={togglePlay}
                className="group/play relative flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-md p-2 text-white outline-hidden transition duration-100 ease-linear before:absolute before:size-6 hover:bg-white/20 hover:backdrop-blur-sm focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97]">
                <div
                  className={`transition-all duration-200 ${
                    isPlaying ? "scale-100 opacity-100 blur-none" : "scale-70 opacity-0 blur-[2px]"
                  }`}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2.66699 4C2.66699 2.89543 3.56243 2 4.66699 2C5.77156 2 6.66699 2.89543 6.66699 4V12C6.66699 13.1046 5.77156 14 4.66699 14C3.56243 14 2.66699 13.1046 2.66699 12V4Z"
                      fill="currentColor"
                    />
                    <path
                      d="M9.33301 4C9.33301 2.89543 10.2284 2 11.333 2C12.4376 2 13.333 2.89543 13.333 4V12C13.333 13.1046 12.4376 14 11.333 14C10.2284 14 9.33301 13.1046 9.33301 12V4Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div
                  className={`absolute transition-all duration-200 ${
                    isPlaying ? "scale-0 opacity-0 blur-[2px]" : "scale-100 opacity-100 blur-none"
                  }`}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M7.46414 1.81219C5.69089 0.646902 3.33301 1.91887 3.33301 4.04073V11.9591C3.33301 14.081 5.6909 15.3529 7.46414 14.1877L13.489 10.2285C15.0919 9.17513 15.0919 6.82473 13.489 5.77137L7.46414 1.81219Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </TooltipTrigger>
              <TooltipPopupBlur sideOffset={8}>
                <div className="flex items-center gap-1.5">
                  <span>{isPlaying ? "Pause" : "Play"}</span>
                  <kbd className="flex items-center justify-center rounded-sm bg-black/40 px-1.5 py-1 font-sans text-xs font-semibold text-white/90">
                    Space
                  </kbd>
                </div>
              </TooltipPopupBlur>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                onClick={toggleMute}
                className="group/play relative flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md p-2 text-white outline-hidden transition duration-100 ease-linear before:absolute before:size-6 hover:bg-white/20 hover:backdrop-blur-sm focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97]">
                <div
                  className={`transition-all duration-200 ${
                    isMuted || volume === 0
                      ? "scale-100 opacity-100 blur-none"
                      : "scale-70 opacity-0 blur-[2px]"
                  }`}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M6.47959 2.39899C7.34804 1.67529 8.6665 2.29284 8.6665 3.42329V12.5765C8.6665 13.707 7.34804 14.3245 6.47959 13.6009L3.94389 11.4878C3.82408 11.3879 3.67306 11.3333 3.5171 11.3333H2.6665C1.56194 11.3333 0.666504 10.4378 0.666504 9.33327V6.66659C0.666504 5.56202 1.56194 4.66659 2.6665 4.66659H3.5171C3.67306 4.66659 3.82408 4.61191 3.94389 4.51207L6.47959 2.39899Z"
                      fill="currentColor"
                    />
                    <path
                      d="M14.8049 7.138C15.0652 6.87766 15.0652 6.45554 14.8049 6.19518C14.5446 5.93484 14.1224 5.93484 13.8621 6.19518L12.9193 7.138L11.9764 6.19518C11.7161 5.93484 11.294 5.93484 11.0336 6.19518C10.7733 6.45554 10.7733 6.87766 11.0336 7.138L11.9764 8.0808L11.0336 9.0236C10.7733 9.28393 10.7733 9.70606 11.0336 9.9664C11.294 10.2268 11.7161 10.2268 11.9764 9.9664L12.9193 9.0236L13.8621 9.9664C14.1224 10.2268 14.5446 10.2268 14.8049 9.9664C15.0652 9.70606 15.0652 9.28393 14.8049 9.0236L13.8621 8.0808L14.8049 7.138Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div
                  className={`absolute transition-all duration-200 ${
                    isMuted || volume === 0
                      ? "scale-0 opacity-0 blur-[2px]"
                      : "scale-100 opacity-100 blur-none"
                  }`}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M8.6665 3.42329C8.6665 2.29284 7.34804 1.67529 6.47959 2.39899L3.94389 4.51207C3.82408 4.61191 3.67306 4.66659 3.5171 4.66659H2.6665C1.56194 4.66659 0.666504 5.56202 0.666504 6.66659V9.33327C0.666504 10.4378 1.56194 11.3333 2.6665 11.3333H3.5171C3.67306 11.3333 3.82408 11.3879 3.94389 11.4878L6.47959 13.6009C7.34804 14.3245 8.6665 13.707 8.6665 12.5765V3.42329Z"
                      fill="currentColor"
                    />
                    <path
                      d="M13.1855 2.81506C12.9251 2.55471 12.503 2.55471 12.2426 2.81506C11.9823 3.07541 11.9823 3.49752 12.2426 3.75786C13.3291 4.84438 14 6.34347 14 8.00054C14 9.65754 13.3291 11.1566 12.2426 12.2431C11.9823 12.5035 11.9823 12.9256 12.2426 13.1859C12.503 13.4463 12.9251 13.4463 13.1855 13.1859C14.5118 11.8596 15.3333 10.0253 15.3333 8.00054C15.3333 5.97565 14.5118 4.1414 13.1855 2.81506Z"
                      fill="currentColor"
                    />
                    <path
                      d="M11.0644 4.93615C10.804 4.6758 10.3819 4.6758 10.1216 4.93615C9.86117 5.1965 9.86117 5.61861 10.1216 5.87896C10.6652 6.42258 11.0002 7.17167 11.0002 8.00027C11.0002 8.82887 10.6652 9.578 10.1216 10.1216C9.86117 10.3819 9.86117 10.8041 10.1216 11.0644C10.3819 11.3247 10.804 11.3247 11.0644 11.0644C11.8478 10.2809 12.3336 9.19674 12.3336 8.00027C12.3336 6.80387 11.8478 5.7196 11.0644 4.93615Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </TooltipTrigger>
              <TooltipPopupBlur sideOffset={8}>
                <div className="flex items-center gap-1.5">
                  <span>{isMuted || volume === 0 ? "Unmute" : "Mute"}</span>
                  <kbd className="flex items-center justify-center rounded-sm bg-black/40 px-1.5 py-1 font-sans text-xs font-semibold text-white/90">
                    M
                  </kbd>
                </div>
              </TooltipPopupBlur>
            </Tooltip>

            {/* Current Time */}
            <div className="flex w-full items-center gap-2 px-2">
              <div className="shrink-0 text-sm font-semibold text-white tabular-nums">
                {formatTime(currentTime)}
              </div>

              {/* Progress bar */}
              <div
                className="group/progress flex flex-1 cursor-pointer items-center py-3"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                onPointerCancel={handlePointerUp}>
                <div className="relative flex h-2 w-full items-center rounded-full bg-white/30">
                  {/* Hover Tooltip */}
                  {hoverPosition !== null && hoverTime !== null && (
                    <div
                      className="pointer-events-none absolute -top-8 z-50 -translate-x-1/2 transform"
                      style={{left: `${hoverPosition}%`}}>
                      <div className="rounded-md bg-black/90 px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow-md backdrop-blur-sm">
                        {formatTime(hoverTime)}
                      </div>
                    </div>
                  )}

                  {/* Hover Bar Preview */}
                  {hoverPosition !== null && (
                    <div
                      className="absolute left-0 h-full rounded-full bg-white/30"
                      style={{width: `${hoverPosition}%`}}
                    />
                  )}

                  {/* Buffered part */}
                  <div
                    className="absolute left-0 h-full rounded-full bg-white/40"
                    style={{width: `${loadedFraction * 100}%`}}
                  />

                  {/* Current progress */}
                  <div
                    className="absolute left-0 h-full rounded-full bg-white"
                    style={{width: `${(currentTime / duration) * 100 || 0}%`}}
                  />
                  {/* Thumb */}
                  <div
                    className="absolute -ml-2 h-4 w-4 scale-0 rounded-full bg-white shadow-sm transition-transform group-hover/progress:scale-100"
                    style={{left: `${(currentTime / duration) * 100 || 0}%`}}
                  />
                </div>
              </div>

              {/* Remaining Time */}
              <div className="shrink-0 text-sm font-semibold text-white tabular-nums">
                -{formatTime(duration - currentTime)}
              </div>
            </div>

            {/* Fullscreen */}
            <Tooltip>
              <TooltipTrigger
                onClick={toggleFullscreen}
                className="group/play relative flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-md p-2 text-white outline-hidden transition duration-100 ease-linear before:absolute before:size-6 hover:bg-white/20 hover:backdrop-blur-sm focus-visible:outline-offset-2 focus-visible:outline-white">
                {isFullscreen ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M13.9716 2.02859C14.2319 2.28895 14.2319 2.71105 13.9716 2.97141L10.943 6H13.3335C13.7017 6 14.0002 6.29848 14.0002 6.66667C14.0002 7.03487 13.7017 7.33333 13.3335 7.33333H9.3335C8.9653 7.33333 8.66683 7.03487 8.66683 6.66667V2.66667C8.66683 2.29848 8.9653 2 9.3335 2C9.7017 2 10.0002 2.29848 10.0002 2.66667V5.05719L13.0288 2.02859C13.2891 1.76825 13.7112 1.76825 13.9716 2.02859ZM2.00016 9.33333C2.00016 8.96513 2.29864 8.66667 2.66683 8.66667H6.66683C7.03503 8.66667 7.3335 8.96513 7.3335 9.33333V13.3333C7.3335 13.7015 7.03503 14 6.66683 14C6.29864 14 6.00016 13.7015 6.00016 13.3333V10.9428L2.97157 13.9714C2.71122 14.2317 2.28911 14.2317 2.02876 13.9714C1.76841 13.7111 1.76841 13.2889 2.02876 13.0286L5.05736 10H2.66683C2.29864 10 2.00016 9.70153 2.00016 9.33333Z"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.66667 2.66667C8.66667 2.29848 8.96513 2 9.33333 2H13.3333C13.7015 2 14 2.29848 14 2.66667V6.66667C14 7.03487 13.7015 7.33333 13.3333 7.33333C12.9651 7.33333 12.6667 7.03487 12.6667 6.66667V4.27614L9.80473 7.13807C9.5444 7.3984 9.12227 7.3984 8.86193 7.13807C8.6016 6.87773 8.6016 6.45561 8.86193 6.19526L11.7239 3.33333H9.33333C8.96513 3.33333 8.66667 3.03485 8.66667 2.66667ZM2.66667 8.66667C3.03485 8.66667 3.33333 8.96513 3.33333 9.33333V11.7239L6.19526 8.86193C6.45561 8.6016 6.87773 8.6016 7.13807 8.86193C7.3984 9.12227 7.3984 9.5444 7.13807 9.80473L4.27614 12.6667H6.66667C7.03487 12.6667 7.33333 12.9651 7.33333 13.3333C7.33333 13.7015 7.03487 14 6.66667 14H2.66667C2.29848 14 2 13.7015 2 13.3333V9.33333C2 8.96513 2.29848 8.66667 2.66667 8.66667Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </TooltipTrigger>
              <TooltipPopupBlur sideOffset={8}>
                <div className="flex items-center gap-1.5">
                  <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                  <kbd className="flex items-center justify-center rounded-sm bg-black/40 px-1.5 py-1 font-sans text-xs font-semibold text-white/90">
                    F
                  </kbd>
                </div>
              </TooltipPopupBlur>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
