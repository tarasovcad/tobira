"use client";

import {useSearchParams} from "next/navigation";
import {parseAsStringLiteral, useQueryState} from "nuqs";

const postTypeParser = parseAsStringLiteral(["post"] as const);

export function useIsPostDetailOpen() {
  const searchParams = useSearchParams();
  const [type] = useQueryState("type", postTypeParser);
  const detailBookmarkId = searchParams.get("id")?.trim() || null;

  return type === "post" && Boolean(detailBookmarkId);
}
