"use client";

import {parseAsString, parseAsStringLiteral, useQueryStates} from "nuqs";

const postDetailParsers = {
  type: parseAsStringLiteral(["post"] as const),
  id: parseAsString,
};

export function useIsPostDetailOpen() {
  const [{type, id}] = useQueryStates(postDetailParsers);
  const detailBookmarkId = id?.trim() || null;

  return type === "post" && Boolean(detailBookmarkId);
}
