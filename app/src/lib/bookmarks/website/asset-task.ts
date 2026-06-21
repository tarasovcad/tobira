export async function processWebsiteAssetIfMissing({
  key,
  exists,
  process,
}: {
  key: string;
  exists: (key: string) => Promise<boolean>;
  process: () => Promise<void>;
}) {
  if (await exists(key)) return;
  await process();
}
