"use client";

import {useCallback} from "react";
import {parseAsString, parseAsStringLiteral, useQueryStates} from "nuqs";

const postDetailParsers = {
  type: parseAsStringLiteral(["post"]),
  id: parseAsString,
};

export function usePostDetailUrl() {
  const [{type, id}, setPostDetailParams] = useQueryStates(postDetailParsers, {
    shallow: true,
  });

  const detailBookmarkId = id?.trim() || null;
  const isPostDetailOpen = type === "post" && Boolean(detailBookmarkId);

  const openPostDetail = useCallback(
    (bookmarkId: string) => {
      void setPostDetailParams({type: "post", id: bookmarkId}, {history: "push"});
    },
    [setPostDetailParams],
  );

  const closePostDetail = useCallback(() => {
    void setPostDetailParams({type: "post", id: null}, {history: "replace"});
  }, [setPostDetailParams]);

  return {
    detailBookmarkId,
    isPostDetailOpen,
    openPostDetail,
    closePostDetail,
  };
}
