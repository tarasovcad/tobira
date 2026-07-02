import {useCallback, useRef} from "react";
import type {Bookmark} from "@/components/bookmark/types";

const FAST_PENDING_REFETCH_MS = 700;
const MEDIUM_PENDING_REFETCH_MS = 1000;
const SLOW_PENDING_REFETCH_MS = 2000;
const FAST_PENDING_WINDOW_MS = 3000;
const MEDIUM_PENDING_WINDOW_MS = 10000;

export function usePendingBookmarksRefetchInterval() {
  const pendingSinceRef = useRef<number | null>(null);
  const pendingSignatureRef = useRef<string | null>(null);

  return useCallback((bookmarks: Bookmark[]) => {
    const pendingSignature = getPendingBookmarkWorkSignature(bookmarks);

    if (!pendingSignature) {
      pendingSinceRef.current = null;
      pendingSignatureRef.current = null;
      return false;
    }

    if (pendingSignatureRef.current !== pendingSignature) {
      pendingSignatureRef.current = pendingSignature;
      pendingSinceRef.current = Date.now();
    }

    const pendingSince = pendingSinceRef.current ?? Date.now();
    const elapsedMs = Date.now() - pendingSince;

    if (elapsedMs < FAST_PENDING_WINDOW_MS) return FAST_PENDING_REFETCH_MS;
    if (elapsedMs < MEDIUM_PENDING_WINDOW_MS) return MEDIUM_PENDING_REFETCH_MS;
    return SLOW_PENDING_REFETCH_MS;
  }, []);
}

function getPendingBookmarkWorkSignature(bookmarks: Bookmark[]) {
  const pendingKeys = bookmarks.flatMap(getPendingBookmarkWorkKeys);
  return pendingKeys.length > 0 ? pendingKeys.sort().join("|") : null;
}

function getPendingBookmarkWorkKeys(bookmark: Bookmark) {
  if (bookmark.kind === "website") {
    return [
      bookmark.metadata?.textMetadataStatus === "pending" ? `${bookmark.id}:text` : null,
      bookmark.images?.favicon?.status === "pending" ? `${bookmark.id}:favicon` : null,
      bookmark.images?.og?.status === "pending" ? `${bookmark.id}:og` : null,
      bookmark.images?.preview?.status === "pending" ? `${bookmark.id}:preview` : null,
    ].filter((key): key is string => key !== null);
  }

  return bookmark.images?.processing === true ? [`${bookmark.id}:processing`] : [];
}
