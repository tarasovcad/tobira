import {normalizeInputUrl, assertAllowedWebUrl, UnsafeFetchUrlError} from "@/lib/fetch/web/url";
import {assertWebsiteUrl, NonWebsiteUrlError} from "@/lib/fetch/web/website-url";

export const BULK_WEBSITE_MAX_URLS = 10;

export type NormalizedBulkUrl = {
  raw: string;
  normalized: string;
  displayHost: string;
};

export type RejectedBulkUrl = {
  raw: string;
  reason: string;
};

export type NormalizeBulkUrlsResult = {
  accepted: NormalizedBulkUrl[];
  rejected: RejectedBulkUrl[];
  duplicates: string[];
};

function getUrlValidationReason(raw: string, error: unknown): string {
  if (error instanceof UnsafeFetchUrlError) {
    switch (error.message) {
      case "Hostname is not allowed":
        return "URL must use a public hostname (localhost and private IPs are not allowed)";
      case "Only default http/https ports are supported":
        return "URL must use the default HTTP or HTTPS port";
      case "URL credentials are not allowed":
        return "URL cannot contain a username or password";
      default:
        return error.message;
    }
  }

  if (error instanceof NonWebsiteUrlError) {
    return "URL must point to a webpage, not a file download";
  }

  if (error instanceof Error) {
    switch (error.message) {
      case "Only http/https URLs are supported":
        return "Only http:// and https:// URLs are supported";
      case "Invalid URL hostname":
        return "URL has an invalid hostname";
      case "Missing url":
        return "URL is required";
      default:
        return "Please enter a valid URL";
    }
  }

  try {
    new URL(raw);
    return "URL is not allowed";
  } catch {
    return "Please enter a valid URL";
  }
}

export function normalizeBulkWebsiteUrls(rawUrls: string[]): NormalizeBulkUrlsResult {
  const accepted: NormalizedBulkUrl[] = [];
  const rejected: RejectedBulkUrl[] = [];
  const duplicates: string[] = [];

  const seen = new Set<string>();

  for (const raw of rawUrls) {
    const trimmed = raw.trim();

    if (!trimmed) {
      rejected.push({raw, reason: "URL is required"});
      continue;
    }

    let normalized: URL;

    try {
      normalized = normalizeInputUrl(trimmed);
      assertAllowedWebUrl(normalized);
    } catch (error) {
      rejected.push({raw, reason: getUrlValidationReason(trimmed, error)});
      continue;
    }

    try {
      assertWebsiteUrl(normalized);
    } catch (error) {
      rejected.push({raw, reason: getUrlValidationReason(trimmed, error)});
      continue;
    }

    const normalizedStr = normalized.toString();

    if (seen.has(normalizedStr)) {
      duplicates.push(raw);
      continue;
    }

    seen.add(normalizedStr);
    accepted.push({
      raw,
      normalized: normalizedStr,
      displayHost: normalized.hostname.replace(/^www\./, ""),
    });
  }

  return {accepted, rejected, duplicates};
}
