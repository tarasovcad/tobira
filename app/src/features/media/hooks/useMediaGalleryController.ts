"use client";

import {useSyncExternalStore} from "react";
import type {Rect} from "@/features/media/components/preview/types";
import type {UseMediaGalleryPreviewResult} from "@/features/media/hooks/useMediaGalleryPreview";
import type {VideoPlayerSession} from "@/features/video-player/types";

type MediaGalleryVideoMode = "inline" | "overlay" | "released";

type MediaGalleryPreviewBridge = Pick<
  UseMediaGalleryPreviewResult,
  "closePreview" | "openPreviewFromRect" | "resetInteractionState" | "setPreviewSize"
>;

export type MediaGalleryControllerSnapshot = {
  open: boolean;
  currentIndex: number | null;
  currentRenderId: string | null;
  originRenderId: string | null;
};

export type MediaGalleryController = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => MediaGalleryControllerSnapshot;
  getServerSnapshot: () => MediaGalleryControllerSnapshot;
  getVideoMode: (renderId: string | null) => MediaGalleryVideoMode;
  restoreInlineVideo: (renderId: string) => void;
  registerVideoSession: (
    renderId: string,
    getSession: () => VideoPlayerSession | null,
  ) => () => void;
  getVideoSession: (renderId: string | null) => VideoPlayerSession | null;
  attachPreview: (preview: MediaGalleryPreviewBridge | null) => void;
  openFromTrigger: (args: {
    index: number;
    renderId: string;
    triggerElement: HTMLDivElement;
    width: number;
    height: number;
  }) => void;
  selectItem: (args: {index: number; renderId: string; width: number; height: number}) => void;
  requestClose: () => void;
  handlePreviewClosed: () => void;
};

const EMPTY_GALLERY_SNAPSHOT: MediaGalleryControllerSnapshot = {
  open: false,
  currentIndex: null,
  currentRenderId: null,
  originRenderId: null,
};

export function createMediaGalleryController(): MediaGalleryController {
  const listeners = new Set<() => void>();
  const sessionGetters = new Map<string, () => VideoPlayerSession | null>();
  const videoModes = new Map<string, MediaGalleryVideoMode>();
  let previewBridge: MediaGalleryPreviewBridge | null = null;
  let snapshot = EMPTY_GALLERY_SNAPSHOT;

  const emitChange = () => {
    listeners.forEach((listener) => listener());
  };

  const setVideoMode = (renderId: string, mode: MediaGalleryVideoMode) => {
    const previousMode = videoModes.get(renderId) ?? "inline";
    if (previousMode === mode) {
      return;
    }

    if (mode === "inline") {
      videoModes.delete(renderId);
    } else {
      videoModes.set(renderId, mode);
    }
  };

  const pauseAndReleaseVideo = (renderId: string | null) => {
    if (!renderId) {
      return;
    }

    const session = sessionGetters.get(renderId)?.();
    session?.actions.pausePlayback();
    setVideoMode(renderId, "released");
  };

  const computeRectFromTrigger = (triggerElement: HTMLDivElement): Rect | null => {
    const mediaElement = triggerElement.querySelector("img, video");
    if (!mediaElement) {
      return null;
    }

    const thumbRect = mediaElement.getBoundingClientRect();
    return {
      top: thumbRect.top,
      left: thumbRect.left,
      width: thumbRect.width,
      height: thumbRect.height,
    };
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return snapshot;
    },
    getServerSnapshot() {
      return EMPTY_GALLERY_SNAPSHOT;
    },
    getVideoMode(renderId) {
      if (!renderId) {
        return "inline";
      }

      return videoModes.get(renderId) ?? "inline";
    },
    restoreInlineVideo(renderId) {
      if ((videoModes.get(renderId) ?? "inline") === "released") {
        setVideoMode(renderId, "inline");
        emitChange();
      }
    },
    registerVideoSession(renderId, getSession) {
      sessionGetters.set(renderId, getSession);
      return () => {
        sessionGetters.delete(renderId);
        videoModes.delete(renderId);
        emitChange();
      };
    },
    getVideoSession(renderId) {
      if (!renderId) {
        return null;
      }

      return sessionGetters.get(renderId)?.() ?? null;
    },
    attachPreview(preview) {
      previewBridge = preview;
    },
    openFromTrigger({index, renderId, triggerElement, width, height}) {
      const fromRect = computeRectFromTrigger(triggerElement);
      if (!fromRect || !previewBridge) {
        return;
      }

      if (snapshot.open && snapshot.currentRenderId && snapshot.currentRenderId !== renderId) {
        pauseAndReleaseVideo(snapshot.currentRenderId);
      }

      setVideoMode(renderId, "overlay");
      snapshot = {
        open: true,
        currentIndex: index,
        currentRenderId: renderId,
        originRenderId: renderId,
      };
      emitChange();

      previewBridge.openPreviewFromRect({
        fromRect,
        width,
        height,
        originKey: renderId,
      });
    },
    selectItem({index, renderId, width, height}) {
      if (!previewBridge || snapshot.currentIndex === index) {
        return;
      }

      if (snapshot.currentRenderId && snapshot.currentRenderId !== renderId) {
        pauseAndReleaseVideo(snapshot.currentRenderId);
      }

      setVideoMode(renderId, "overlay");
      snapshot = {
        ...snapshot,
        currentIndex: index,
        currentRenderId: renderId,
      };
      emitChange();

      previewBridge.setPreviewSize(width, height, {
        entryKey: renderId,
      });
      previewBridge.resetInteractionState();
    },
    requestClose() {
      if (!snapshot.open || !previewBridge) {
        return;
      }

      if (snapshot.currentRenderId !== snapshot.originRenderId) {
        pauseAndReleaseVideo(snapshot.currentRenderId);
        emitChange();
      }

      previewBridge.closePreview();
    },
    handlePreviewClosed() {
      if (snapshot.currentRenderId && snapshot.currentRenderId === snapshot.originRenderId) {
        setVideoMode(snapshot.currentRenderId, "inline");
      }

      snapshot = EMPTY_GALLERY_SNAPSHOT;
      emitChange();
    },
  };
}

export function useMediaGalleryControllerSnapshot(controller: MediaGalleryController) {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );
}

export function useMediaGalleryVideoMode(
  controller: MediaGalleryController,
  renderId: string | null,
) {
  return useSyncExternalStore(
    controller.subscribe,
    () => controller.getVideoMode(renderId),
    () => "inline",
  );
}
