export function extractUrls(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  const urlRegex = /(?:https?:\/\/|www\.)[^\s,<>"'\(\)]+/gi;
  const matches = text.match(urlRegex) || [];

  const linesAndTokens = text
    .split(/[\r\n\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const candidates = new Set<string>();
  for (const m of matches) {
    candidates.add(m);
  }
  for (const token of linesAndTokens) {
    if (token.startsWith("http://") || token.startsWith("https://") || token.startsWith("www.")) {
      candidates.add(token);
    }
  }

  const validUrls: string[] = [];
  const seen = new Set<string>();

  for (let candidate of candidates) {
    candidate = candidate.replace(/[.,;:!\)\>\]]+$/, "");
    if (!candidate) continue;

    try {
      const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)
        ? candidate
        : `https://${candidate}`;
      const parsed = new URL(withScheme);
      if ((parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname) {
        const urlStr = parsed.toString();
        if (!seen.has(urlStr)) {
          seen.add(urlStr);
          validUrls.push(urlStr);
        }
      }
    } catch {
      // Ignore invalid candidates
    }
  }

  return validUrls;
}
