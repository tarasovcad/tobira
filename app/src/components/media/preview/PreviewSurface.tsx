import type {PointerEventHandler, ReactNode, WheelEventHandler} from "react";
import {MIN_ZOOM} from "./constants";
import type {Pan, Rect} from "./types";
import {cn} from "@/lib/utils";

type PreviewSurfaceProps = {
  animatedRect: Rect;
  zoom: number;
  pan: Pan;
  isDragging: boolean;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  onWheel?: WheelEventHandler<HTMLDivElement>;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  onPointerMove?: PointerEventHandler<HTMLDivElement>;
  onPointerUp?: PointerEventHandler<HTMLDivElement>;
  onPointerCancel?: PointerEventHandler<HTMLDivElement>;
};

export function PreviewSurface({
  animatedRect,
  zoom,
  pan,
  isDragging,
  interactive = false,
  className,
  children,
  onClick,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: PreviewSurfaceProps) {
  return (
    <div
      onClick={interactive ? onClick : undefined}
      onWheel={interactive ? onWheel : undefined}
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? onPointerUp : undefined}
      onPointerCancel={interactive ? onPointerCancel : undefined}
      className={cn(
        "absolute overflow-hidden rounded-xl shadow-2xl ease-out",
        isDragging
          ? "transition-[top,left,width,height,border-radius]"
          : "transition-[top,left,width,height,transform,border-radius] duration-250",
        className,
      )}
      style={{
        top: animatedRect.top,
        left: animatedRect.left,
        width: animatedRect.width,
        height: animatedRect.height,
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: "center center",
        cursor: !interactive
          ? "auto"
          : isDragging
            ? "grabbing"
            : zoom > MIN_ZOOM
              ? "grab"
              : "zoom-in",
        touchAction: interactive ? "none" : undefined,
      }}>
      {children}
    </div>
  );
}
