import {extractOgImageUrlFromHtml} from "./html";

export function fetchResolvedOgImageUrlFromHtml(opts: {
  html: string;
  baseUrl: string;
  metadataOgImageUrl?: string;
}) {
  const og = opts.metadataOgImageUrl ?? extractOgImageUrlFromHtml(opts.html);
  if (!og) return undefined;

  try {
    return new URL(og, opts.baseUrl).toString();
  } catch {
    return undefined;
  }
}
