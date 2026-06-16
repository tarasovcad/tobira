import type {Bookmark, WebsiteBookmark} from "@/components/bookmark/types";
import {usePlaceholderDone} from "@/components/bookmark/_hooks/use-placeholder-transition";

import CrossFade from "../shared/NewBookmarkCrossFade";
import WebsiteBookmarkList from "./WebsiteBookmarkList";
import {WebsiteSkeletonList} from "../shared/BookmarkSkeletons";

type WebsiteBookmarkPlaceholderListProps = {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
  tags?: string[];
};

function isWebsiteBookmark(bookmark: Bookmark | null): bookmark is WebsiteBookmark {
  return bookmark?.kind === "website";
}

export default function WebsiteBookmarkPlaceholderList({
  bookmark,
  onDone,
}: WebsiteBookmarkPlaceholderListProps) {
  const websiteBookmark = isWebsiteBookmark(bookmark) ? bookmark : null;
  const loaded = websiteBookmark != null;

  usePlaceholderDone(loaded, onDone);

  return (
    <CrossFade loaded={loaded} skeleton={<WebsiteSkeletonList />}>
      {websiteBookmark ? <WebsiteBookmarkList item={websiteBookmark} /> : null}
    </CrossFade>
  );
}
