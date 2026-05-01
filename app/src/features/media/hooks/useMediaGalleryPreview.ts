"use client";

import {
  usePreviewOverlayController,
  type OpenPreviewOverlayArgs,
  type UsePreviewOverlayControllerResult,
} from "./usePreviewOverlayController";

type UseMediaGalleryPreviewParams = {
  onOpenChange?: (open: boolean) => void;
  onEscape?: () => void;
  type?: "image" | "video";
  addZoom?: boolean;
};

export type UseMediaGalleryPreviewResult = UsePreviewOverlayControllerResult;
export type OpenMediaGalleryPreviewArgs = OpenPreviewOverlayArgs;

export function useMediaGalleryPreview({
  onOpenChange,
  onEscape,
  type = "image",
  addZoom = true,
}: UseMediaGalleryPreviewParams): UseMediaGalleryPreviewResult {
  return usePreviewOverlayController({
    onOpenChange,
    onEscape,
    type,
    addZoom,
  });
}
