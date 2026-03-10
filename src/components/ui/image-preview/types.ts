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

export type ImagePreviewProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  previewClassName?: string;
};
