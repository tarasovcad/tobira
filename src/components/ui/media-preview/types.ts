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
  className?: string;
  buttonClassName?: string;
  previewClassName?: string;
  type?: "image" | "video";
  unoptimized?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  onCanPlay?: () => void;
  addZoom?: boolean;
};
