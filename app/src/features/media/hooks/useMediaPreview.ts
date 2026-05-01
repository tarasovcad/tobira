"use client";

import {useCallback, useEffect, useRef, type RefObject} from "react";
import {usePreviewOverlayController} from "./usePreviewOverlayController";
import {isEditableElementActive} from "@/features/video-player/utils";

let activePreviewInstance: symbol | null = null;

type UseMediaPreviewParams = {
  width: number;
  height: number;
  onOpenChange?: (open: boolean) => void;
  type?: "image" | "video";
  addZoom?: boolean;
};

type UseMediaPreviewResult = {
  triggerRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  expanded: boolean;
  animatedRect: ReturnType<typeof usePreviewOverlayController>["animatedRect"];
  zoom: number;
  pan: ReturnType<typeof usePreviewOverlayController>["pan"];
  isDragging: boolean;
  openPreview: () => void;
  closePreview: () => void;
  handleZoomControlClick: () => void;
  handleWheelZoom: ReturnType<typeof usePreviewOverlayController>["handleWheelZoom"];
  handleMediaPointerDown: ReturnType<typeof usePreviewOverlayController>["handleMediaPointerDown"];
  handleMediaPointerMove: ReturnType<typeof usePreviewOverlayController>["handleMediaPointerMove"];
  handleMediaPointerUp: ReturnType<typeof usePreviewOverlayController>["handleMediaPointerUp"];
  handleMediaPointerCancel: ReturnType<
    typeof usePreviewOverlayController
  >["handleMediaPointerCancel"];
  handleMediaClick: () => void;
};

export function useMediaPreview({
  width,
  height,
  onOpenChange,
  type = "image",
  addZoom = true,
}: UseMediaPreviewParams): UseMediaPreviewResult {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const previewInstanceRef = useRef(Symbol("media-preview"));
  const preview = usePreviewOverlayController({
    onOpenChange,
    type,
    addZoom,
  });

  const openPreview = useCallback(() => {
    if (activePreviewInstance !== null && activePreviewInstance !== previewInstanceRef.current) {
      return;
    }

    const trigger = triggerRef.current;
    if (!trigger) return;

    const mediaElement = trigger.querySelector("img, video");
    if (!mediaElement) return;

    const thumbRect = mediaElement.getBoundingClientRect();
    const naturalWidth =
      (mediaElement as HTMLImageElement).naturalWidth ||
      (mediaElement as HTMLVideoElement).videoWidth ||
      width;
    const naturalHeight =
      (mediaElement as HTMLImageElement).naturalHeight ||
      (mediaElement as HTMLVideoElement).videoHeight ||
      height;

    activePreviewInstance = previewInstanceRef.current;
    preview.openPreviewFromRect({
      fromRect: {
        top: thumbRect.top,
        left: thumbRect.left,
        width: thumbRect.width,
        height: thumbRect.height,
      },
      width: naturalWidth,
      height: naturalHeight,
    });
  }, [height, preview, width]);

  const closePreview = useCallback(() => {
    preview.closePreview();
  }, [preview]);

  useEffect(() => {
    if (type !== "image") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableElementActive()) return;

      const trigger = triggerRef.current;
      if (!trigger) return;

      const isHovered = trigger.matches(":hover");
      const isFocusedWithin = trigger.contains(document.activeElement);

      if (!preview.open && !isHovered && !isFocusedWithin) {
        return;
      }

      if (event.key.toLowerCase() !== "f") {
        return;
      }

      event.preventDefault();

      if (preview.open) {
        closePreview();
      } else {
        openPreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePreview, openPreview, preview.open, type]);

  useEffect(() => {
    const previewInstance = previewInstanceRef.current;

    return () => {
      if (activePreviewInstance === previewInstance) {
        activePreviewInstance = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!preview.open && activePreviewInstance === previewInstanceRef.current) {
      activePreviewInstance = null;
    }
  }, [preview.open]);

  return {
    triggerRef,
    overlayRef: preview.overlayRef,
    open: preview.open,
    expanded: preview.expanded,
    animatedRect: preview.animatedRect,
    zoom: preview.zoom,
    pan: preview.pan,
    isDragging: preview.isDragging,
    openPreview,
    closePreview,
    handleZoomControlClick: preview.handleZoomControlClick,
    handleWheelZoom: preview.handleWheelZoom,
    handleMediaPointerDown: preview.handleMediaPointerDown,
    handleMediaPointerMove: preview.handleMediaPointerMove,
    handleMediaPointerUp: preview.handleMediaPointerUp,
    handleMediaPointerCancel: preview.handleMediaPointerCancel,
    handleMediaClick: preview.handleMediaClick,
  };
}
