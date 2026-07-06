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
  const layoutDurationClassName = expanded ? "duration-[360ms]" : "duration-[240ms]";
  const transitionClassName = !animateLayout
    ? "transition-none"
    : isDragging
      ? fadeWhenCollapsed
        ? "transition-[top,left,width,height,border-radius,opacity] duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        : "transition-[top,left,width,height,border-radius] duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      : fadeWhenCollapsed
        ? `transition-[top,left,width,height,transform,border-radius,opacity] ${layoutDurationClassName} ease-[cubic-bezier(0.16,1,0.3,1)]`
        : `transition-[top,left,width,height,transform,border-radius] ${layoutDurationClassName} ease-[cubic-bezier(0.16,1,0.3,1)]`;

  return (
    <div
      onClick={interactive ? onClick : undefined}
      onWheel={interactive ? onWheel : undefined}
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? onPointerUp : undefined}
      onPointerCancel={interactive ? onPointerCancel : undefined}
      className={cn(
        "absolute overflow-hidden rounded-xl shadow-2xl will-change-[top,left,width,height,transform,opacity]",
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
