"use client";

import {forwardRef, useRef, useState, useEffect, useCallback, type HTMLAttributes} from "react";
import {motion, useMotionValue, animate} from "framer-motion";
import {Switch as SwitchPrimitive} from "@base-ui/react/switch";
import {cn} from "@/lib/utils/classnames";
import {springs} from "@/lib/ui/springs";

interface SwitchProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  labelClassName?: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const SWITCH_SIZES = {
  sm: {
    TRACK_WIDTH: 28,
    TRACK_HEIGHT: 16,
    THUMB_SIZE: 12,
    THUMB_OFFSET: 2,
    PILL_EXTEND: 2,
    PRESS_EXTEND: 3,
    PRESS_SHRINK: 2,
  },
  md: {
    TRACK_WIDTH: 34,
    TRACK_HEIGHT: 20,
    THUMB_SIZE: 16,
    THUMB_OFFSET: 2,
    PILL_EXTEND: 2,
    PRESS_EXTEND: 4,
    PRESS_SHRINK: 4,
  },
  lg: {
    TRACK_WIDTH: 38,
    TRACK_HEIGHT: 22,
    THUMB_SIZE: 18,
    THUMB_OFFSET: 2,
    PILL_EXTEND: 2,
    PRESS_EXTEND: 4,
    PRESS_SHRINK: 4,
  },
};

const SIZES_CLASSES = {
  sm: {
    label: "text-xs",
    container: "gap-2 px-2 py-1.5",
  },
  md: {
    label: "text-[13px]",
    container: "gap-2.5 px-3 py-2",
  },
  lg: {
    label: "text-sm",
    container: "gap-3 px-4 py-2.5",
  },
};

const DRAG_DEAD_ZONE = 2;

const Switch = forwardRef<HTMLDivElement, SwitchProps>(
  (
    {label, checked, onToggle, disabled = false, className, labelClassName, size = "md", ...props},
    ref,
  ) => {
    const {
      TRACK_WIDTH,
      TRACK_HEIGHT,
      THUMB_SIZE,
      THUMB_OFFSET,
      PILL_EXTEND,
      PRESS_EXTEND,
      PRESS_SHRINK,
    } = SWITCH_SIZES[size];

    const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET * 2;
    const [hasMounted, setHasMounted] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);

    // Drag refs (not state to avoid re-renders during drag)
    const dragging = useRef(false);
    const didDrag = useRef(false);
    const pointerStart = useRef<{
      clientX: number;
      originX: number;
    } | null>(null);

    // Motion value for thumb x-axis
    const motionX = useMotionValue(checked ? THUMB_OFFSET + THUMB_TRAVEL : THUMB_OFFSET);

    useEffect(() => {
      const frame = requestAnimationFrame(() => setHasMounted(true));
      return () => cancelAnimationFrame(frame);
    }, []);

    // Compute thumb shape
    const thumbWidth = pressed
      ? THUMB_SIZE + PRESS_EXTEND
      : hovered
        ? THUMB_SIZE + PILL_EXTEND
        : THUMB_SIZE;
    const thumbHeight = pressed ? THUMB_SIZE - PRESS_SHRINK : THUMB_SIZE;
    const thumbY = pressed ? THUMB_OFFSET + PRESS_SHRINK / 2 : THUMB_OFFSET;
    const extraWidth = thumbWidth - THUMB_SIZE;
    const thumbX = checked ? THUMB_OFFSET + THUMB_TRAVEL - extraWidth : THUMB_OFFSET;

    // Sync motionX when thumbX changes (hover/press/checked) and not dragging
    useEffect(() => {
      if (dragging.current) return;
      if (!hasMounted) {
        motionX.set(thumbX);
      } else {
        animate(motionX, thumbX, springs.moderate);
      }
    }, [thumbX, motionX, hasMounted]);

    // --- Pointer handlers ---

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        setPressed(true);
        dragging.current = false;
        didDrag.current = false;
        pointerStart.current = {
          clientX: e.clientX,
          originX: motionX.get(),
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      [disabled, motionX],
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerStart.current) return;
        const delta = e.clientX - pointerStart.current.clientX;

        if (!dragging.current) {
          if (Math.abs(delta) < DRAG_DEAD_ZONE) return;
          dragging.current = true;
        }

        const dragMin = THUMB_OFFSET;
        const pressedThumbWidth = THUMB_SIZE + PRESS_EXTEND;
        const dragMax = TRACK_WIDTH - THUMB_OFFSET - pressedThumbWidth;
        const rawX = pointerStart.current.originX + delta;
        motionX.set(Math.max(dragMin, Math.min(dragMax, rawX)));
      },
      [motionX, THUMB_OFFSET, THUMB_SIZE, PRESS_EXTEND, TRACK_WIDTH],
    );

    const handlePointerUp = useCallback(() => {
      if (!pointerStart.current) return;
      setPressed(false);

      if (dragging.current) {
        didDrag.current = true;
        dragging.current = false;

        const currentX = motionX.get();
        const dragMin = THUMB_OFFSET;
        const pressedThumbWidth = THUMB_SIZE + PRESS_EXTEND;
        const dragMax = TRACK_WIDTH - THUMB_OFFSET - pressedThumbWidth;
        const midpoint = (dragMin + dragMax) / 2;

        const shouldBeOn = currentX > midpoint;

        if (shouldBeOn !== checked) {
          onToggle();
        } else {
          // Snap back to current resting position (un-pressed)
          const snapTarget = checked ? THUMB_OFFSET + THUMB_TRAVEL : THUMB_OFFSET;
          animate(motionX, snapTarget, springs.moderate);
        }

        requestAnimationFrame(() => {
          didDrag.current = false;
        });
      }

      pointerStart.current = null;
    }, [
      checked,
      onToggle,
      motionX,
      THUMB_OFFSET,
      THUMB_SIZE,
      PRESS_EXTEND,
      TRACK_WIDTH,
      THUMB_TRAVEL,
    ]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative z-10 flex cursor-pointer touch-none items-center select-none",
          SIZES_CLASSES[size].container,
          disabled && "pointer-events-none opacity-60",
          className,
        )}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => {
          if (disabled || didDrag.current) return;
          onToggle();
        }}
        {...props}>
        {/* Switch */}
        <SwitchPrimitive.Root
          checked={checked}
          onCheckedChange={() => {
            if (didDrag.current) return;
            onToggle();
          }}
          disabled={disabled}
          className={cn(
            "relative shrink-0 cursor-pointer rounded-full outline-none",
            "transition-colors duration-80",
            "focus-visible:ring-offset-background focus-visible:ring-1 focus-visible:ring-[#6B97FF] focus-visible:ring-offset-2",
          )}
          style={{
            width: TRACK_WIDTH,
            height: TRACK_HEIGHT,
            backgroundColor: checked
              ? hovered
                ? "#5C89F2"
                : "#6B97FF"
              : hovered
                ? "color-mix(in oklab, var(--accent), var(--foreground) 10%)"
                : "var(--accent)",
          }}
          onClick={(e) => e.stopPropagation()}>
          <SwitchPrimitive.Thumb
            render={
              <motion.span
                className="absolute top-0 left-0 block rounded-full bg-white shadow-sm"
                initial={false}
                style={{x: motionX}}
                animate={{
                  y: thumbY,
                  width: thumbWidth,
                  height: thumbHeight,
                }}
                transition={hasMounted ? springs.moderate : {duration: 0}}
              />
            }
          />
        </SwitchPrimitive.Root>

        {/* Label */}
        {label && (
          <span
            className={cn(
              "transition-[color] duration-80",
              SIZES_CLASSES[size].label,
              checked ? "text-foreground" : "text-muted-foreground",
              labelClassName,
            )}>
            {label}
          </span>
        )}
      </div>
    );
  },
);

Switch.displayName = "Switch";

export {Switch};
export type {SwitchProps};
