import type {WebsiteImages} from "@/db/schema";

export function buildWebsiteImageKeys(bookmarkId: string) {
  return {
    favicon: `websites/${bookmarkId}/favicon.png`,
    og: `websites/${bookmarkId}/og.png`,
    preview: `websites/${bookmarkId}/preview.png`,
  };
}

export function buildWebsiteImages(bookmarkId: string): WebsiteImages {
  const keys = buildWebsiteImageKeys(bookmarkId);

  return {
    favicon: {
      key: keys.favicon,
    },
    og: {
      key: keys.og,
      width: 1200,
      height: 630,
    },
    preview: {
      key: keys.preview,
      width: 1280,
      height: 800,
    },
    selected: "preview",
  };
}
