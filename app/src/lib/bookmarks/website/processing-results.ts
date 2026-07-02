import type {WebsiteImageAsset} from "@/db/schema";

export type WebsiteAssetLabel = "favicon" | "og" | "preview";
export type WebsiteAssetProcessingStatus = "ready" | "missing" | "failed";

export type WebsiteAssetProcessingResult = {
  label: WebsiteAssetLabel;
  status: WebsiteAssetProcessingStatus;
  key?: string;
  width?: number;
  height?: number;
  reusedExisting?: boolean;
  reason?: unknown;
};

export function collectWebsiteAssetFailures(results: WebsiteAssetProcessingResult[]) {
  return results.flatMap((result) =>
    result.status === "failed" ? [{label: result.label, reason: result.reason}] : [],
  );
}

export function toWebsiteImageAsset(
  assetResults: WebsiteAssetProcessingResult[],
  label: WebsiteAssetLabel,
  fetchedAt?: string,
): WebsiteImageAsset {
  const result = assetResults.find((assetResult) => assetResult.label === label);
  if (!result) return {status: "failed"};

  if (result.status !== "ready") {
    return {
      status: result.status,
      ...(result.key !== undefined ? {key: result.key} : {}),
      ...(result.width !== undefined ? {width: result.width} : {}),
      ...(result.height !== undefined ? {height: result.height} : {}),
    };
  }

  if (!result.key) return {status: "failed"};

  return {
    status: "ready",
    key: result.key,
    ...(result.width !== undefined ? {width: result.width} : {}),
    ...(result.height !== undefined ? {height: result.height} : {}),
    ...(fetchedAt !== undefined ? {fetchedAt} : {}),
  };
}
