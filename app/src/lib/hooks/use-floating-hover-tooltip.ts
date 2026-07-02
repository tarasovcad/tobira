import type {CSSProperties, MouseEventHandler} from "react";
import {useEffect, useMemo, useRef, useState} from "react";

type UseFloatingHoverTooltipOptions = {
  side?: "left" | "right" | "auto";
  offsetX?: number;
  offsetY?: number;
  collisionPadding?: number;
  horizontalFallback?: "clamp" | "center";
  verticalAlign?: "top" | "center";
  tooltipFallbackWidth?: number;
  tooltipFallbackHeight?: number;
  getCollisionRect?: (trigger: HTMLElement) => DOMRect | null;
  hideDelay?: number;
  openTransition?: string;
  closeTransition?: string;
  positionTransition?: string;
};

const defaultOpenTransition = "transform 0.2s cubic-bezier(0.34,1.4,0.64,1), opacity 0.12s ease";
const defaultCloseTransition = "transform 0.15s ease, opacity 0.15s ease";
const defaultPositionTransition =
  "left 0.2s cubic-bezier(0.34,1.4,0.64,1), top 0.2s cubic-bezier(0.34,1.4,0.64,1)";

export function useFloatingHoverTooltip({
  side = "right",
  offsetX = 8,
  offsetY = -13,
  collisionPadding = 8,
  horizontalFallback = "clamp",
  verticalAlign = "top",
  tooltipFallbackWidth = 0,
  tooltipFallbackHeight = 0,
  getCollisionRect,
  hideDelay = 80,
  openTransition = defaultOpenTransition,
  closeTransition = defaultCloseTransition,
  positionTransition = defaultPositionTransition,
}: UseFloatingHoverTooltipOptions = {}) {
  const [position, setPosition] = useState({x: 0, y: 0});
  const [visible, setVisible] = useState(false);
  const [animatePosition, setAnimatePosition] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const show: MouseEventHandler<HTMLElement> = (event) => {
    clearTimeout(hideTimer.current);
    const trigger = event.currentTarget;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth = Math.max(tooltipRect?.width ?? 0, tooltipFallbackWidth);
    const tooltipHeight = Math.max(tooltipRect?.height ?? 0, tooltipFallbackHeight);
    const collisionRect = getCollisionRect?.(trigger);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const collisionLeft = collisionRect?.left ?? 0;
    const collisionRight = collisionRect?.right ?? viewportWidth;
    const collisionTop = collisionRect?.top ?? 0;
    const collisionBottom = collisionRect?.bottom ?? viewportHeight;
    const rightX = rect.right + offsetX;
    const leftX = rect.left - offsetX - tooltipWidth;
    const horizontalMinX = collisionLeft + collisionPadding;
    const horizontalMaxX = Math.max(
      horizontalMinX,
      collisionRight - tooltipWidth - collisionPadding,
    );
    const fitsRight = rightX + tooltipWidth <= collisionRight - collisionPadding;
    const fitsLeft = leftX >= horizontalMinX;
    const availableRight = collisionRight - collisionPadding - rightX;
    const availableLeft = rect.left - offsetX - horizontalMinX;
    let resolvedSide = side;

    if (side === "auto") {
      if (fitsLeft && fitsRight) {
        resolvedSide = availableLeft >= availableRight ? "left" : "right";
      } else if (fitsLeft) {
        resolvedSide = "left";
      } else if (fitsRight) {
        resolvedSide = "right";
      } else {
        resolvedSide = availableLeft >= availableRight ? "left" : "right";
      }
    }

    if (side === "right" && !fitsRight) {
      resolvedSide = fitsLeft || availableLeft > availableRight ? "left" : "right";
    }

    if (side === "left" && !fitsLeft) {
      resolvedSide = fitsRight || availableRight > availableLeft ? "right" : "left";
    }
    const resolvedFits = resolvedSide === "right" ? fitsRight : fitsLeft;
    const centeredX = collisionLeft + (collisionRight - collisionLeft - tooltipWidth) / 2;
    const preferredX =
      horizontalFallback === "center" && !resolvedFits
        ? centeredX
        : resolvedSide === "right"
          ? rightX
          : leftX;
    const x = Math.min(Math.max(preferredX, horizontalMinX), horizontalMaxX);
    const preferredY = rect.top + rect.height / 2 + offsetY;
    const minY =
      verticalAlign === "center"
        ? collisionTop + tooltipHeight / 2 + collisionPadding
        : collisionTop + collisionPadding;
    const maxY =
      verticalAlign === "center"
        ? collisionBottom - tooltipHeight / 2 - collisionPadding
        : collisionBottom - tooltipHeight - collisionPadding;
    const clampedMaxY = Math.max(minY, maxY);
    const y = Math.min(Math.max(preferredY, minY), clampedMaxY);

    setPosition({
      x,
      y,
    });
    setVisible(true);
    setAnimatePosition(visible);
  };

  const hide = () => {
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setAnimatePosition(false);
    }, hideDelay);
  };

  const hideImmediately = () => {
    clearTimeout(hideTimer.current);
    setVisible(false);
    setAnimatePosition(false);
  };

  const keepVisible: MouseEventHandler<HTMLElement> = () => {
    clearTimeout(hideTimer.current);
    setVisible(true);
  };

  const tooltipStyle: CSSProperties = useMemo(
    () => ({
      left: position.x,
      top: position.y,
      opacity: visible ? 1 : 0,
      transition: visible
        ? `${animatePosition ? `${positionTransition}, ` : ""}${openTransition}`
        : closeTransition,
    }),
    [
      animatePosition,
      closeTransition,
      openTransition,
      position.x,
      position.y,
      positionTransition,
      visible,
    ],
  );

  return {
    getTriggerProps: () => ({
      onMouseEnter: show,
      onMouseLeave: hide,
    }),
    getTooltipProps: () => ({
      onMouseEnter: keepVisible,
      onMouseLeave: hide,
    }),
    hideImmediately,
    tooltipRef,
    tooltipStyle,
    visible,
  };
}
