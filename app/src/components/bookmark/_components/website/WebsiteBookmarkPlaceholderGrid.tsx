import type {Bookmark, WebsiteBookmark} from "@/components/bookmark/types";
import {useViewOptionsStore} from "@/store/use-view-options";
import {usePlaceholderDone} from "@/components/bookmark/_hooks/use-placeholder-transition";

import CrossFade from "../shared/NewBookmarkCrossFade";
import WebsiteBookmarkGrid from "./WebsiteBookmarkGrid";
import {WebsiteSkeletonGrid} from "../shared/BookmarkSkeletons";

type WebsiteBookmarkPlaceholderGridProps = {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
  tags?: string[];
};

function isWebsiteBookmark(bookmark: Bookmark | null): bookmark is WebsiteBookmark {
  return bookmark?.kind === "website";
}

export default function WebsiteBookmarkPlaceholderGrid({
  bookmark,
  onDone,
}: WebsiteBookmarkPlaceholderGridProps) {
  const websiteBookmark = isWebsiteBookmark(bookmark) ? bookmark : null;
  const loaded = websiteBookmark != null;
  const {borderRadius, gridGap} = useViewOptionsStore();
  const zeroGap = gridGap === "none";

  const radiusClass =
    borderRadius === "none" || zeroGap
      ? "rounded-none"
      : borderRadius === "sm"
        ? "rounded-sm"
        : borderRadius === "md"
          ? "rounded-md"
          : "rounded-lg";

  usePlaceholderDone(loaded, onDone);

  return (
    <CrossFade loaded={loaded} skeleton={<WebsiteSkeletonGrid borderRadiusClass={radiusClass} />}>
      {websiteBookmark ? <WebsiteBookmarkGrid item={websiteBookmark} /> : null}
    </CrossFade>
  );
}
