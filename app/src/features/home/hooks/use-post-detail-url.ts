"use client";

import {useCallback} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";

export function usePostDetailUrl() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const detailBookmarkId = searchParams.get("id")?.trim() || null;

  const openPostDetail = useCallback(
    (bookmarkId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("type", "post");
      params.set("id", bookmarkId);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const closePostDetail = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", "post");
    params.delete("id");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  return {
    detailBookmarkId,
    openPostDetail,
    closePostDetail,
  };
}
