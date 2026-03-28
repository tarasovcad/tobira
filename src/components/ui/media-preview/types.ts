import type {ReactNode} from "react";

export type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type Pan = {
  x: number;
  y: number;
};

export type PanBounds = {
  width: number;
  height: number;
};

export type MediaPreviewProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  openSignal?: number;
  disableClickToOpen?: boolean;
  className?: string;
  buttonClassName?: string;
  previewClassName?: string;
  type?: "image" | "video";
  unoptimized?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  onCanPlay?: () => void;
  addZoom?: boolean;
  /** When true, the preview overlay shows fallback content instead of the image */
  showFallback?: boolean;
  /** Content to render in the overlay when showFallback is true (e.g. placeholder icon) */
  fallback?: ReactNode;
};
