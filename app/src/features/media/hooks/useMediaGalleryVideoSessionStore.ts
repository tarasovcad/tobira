"use client";

import {useSyncExternalStore} from "react";
import type {VideoPlayerSession} from "@/features/video-player/types";

export type MediaGalleryVideoSessionStore = {
  subscribe: (listener: () => void) => () => void;
  getSession: (key: string | null) => VideoPlayerSession | null;
  setSession: (key: string, session: VideoPlayerSession | null) => void;
};

const subscribeNoop = () => () => {};

export function createMediaGalleryVideoSessionStore(): MediaGalleryVideoSessionStore {
  const sessions = new Map<string, VideoPlayerSession>();
  const listeners = new Set<() => void>();

  const emitChange = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSession(key) {
      if (!key) {
        return null;
      }

      return sessions.get(key) ?? null;
    },
    setSession(key, session) {
      const previousSession = sessions.get(key) ?? null;

      if (session === null) {
        if (!sessions.has(key)) {
          return;
        }

        sessions.delete(key);
        emitChange();
        return;
      }

      sessions.set(key, session);

      if (previousSession !== session) {
        emitChange();
      }
    },
  };
}

export function useMediaGalleryVideoSession(
  store: MediaGalleryVideoSessionStore | undefined,
  key: string | null,
) {
  return useSyncExternalStore(
    store?.subscribe ?? subscribeNoop,
    () => store?.getSession(key) ?? null,
    () => null,
  );
}
