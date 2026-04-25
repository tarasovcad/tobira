"use client";

import {
  Tooltip,
  TooltipPopupBlur,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/coss/tooltip";
import {VideoProgressControl} from "@/features/video-player/components/VideoProgressControl";
import {VideoVolumeControl} from "@/features/video-player/components/VideoVolumeControl";
import type {VideoPlayerState} from "@/features/video-player/types";

type VideoPlayerControlsProps = {
  state: Pick<
    VideoPlayerState,
    | "currentTime"
    | "duration"
    | "isFullscreen"
    | "isMuted"
    | "isPlaying"
    | "loadedFraction"
    | "showControls"
    | "volume"
  >;
  controlsVisible?: boolean;
  formatTime: (timeInSeconds: number) => string;
  onSeek: (nextTime: number) => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onVolumeChange: (nextVolume: number, options?: {commit?: boolean}) => void;
};

export function VideoPlayerControls({
  state,
  controlsVisible,
  formatTime,
  onSeek,
  onToggleFullscreen,
  onToggleMute,
  onTogglePlay,
  onVolumeChange,
}: VideoPlayerControlsProps) {
  const {
    currentTime,
    duration,
    isFullscreen,
    isMuted,
    isPlaying,
    loadedFraction,
    showControls,
    volume,
  } = state;

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className={`absolute right-0 bottom-0 left-0 z-20 transform bg-linear-to-t from-black/20 to-transparent px-3 pb-3 transition duration-150 ease-in will-change-transform group-hover/video:translate-y-0 group-hover/video:opacity-100 group-hover/video:duration-200 group-hover/video:ease-out group-has-[video:focus-visible]/video:translate-y-0 group-has-[video:focus-visible]/video:opacity-100 group-has-[video:focus-visible]/video:duration-200 group-has-[video:focus-visible]/video:ease-out ${
        showControls || controlsVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}>
      <TooltipProvider delay={300}>
        <div className="flex w-full flex-wrap items-center gap-x-0.5 gap-y-1 text-white">
          <Tooltip>
            <TooltipTrigger
              onClick={onTogglePlay}
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

          <VideoVolumeControl
            isMuted={isMuted}
            volume={volume}
            onToggleMute={onToggleMute}
            onSetVolume={onVolumeChange}
          />

          <div className="shrink-0 px-2 text-sm font-semibold text-white tabular-nums @max-[364px]/video-player:hidden">
            {formatTime(currentTime)}
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-1 px-2 text-sm font-semibold text-white tabular-nums @max-[364px]/video-player:flex @max-[364px]/video-player:pl-0 @max-[229px]/video-player:hidden">
            <span>{formatTime(currentTime)}</span>
            <span className="text-white/70">/</span>
            <span>-{formatTime(duration - currentTime)}</span>
          </div>

          <VideoProgressControl
            currentTime={currentTime}
            duration={duration}
            loadedFraction={loadedFraction}
            formatTime={formatTime}
            onSeek={onSeek}
          />

          <div className="shrink-0 px-2 text-sm font-semibold text-white tabular-nums @max-[364px]/video-player:hidden">
            -{formatTime(duration - currentTime)}
          </div>

          <Tooltip>
            <TooltipTrigger
              onClick={onToggleFullscreen}
              className="group/play relative flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-md p-2 text-white outline-hidden transition duration-100 ease-linear before:absolute before:size-6 hover:bg-white/20 hover:backdrop-blur-sm focus-visible:outline-offset-2 focus-visible:outline-white @max-[229px]/video-player:ml-auto">
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
  );
}
