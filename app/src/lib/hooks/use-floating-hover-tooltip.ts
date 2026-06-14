import type {CSSProperties, MouseEventHandler} from "react";
import {useEffect, useMemo, useRef, useState} from "react";

type UseFloatingHoverTooltipOptions = {
  side?: "left" | "right";
  offsetX?: number;
  offsetY?: number;
  collisionPadding?: number;
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
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth = tooltipRect?.width ?? 0;
    const tooltipHeight = tooltipRect?.height ?? 0;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rightX = rect.right + offsetX;
    const leftX = rect.left - offsetX - tooltipWidth;
    const fitsRight = rightX + tooltipWidth <= viewportWidth - collisionPadding;
    const fitsLeft = leftX >= collisionPadding;
    const availableRight = viewportWidth - collisionPadding - rightX;
    const availableLeft = rect.left - offsetX - collisionPadding;
    let resolvedSide = side;

    if (side === "right" && !fitsRight) {
      resolvedSide = fitsLeft || availableLeft > availableRight ? "left" : "right";
    }

    if (side === "left" && !fitsLeft) {
      resolvedSide = fitsRight || availableRight > availableLeft ? "right" : "left";
    }
    const preferredX = resolvedSide === "right" ? rightX : leftX;
    const maxX = Math.max(collisionPadding, viewportWidth - tooltipWidth - collisionPadding);
    const x = Math.min(Math.max(preferredX, collisionPadding), maxX);
    const preferredY = rect.top + rect.height / 2 + offsetY;
    const maxY = Math.max(collisionPadding, viewportHeight - tooltipHeight - collisionPadding);
    const y = Math.min(Math.max(preferredY, collisionPadding), maxY);

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
    tooltipRef,
    tooltipStyle,
    visible,
  };
}
