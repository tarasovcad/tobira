import type {MediaImages, WebsiteImages} from "@/db/schema";
import type {Bookmark} from "@/components/bookmark/types";

export function isWebsiteImages(images: Bookmark["images"] | undefined): images is WebsiteImages {
  return (
    !!images &&
    typeof images === "object" &&
    ("favicon" in images || "og" in images || "preview" in images || "selected" in images)
  );
}

export function isMediaImages(images: Bookmark["images"] | undefined): images is MediaImages {
  return !!images && typeof images === "object" && "items" in images && Array.isArray(images.items);
}
