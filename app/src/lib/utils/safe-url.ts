export function toSafeHttpUrl(href: string | null | undefined): string | null {
  if (href == null) {
    return null;
  }

  const trimmed = href.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return null;
}
