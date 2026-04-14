"use client";

import {useEffect} from "react";
import type {RefObject} from "react";

interface UseHomeInfiniteScrollProps {
  scrollAreaRootRef: RefObject<HTMLDivElement | null>;
  bottomSentinelRef: RefObject<HTMLDivElement | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function useHomeInfiniteScroll({
  scrollAreaRootRef,
  bottomSentinelRef,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UseHomeInfiniteScrollProps) {
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    const root = scrollAreaRootRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as Element | null;

    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {root, rootMargin: "200px 0px"},
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [bottomSentinelRef, fetchNextPage, hasNextPage, isFetchingNextPage, scrollAreaRootRef]);
}
