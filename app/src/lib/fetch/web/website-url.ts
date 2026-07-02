const NON_WEBSITE_EXTENSIONS = new Set([
  ".7z",
  ".avi",
  ".csv",
  ".doc",
  ".docx",
  ".epub",
  ".flac",
  ".gz",
  ".m4a",
  ".mkv",
  ".mov",
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpg",
  ".ods",
  ".odt",
  ".pdf",
  ".ppt",
  ".pptx",
  ".rar",
  ".rtf",
  ".tar",
  ".tgz",
  ".tsv",
  ".wav",
  ".webm",
  ".xls",
  ".xlsx",
  ".zip",
]);

export class NonWebsiteUrlError extends Error {
  constructor() {
    super("This URL doesn't point to a webpage");
    this.name = "NonWebsiteUrlError";
  }
}

export function isWebsiteUrl(url: URL | string) {
  const parsed = typeof url === "string" ? new URL(url) : url;
  const pathname = parsed.pathname.toLowerCase();

  for (const extension of NON_WEBSITE_EXTENSIONS) {
    if (pathname.endsWith(extension)) return false;
  }

  return true;
}

export function assertWebsiteUrl(url: URL | string) {
  if (!isWebsiteUrl(url)) throw new NonWebsiteUrlError();
}
