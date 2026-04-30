"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
  type WheelEvent,
} from "react";
import {MIN_ZOOM, OVERLAY_TRANSITION_MS, ZOOM_STEP} from "../components/preview/constants";
import type {Pan, PanBounds, Rect} from "../components/preview/types";
import {
  applyElasticPan,
  clampPanToBounds,
  clampZoom,
  getTargetRect,
} from "../components/preview/utils";
import {usePreviewEffects} from "./usePreviewEffects";
import {isEditableElementActive} from "@/features/video-player/utils";

export type OpenPreviewOverlayArgs = {
  fromRect: Rect;
  width: number;
  height: number;
  originKey?: string | null;
};

type UsePreviewOverlayControllerParams = {
  onOpenChange?: (open: boolean) => void;
  onEscape?: () => void;
  type?: "image" | "video";
  addZoom?: boolean;
};

export type UsePreviewOverlayControllerResult = {
  overlayRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  expanded: boolean;
  animatedRect: Rect | null;
  animateLayout: boolean;
  fadeSurfaceOnClose: boolean;
  zoom: number;
  pan: Pan;
  isDragging: boolean;
  openPreviewFromRect: (args: OpenPreviewOverlayArgs) => void;
  closePreview: () => void;
  setPreviewSize: (width: number, height: number, options?: {entryKey?: string | null}) => void;
  resetInteractionState: () => void;
  handleZoomControlClick: () => void;
  handleWheelZoom: (event: WheelEvent<HTMLElement>) => void;
  handleMediaPointerDown: (event: PointerEvent<HTMLElement>) => void;
  handleMediaPointerMove: (event: PointerEvent<HTMLElement>) => void;
  handleMediaPointerUp: (event: PointerEvent<HTMLElement>) => void;
  handleMediaPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  handleMediaClick: () => void;
};

export function usePreviewOverlayController({
  onOpenChange,
  onEscape,
  type = "image",
  addZoom = true,
}: UsePreviewOverlayControllerParams): UsePreviewOverlayControllerResult {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const restoreLayoutAnimationFrameRef = useRef<number | null>(null);
  const originKeyRef = useRef<string | null>(null);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fromRect, setFromRect] = useState<Rect | null>(null);
  const [toRect, setToRect] = useState<Rect | null>(null);
  const [closeRequested, setCloseRequested] = useState(false);
  const [animateLayout, setAnimateLayout] = useState(true);
  const [shouldCloseToOrigin, setShouldCloseToOrigin] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({x: 0, y: 0});
  const [isDragging, setIsDragging] = useState(false);

  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartPointRef = useRef({x: 0, y: 0});
  const dragStartPanRef = useRef<Pan>({x: 0, y: 0});
  const didDragRef = useRef(false);

  const activeRect = toRect;

  const getPanBounds = useCallback((): PanBounds | null => {
    if (activeRect) {
      return {width: activeRect.width, height: activeRect.height};
    }

    return null;
  }, [activeRect]);

  const applyZoom = useCallback(
    (updater: (prev: number) => number) => {
      setZoom((prevZoom) => {
        const nextZoom = clampZoom(updater(prevZoom));

        setPan((prevPan) => {
          const panBounds = getPanBounds();
          if (!panBounds) {
            return {x: 0, y: 0};
          }

          return clampPanToBounds(prevPan, panBounds, nextZoom);
        });

        return nextZoom;
      });
    },
    [getPanBounds],
  );

  const resetInteractionState = useCallback(() => {
    setZoom(1);
    setPan({x: 0, y: 0});
    setIsDragging(false);
    dragPointerIdRef.current = null;
    didDragRef.current = false;
  }, []);

  const openPreviewFromRect = useCallback(
    ({fromRect: nextFromRect, width, height, originKey}: OpenPreviewOverlayArgs) => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      if (restoreLayoutAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(restoreLayoutAnimationFrameRef.current);
        restoreLayoutAnimationFrameRef.current = null;
      }

      setFromRect(nextFromRect);
      setToRect(getTargetRect(width / height));
      originKeyRef.current = originKey ?? null;
      setCloseRequested(false);
      setAnimateLayout(true);
      setShouldCloseToOrigin(true);
      resetInteractionState();
      setOpen(true);
      onOpenChange?.(true);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setExpanded(true);
        });
      });
    },
    [onOpenChange, resetInteractionState],
  );

  const closePreview = useCallback(() => {
    if (!open || closeRequested) return;

    setCloseRequested(true);
    resetInteractionState();
    setExpanded(false);

    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      onOpenChange?.(false);
      setCloseRequested(false);
      closeTimeoutRef.current = null;
    }, OVERLAY_TRANSITION_MS);
  }, [closeRequested, onOpenChange, open, resetInteractionState]);

  const setPreviewSize = useCallback(
    (width: number, height: number, options?: {entryKey?: string | null}) => {
      if (restoreLayoutAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(restoreLayoutAnimationFrameRef.current);
      }

      setAnimateLayout(false);
      setShouldCloseToOrigin(
        options?.entryKey !== undefined && options.entryKey === originKeyRef.current,
      );
      setToRect(getTargetRect(width / height));
      restoreLayoutAnimationFrameRef.current = window.requestAnimationFrame(() => {
        setAnimateLayout(true);
        restoreLayoutAnimationFrameRef.current = null;
      });
    },
    [],
  );

  const handleZoomControlClick = useCallback(() => {
    if (zoom > MIN_ZOOM) {
      applyZoom((prev) => prev - ZOOM_STEP);
      return;
    }

    applyZoom((prev) => prev + ZOOM_STEP);
  }, [applyZoom, zoom]);

  const handleWheelZoom = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      event.preventDefault();

      const direction = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      applyZoom((prev) => prev + direction);
    },
    [applyZoom],
  );

  const handleMediaPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (zoom <= MIN_ZOOM) return;

      event.preventDefault();
      dragPointerIdRef.current = event.pointerId;
      dragStartPointRef.current = {x: event.clientX, y: event.clientY};
      dragStartPanRef.current = pan;
      didDragRef.current = false;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [pan, zoom],
  );

  const handleMediaPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (dragPointerIdRef.current !== event.pointerId) return;

      const panBounds = getPanBounds();
      if (!panBounds) return;

      const deltaX = event.clientX - dragStartPointRef.current.x;
      const deltaY = event.clientY - dragStartPointRef.current.y;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        didDragRef.current = true;
      }

      const nextX = dragStartPanRef.current.x + deltaX;
      const nextY = dragStartPanRef.current.y + deltaY;

      setPan(applyElasticPan({x: nextX, y: nextY}, panBounds, zoom));
    },
    [getPanBounds, zoom],
  );

  const stopDragging = useCallback(
    (pointerId?: number) => {
      if (pointerId !== undefined && dragPointerIdRef.current !== pointerId) return;

      dragPointerIdRef.current = null;
      setIsDragging(false);
      setPan((prevPan) => {
        const panBounds = getPanBounds();
        if (!panBounds) {
          return {x: 0, y: 0};
        }

        return clampPanToBounds(prevPan, panBounds, zoom);
      });
    },
    [getPanBounds, zoom],
  );

  const handleMediaPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      stopDragging(event.pointerId);
    },
    [stopDragging],
  );

  const handleMediaPointerCancel = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      stopDragging(event.pointerId);
    },
    [stopDragging],
  );

  const handleMediaClick = useCallback(() => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    handleZoomControlClick();
  }, [handleZoomControlClick]);

  useEffect(() => {
    if (!open || type !== "image" || !addZoom) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableElementActive()) return;

      const isZoomInKey =
        event.key === "+" || event.code === "NumpadAdd" || (event.shiftKey && event.key === "=");
      const isZoomOutKey =
        event.key === "-" || event.code === "NumpadSubtract" || event.key === "_";

      if (isZoomInKey) {
        event.preventDefault();
        applyZoom((prev) => prev + ZOOM_STEP);
        return;
      }

      if (isZoomOutKey) {
        event.preventDefault();
        applyZoom((prev) => prev - ZOOM_STEP);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addZoom, applyZoom, open, type]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
      if (restoreLayoutAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(restoreLayoutAnimationFrameRef.current);
      }
    };
  }, []);

  usePreviewEffects({open, overlayRef, onEscape: onEscape ?? closePreview});

  const animatedRect = (() => {
    if (!activeRect) return null;

    const collapsedRect = shouldCloseToOrigin ? fromRect : activeRect;
    if (!collapsedRect) return null;

    return expanded ? activeRect : collapsedRect;
  })();

  return {
    overlayRef,
    open,
    expanded,
    animatedRect,
    animateLayout,
    fadeSurfaceOnClose: !shouldCloseToOrigin,
    zoom,
    pan,
    isDragging,
    openPreviewFromRect,
    closePreview,
    setPreviewSize,
    resetInteractionState,
    handleZoomControlClick,
    handleWheelZoom,
    handleMediaPointerDown,
    handleMediaPointerMove,
    handleMediaPointerUp,
    handleMediaPointerCancel,
    handleMediaClick,
  };
}
