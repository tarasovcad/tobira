import type {Bookmark, WebsiteBookmark} from "@/components/bookmark/types";
import {usePlaceholderDone} from "@/components/bookmark/_hooks/use-placeholder-transition";

import CrossFade from "../shared/NewBookmarkCrossFade";
import WebsiteBookmarkCompact from "./WebsiteBookmarkCompact";
import {WebsiteSkeletonCompact} from "../shared/BookmarkSkeletons";

type WebsiteBookmarkPlaceholderCompactProps = {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
};

function isWebsiteBookmark(bookmark: Bookmark | null): bookmark is WebsiteBookmark {
  return bookmark?.kind === "website";
}

export default function WebsiteBookmarkPlaceholderCompact({
  bookmark,
  onDone,
}: WebsiteBookmarkPlaceholderCompactProps) {
  const websiteBookmark = isWebsiteBookmark(bookmark) ? bookmark : null;
  const loaded = websiteBookmark != null;

  usePlaceholderDone(loaded, onDone);

  return (
    <CrossFade loaded={loaded} skeleton={<WebsiteSkeletonCompact />}>
      {websiteBookmark ? <WebsiteBookmarkCompact item={websiteBookmark} /> : null}
    </CrossFade>
  );
}
