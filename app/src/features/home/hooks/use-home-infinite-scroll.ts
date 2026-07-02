"use client";

import {useEffect} from "react";

interface UseHomeInfiniteScrollProps {
  scrollAreaRoot: HTMLDivElement | null;
  bottomSentinel: HTMLDivElement | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function useHomeInfiniteScroll({
  scrollAreaRoot,
  bottomSentinel,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UseHomeInfiniteScrollProps) {
  useEffect(() => {
    const root = scrollAreaRoot?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as Element | null;

    if (!bottomSentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {root, rootMargin: "200px 0px"},
    );

    observer.observe(bottomSentinel);
    return () => observer.disconnect();
  }, [bottomSentinel, fetchNextPage, hasNextPage, isFetchingNextPage, scrollAreaRoot]);
}
