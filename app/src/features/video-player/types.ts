import type React from "react";
import type {ReactNode, RefObject} from "react";

export interface VideoPlayerSessionOptions extends Omit<
  React.VideoHTMLAttributes<HTMLVideoElement>,
  "children" | "className" | "poster" | "src"
> {
  enabled?: boolean;
  src?: string;
  poster?: string;
  playing?: boolean;
  unmuteOnFirstInteraction?: boolean;
}

export interface CustomVideoPlayerProps extends VideoPlayerSessionOptions {
  src: string;
  className?: string;
  videoClassName?: string;
  showMainPlayIcon?: boolean;
  minimal?: boolean;
  controlsVisible?: boolean;
  disableClickToggle?: boolean;
  onRequestFullscreen?: () => void;
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
  consumeFirstInteractionUnmute: () => void;
  togglePlay: () => void;
  startMutedPlayback: () => void;
  seekTo: (nextTime: number) => void;
  setVideoVolume: (nextVolume: number, options?: {commit?: boolean}) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  handleContainerMouseMove: () => void;
  handleContainerMouseLeave: () => void;
  handleVideoPointerDown: (event: PointerEvent) => void;
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

export interface VideoPlayerHostOptions {
  containerNode: HTMLDivElement | null;
  mountNode: HTMLDivElement | null;
  videoClassName?: string;
  disableClickToggle?: boolean;
  onRequestFullscreen?: () => void;
}

export interface VideoPlayerSession {
  videoRef: RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  state: VideoPlayerState;
  actions: VideoPlayerActions;
  attachToHost: (host: VideoPlayerHostOptions) => void;
  detachFromHost: (containerNode: HTMLDivElement | null) => void;
}

export interface VideoPlayerShellProps {
  session: VideoPlayerSession;
  className?: string;
  videoClassName?: string;
  showMainPlayIcon?: boolean;
  minimal?: boolean;
  controlsVisible?: boolean;
  disableClickToggle?: boolean;
  onRequestFullscreen?: () => void;
  attachVideo?: boolean;
  placeholder?: ReactNode;
}
