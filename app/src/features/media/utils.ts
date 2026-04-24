import type {WebsiteImages} from "@/db/schema";
import {hashUrlToKey} from "@/lib/utils/hash";

export async function buildWebsiteImageKeys(url: string) {
  const [faviconHash, ogHash, previewHash] = await Promise.all([
    hashUrlToKey(`favicon:${url}`),
    hashUrlToKey(`og:${url}`),
    hashUrlToKey(`screenshot:${url}`),
  ]);

  return {
    favicon: `media/${faviconHash}`,
    og: `media/${ogHash}`,
    preview: `media/${previewHash}`,
  };
}

export async function buildWebsiteImages(url: string): Promise<WebsiteImages> {
  const keys = await buildWebsiteImageKeys(url);

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
