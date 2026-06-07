"use client";

import {useSearchParams} from "next/navigation";

export function useIsPostDetailOpen() {
  const searchParams = useSearchParams();
  const detailBookmarkId = searchParams.get("id")?.trim() || null;

  return searchParams.get("type") === "post" && Boolean(detailBookmarkId);
}
