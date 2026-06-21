export type WebsiteAssetLabel = "favicon" | "og" | "preview";

export function collectWebsiteAssetFailures(results: PromiseSettledResult<void>[]) {
  const [favicon, og, preview] = results;
  const labelledResults: Array<{
    label: WebsiteAssetLabel;
    result: PromiseSettledResult<void> | undefined;
  }> = [
    {label: "favicon", result: favicon},
    {label: "og", result: og},
    {label: "preview", result: preview},
  ];

  return labelledResults.flatMap(({label, result}) =>
    result?.status === "rejected" ? [{label, reason: result.reason}] : [],
  );
}
