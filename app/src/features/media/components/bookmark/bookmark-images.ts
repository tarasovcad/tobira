import type {WebsiteImages} from "@/db/schema";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {buildWebsiteImageKeys} from "@/features/media/utils";
import type {Bookmark} from "@/components/bookmark/types";

export function isWebsiteImages(images: Bookmark["images"] | undefined): images is WebsiteImages {
  return (
    !!images &&
    typeof images === "object" &&
    ("favicon" in images || "og" in images || "preview" in images || "selected" in images)
  );
}

export function getBookmarkImageSrc(
  item: Bookmark,
  bookmarkId: string,
  type: "preview" | "favicon" | "og",
) {
  const websiteKeys = buildWebsiteImageKeys(bookmarkId);
  const websiteImages = isWebsiteImages(item.images) ? item.images : undefined;

  switch (type) {
    case "preview":
      return buildR2PublicUrl(websiteImages?.preview?.key ?? websiteKeys.preview);
    case "favicon":
      return buildR2PublicUrl(websiteImages?.favicon?.key ?? websiteKeys.favicon);
    case "og":
      return buildR2PublicUrl(websiteImages?.og?.key ?? websiteKeys.og);
  }
}
