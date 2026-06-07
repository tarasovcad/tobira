"use client";

import type {Bookmark, PostBookmark} from "@/components/bookmark/types";
import {usePlaceholderDone} from "@/components/bookmark/_hooks/use-placeholder-transition";

import CrossFade from "../shared/NewBookmarkCrossFade";
import PostBookmarkList from "./PostBookmarkList";
import {PostSkeletonList} from "../shared/BookmarkSkeletons";

type PostBookmarkPlaceholderListProps = {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
  tags?: string[];
};

function getPostBookmark(bookmark: Bookmark | null): PostBookmark | null {
  return bookmark?.kind === "post" ? bookmark : null;
}

export default function PostBookmarkPlaceholderList({
  bookmark,
  onDone,
}: PostBookmarkPlaceholderListProps) {
  const postBookmark = getPostBookmark(bookmark);
  const loaded = !!postBookmark;

  usePlaceholderDone(loaded, onDone);

  return (
    <CrossFade loaded={loaded} skeleton={<PostSkeletonList />}>
      {postBookmark ? <PostBookmarkList item={postBookmark} /> : null}
    </CrossFade>
  );
}
