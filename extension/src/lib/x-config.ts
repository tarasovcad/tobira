const STORAGE_KEY = "tobira_x_config";

export type XConfig = {
  bearerToken: string | null;
  queryIds: Record<string, string>;
};

// Fallbacks extracted from X's bundle — same for all users, may go stale on X deploys
const FALLBACK: XConfig = {
  bearerToken:
    "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
  queryIds: {
    UserByRestId: "VQfQ9wwYdk6j_u2O4vt64Q",
    Bookmarks: "YCrjINs3IPbkSl5FQf_tpA",
  },
};

export async function saveXConfig(config: Partial<XConfig>) {
  const current = await getXConfig();
  await browser.storage.local.set({
    [STORAGE_KEY]: {
      bearerToken: config.bearerToken ?? current.bearerToken,
      queryIds: { ...current.queryIds, ...config.queryIds },
    },
  });
}

export async function getXConfig(): Promise<XConfig> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as XConfig | undefined;
  return {
    bearerToken: stored?.bearerToken ?? FALLBACK.bearerToken,
    queryIds: { ...FALLBACK.queryIds, ...stored?.queryIds },
  };
}

export async function getQueryId(operation: string): Promise<string> {
  const config = await getXConfig();
  return config.queryIds[operation] ?? FALLBACK.queryIds[operation] ?? "";
}

export async function getBearerToken(): Promise<string> {
  const config = await getXConfig();
  return config.bearerToken ?? FALLBACK.bearerToken ?? "";
}
