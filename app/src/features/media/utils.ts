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
      status: "pending",
      key: keys.favicon,
    },
    og: {
      status: "pending",
      key: keys.og,
      width: 1200,
      height: 630,
    },
    preview: {
      status: "pending",
      key: keys.preview,
      width: 1920,
      height: 1080,
    },
    selected: "preview",
  };
}

export async function buildMediaAssetKey(sourceUrl: string): Promise<string> {
  return `media/${await hashUrlToKey(sourceUrl)}`;
}

export async function buildVideoAssetKey(sourceUrl: string): Promise<string> {
  return `videos/${await hashUrlToKey(sourceUrl)}`;
}
