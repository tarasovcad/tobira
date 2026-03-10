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
import {clampPanToBounds, clampZoom, getTargetRect} from "./utils";
import {usePreviewEffects} from "./usePreviewEffects";

type UseImagePreviewParams = {
  width: number;
  height: number;
};

type UseImagePreviewResult = {
  triggerRef: RefObject<HTMLButtonElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  expanded: boolean;
  isFullscreen: boolean;
  fromRect: Rect | null;
  activeRect: Rect | null;
  animatedRect: Rect | null;
  zoom: number;
  pan: Pan;
  isDragging: boolean;
  openPreview: () => void;
  closePreview: () => void;
  handleZoomControlClick: () => void;
  handleWheelZoom: (event: WheelEvent<HTMLImageElement>) => void;
  handleImagePointerDown: (event: PointerEvent<HTMLImageElement>) => void;
  handleImagePointerMove: (event: PointerEvent<HTMLImageElement>) => void;
  handleImagePointerUp: (event: PointerEvent<HTMLImageElement>) => void;
  handleImagePointerCancel: (event: PointerEvent<HTMLImageElement>) => void;
  handleImageClick: () => void;
  handleToggleFullscreen: () => Promise<void>;
};

// Encapsulates all interaction and viewport state for ImagePreview.
export function useImagePreview({width, height}: UseImagePreviewParams): UseImagePreviewResult {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    if (isFullscreen) {
      const overlay = overlayRef.current;
      if (overlay) {
        return {width: overlay.clientWidth, height: overlay.clientHeight};
      }
    }

    if (activeRect) {
      return {width: activeRect.width, height: activeRect.height};
    }

    return null;
  }, [activeRect, isFullscreen]);

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

    const imageEl = trigger.querySelector("img");
    if (!imageEl) return;

    const thumbRect = imageEl.getBoundingClientRect();
    const naturalWidth = imageEl.naturalWidth || width;
    const naturalHeight = imageEl.naturalHeight || height;
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

    requestAnimationFrame(() => {
      setExpanded(true);
    });
  }, [height, resetInteractiveState, width]);

  const closePreview = useCallback(() => {
    if (!open || closeRequested) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }

    setCloseRequested(true);
    setIsFullscreen(false);
    resetInteractiveState();
    setExpanded(false);

    window.setTimeout(() => {
      setOpen(false);
      setCloseRequested(false);
    }, OVERLAY_TRANSITION_MS);
  }, [closeRequested, open, resetInteractiveState]);

  const handleZoomControlClick = useCallback(() => {
    if (zoom > MIN_ZOOM) {
      applyZoom((prev) => prev - ZOOM_STEP);
      return;
    }

    applyZoom((prev) => prev + ZOOM_STEP);
  }, [applyZoom, zoom]);

  const handleWheelZoom = useCallback(
    (event: WheelEvent<HTMLImageElement>) => {
      event.preventDefault();

      const direction = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      applyZoom((prev) => prev + direction);
    },
    [applyZoom],
  );

  const handleImagePointerDown = useCallback(
    (event: PointerEvent<HTMLImageElement>) => {
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

  const handleImagePointerMove = useCallback(
    (event: PointerEvent<HTMLImageElement>) => {
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

      setPan(clampPanToBounds({x: nextX, y: nextY}, panBounds, zoom));
    },
    [getPanBounds, zoom],
  );

  const stopDragging = useCallback((pointerId?: number) => {
    if (pointerId !== undefined && dragPointerIdRef.current !== pointerId) return;
    dragPointerIdRef.current = null;
    setIsDragging(false);
  }, []);

  const handleImagePointerUp = useCallback(
    (event: PointerEvent<HTMLImageElement>) => {
      stopDragging(event.pointerId);
    },
    [stopDragging],
  );

  const handleImagePointerCancel = useCallback(
    (event: PointerEvent<HTMLImageElement>) => {
      stopDragging(event.pointerId);
    },
    [stopDragging],
  );

  const handleImageClick = useCallback(() => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    handleZoomControlClick();
  }, [handleZoomControlClick]);

  const handleToggleFullscreen = useCallback(async () => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    try {
      if (!document.fullscreenElement) {
        await overlay.requestFullscreen();
      } else if (document.fullscreenElement === overlay) {
        await document.exitFullscreen();
      }
    } catch {
      // Keep UI stable when fullscreen is blocked by browser.
    }
  }, []);

  usePreviewEffects({open, overlayRef, onEscape: closePreview, setIsFullscreen});

  const animatedRect = (() => {
    if (!fromRect || !activeRect) return null;
    return expanded ? activeRect : fromRect;
  })();

  return {
    triggerRef,
    overlayRef,
    open,
    expanded,
    isFullscreen,
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
    handleImagePointerDown,
    handleImagePointerMove,
    handleImagePointerUp,
    handleImagePointerCancel,
    handleImageClick,
    handleToggleFullscreen,
  };
}
