"use client";

import {useEffect, useState} from "react";

export const BOOKMARK_MENU_MEDIA_PREVIEW_CLICK_DELAY_MS = 200;

/**
 * After the bookmark menu sheet opens, returns false for a short period so
 * MediaPreview ignores accidental double-clicks that would open fullscreen.
 */
export function useBookmarkMenuPreviewClick(isOpen: boolean, resetKey?: string): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const id = window.setTimeout(() => {
      setReady(true);
    }, BOOKMARK_MENU_MEDIA_PREVIEW_CLICK_DELAY_MS);

    return () => {
      window.clearTimeout(id);
      setReady(false);
    };
  }, [isOpen, resetKey]);

  return isOpen && ready;
}
