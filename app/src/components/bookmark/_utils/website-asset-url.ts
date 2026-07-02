type WebsiteAssetUrlOptions = {
  size?: string;
  format?: string;
  fetchedAt?: string;
  attempt?: number;
};

export function buildWebsiteAssetUrl(baseSrc: string, options: WebsiteAssetUrlOptions = {}) {
  if (!baseSrc) return "";

  const {size, format, fetchedAt, attempt = 0} = options;
  const url = new URL(baseSrc);

  if (size) {
    url.searchParams.set("size", size);
  }

  if (format) {
    url.searchParams.set("format", format);
  }

  url.searchParams.set("v", `${fetchedAt ?? "legacy"}-${attempt}`);

  return url.toString();
}
