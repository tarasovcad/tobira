import type React from "react";

export interface CustomVideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
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

export interface VideoPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  loadedFraction: number;
  isFullscreen: boolean;
  isLoading: boolean;
  showControls: boolean;
  isFastForwarding: boolean;
}

export interface VideoPlayerActions {
  togglePlay: () => void;
  seekTo: (nextTime: number) => void;
  setVideoVolume: (nextVolume: number, options?: {commit?: boolean}) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  handleContainerMouseMove: () => void;
  handleContainerMouseLeave: () => void;
  handleVideoPointerDown: (event: React.PointerEvent<HTMLVideoElement>) => void;
  handleVideoPointerUpOrLeave: () => void;
  handleVideoClick: () => void;
  handleTimeUpdate: () => void;
  handleLoadedMetadata: () => void;
  handleLoadedData: () => void;
  handleProgress: () => void;
  handleEnded: () => void;
  handleCanPlay: () => void;
  handlePlay: () => void;
  handlePlaying: () => void;
  handlePause: () => void;
}

export interface VideoPlayerController {
  containerRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  state: VideoPlayerState;
  actions: VideoPlayerActions;
}
