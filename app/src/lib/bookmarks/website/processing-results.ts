export type WebsiteAssetLabel = "favicon" | "og" | "preview";
export type WebsiteAssetProcessingStatus = "ready" | "missing" | "failed";

export type WebsiteAssetProcessingResult = {
  label: WebsiteAssetLabel;
  status: WebsiteAssetProcessingStatus;
  key?: string;
  width?: number;
  height?: number;
  reason?: unknown;
};

export function collectWebsiteAssetFailures(results: WebsiteAssetProcessingResult[]) {
  return results.flatMap((result) =>
    result.status === "failed" ? [{label: result.label, reason: result.reason}] : [],
  );
}
