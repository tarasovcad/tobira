import {
  useCallback,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
  type WheelEvent,
} from "react";
import {MIN_ZOOM, OVERLAY_TRANSITION_MS, ZOOM_STEP} from "./constants";
import type {Pan, PanBounds, Rect} from "./types";
import {applyElasticPan, clampPanToBounds, clampZoom, getTargetRect} from "./utils";
import {usePreviewEffects} from "./usePreviewEffects";

type UseMediaPreviewParams = {
  width: number;
  height: number;
  onOpenChange?: (open: boolean) => void;
};

type UseMediaPreviewResult = {
  triggerRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  expanded: boolean;
  fromRect: Rect | null;
  activeRect: Rect | null;
  animatedRect: Rect | null;
  zoom: number;
  pan: Pan;
  isDragging: boolean;
  openPreview: () => void;
  closePreview: () => void;
  handleZoomControlClick: () => void;
  handleWheelZoom: (event: WheelEvent<HTMLElement>) => void;
  handleMediaPointerDown: (event: PointerEvent<HTMLElement>) => void;
  handleMediaPointerMove: (event: PointerEvent<HTMLElement>) => void;
  handleMediaPointerUp: (event: PointerEvent<HTMLElement>) => void;
  handleMediaPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  handleMediaClick: () => void;
};

// Encapsulates all interaction and viewport state for MediaPreview.
export function useMediaPreview({
  width,
  height,
  onOpenChange,
}: UseMediaPreviewParams): UseMediaPreviewResult {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fromRect, setFromRect] = useState<Rect | null>(null);
  const [toRect, setToRect] = useState<Rect | null>(null);
  const [closeRequested, setCloseRequested] = useState(false);
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

  const resetInteractiveState = useCallback(() => {
    setZoom(1);
    setPan({x: 0, y: 0});
    setIsDragging(false);
    dragPointerIdRef.current = null;
    didDragRef.current = false;
  }, []);

  const openPreview = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const mediaEl = trigger.querySelector("img, video");
    if (!mediaEl) return;

    const thumbRect = mediaEl.getBoundingClientRect();
    const naturalWidth =
      (mediaEl as HTMLImageElement).naturalWidth ||
      (mediaEl as HTMLVideoElement).videoWidth ||
      width;
    const naturalHeight =
      (mediaEl as HTMLImageElement).naturalHeight ||
      (mediaEl as HTMLVideoElement).videoHeight ||
      height;
    const ratio = naturalWidth / naturalHeight;

    setFromRect({
      top: thumbRect.top,
      left: thumbRect.left,
      width: thumbRect.width,
      height: thumbRect.height,
    });
    setToRect(getTargetRect(ratio));
    setCloseRequested(false);
    resetInteractiveState();
    setOpen(true);
    onOpenChange?.(true);

    // Wait one painted frame after mount so opening from external triggers
    // still animates from the thumbnail rect instead of jumping to expanded.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setExpanded(true);
      });
    });
  }, [height, resetInteractiveState, onOpenChange, width]);

  const closePreview = useCallback(() => {
    if (!open || closeRequested) return;

    setCloseRequested(true);
    resetInteractiveState();
    setExpanded(false);

    window.setTimeout(() => {
      setOpen(false);
      onOpenChange?.(false);
      setCloseRequested(false);
    }, OVERLAY_TRANSITION_MS);
  }, [closeRequested, open, resetInteractiveState, onOpenChange]);

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

  usePreviewEffects({open, overlayRef, onEscape: closePreview});

  const animatedRect = (() => {
    if (!fromRect || !activeRect) return null;
    return expanded ? activeRect : fromRect;
  })();

  return {
    triggerRef,
    overlayRef,
    open,
    expanded,
    fromRect,
    activeRect,
    animatedRect,
    zoom,
    pan,
    isDragging,
    openPreview,
    closePreview,
    handleZoomControlClick,
    handleWheelZoom,
    handleMediaPointerDown,
    handleMediaPointerMove,
    handleMediaPointerUp,
    handleMediaPointerCancel,
    handleMediaClick,
  };
}
