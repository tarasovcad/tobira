import type {PointerEventHandler, ReactNode, WheelEventHandler} from "react";
import {MIN_ZOOM} from "./constants";
import type {Pan, Rect} from "./types";
import {cn} from "@/lib/utils";

type PreviewSurfaceProps = {
  animatedRect: Rect;
  expanded?: boolean;
  zoom: number;
  pan: Pan;
  isDragging: boolean;
  interactive?: boolean;
  animateLayout?: boolean;
  fadeWhenCollapsed?: boolean;
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
  expanded = true,
  zoom,
  pan,
  isDragging,
  interactive = false,
  animateLayout = true,
  fadeWhenCollapsed = false,
  className,
  children,
  onClick,
  onWheel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: PreviewSurfaceProps) {
  const transitionClassName = !animateLayout
    ? "transition-none"
    : isDragging
      ? fadeWhenCollapsed
        ? "transition-[top,left,width,height,border-radius,opacity] duration-[160ms]"
        : "transition-[top,left,width,height,border-radius] duration-[160ms]"
      : fadeWhenCollapsed
        ? "transition-[top,left,width,height,transform,border-radius,opacity] duration-[240ms]"
        : "transition-[top,left,width,height,transform,border-radius] duration-[240ms]";

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
        transitionClassName,
        className,
      )}
      style={{
        top: animatedRect.top,
        left: animatedRect.left,
        width: animatedRect.width,
        height: animatedRect.height,
        opacity: fadeWhenCollapsed && !expanded ? 0 : 1,
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
