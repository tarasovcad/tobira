import ipaddr from "ipaddr.js";

export class UnsafeFetchUrlError extends Error {
  constructor(message = "URL is not allowed") {
    super(message);
    this.name = "UnsafeFetchUrlError";
  }
}

function normalizeHostname(hostname: string) {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^\[(.*)]$/, "$1")
    .replace(/\.+$/, "");
}

const TRACKING_QUERY_PARAMS = new Set([
  "dclid",
  "fbclid",
  "gbraid",
  "gclid",
  "igshid",
  "msclkid",
  "ttclid",
  "twclid",
  "wbraid",
]);

function isTrackingQueryParam(name: string) {
  return name.startsWith("utm_") || TRACKING_QUERY_PARAMS.has(name);
}

function compareStrings(a: string, b: string) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function canonicalizeSearchParams(params: URLSearchParams) {
  const entries = [...params]
    .map(([name, value]): [string, string] => [name.toLowerCase(), value])
    .filter(([name]) => !isTrackingQueryParam(name))
    .sort(([nameA, valueA], [nameB, valueB]) => {
      const nameOrder = compareStrings(nameA, nameB);
      return nameOrder === 0 ? compareStrings(valueA, valueB) : nameOrder;
    });

  return new URLSearchParams(entries);
}

export function isRestrictedIpAddress(address: string) {
  const normalized = normalizeHostname(address);
  if (!ipaddr.isValid(normalized)) return false;

  const parsed = ipaddr.parse(normalized);
  if (parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress()) {
    return isRestrictedIpAddress(parsed.toIPv4Address().toString());
  }

  return parsed.range() !== "unicast";
}

export function looksLikePrivateHostname(hostname: string) {
  const h = normalizeHostname(hostname);
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".local")) return true;
  if (ipaddr.isValid(h)) return isRestrictedIpAddress(h);

  // Single-label names usually resolve inside a private DNS/search domain.
  if (!h.includes(".")) return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!ipv4) return false;
  const parts = ipv4.slice(1).map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export function assertAllowedWebUrl(url: URL | string) {
  const parsed = typeof url === "string" ? new URL(url) : url;

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UnsafeFetchUrlError("Only http/https URLs are supported");
  }
  if (!parsed.hostname) throw new UnsafeFetchUrlError("Invalid URL hostname");
  const usesDefaultPort =
    !parsed.port ||
    (parsed.protocol === "http:" && parsed.port === "80") ||
    (parsed.protocol === "https:" && parsed.port === "443");
  if (!usesDefaultPort) {
    throw new UnsafeFetchUrlError("Only default http/https ports are supported");
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeFetchUrlError("URL credentials are not allowed");
  }
  if (looksLikePrivateHostname(parsed.hostname)) {
    throw new UnsafeFetchUrlError("Hostname is not allowed");
  }
}

export function normalizeInputUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Missing url");
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  const u = new URL(withScheme);
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported");
  }
  if (!u.hostname) throw new Error("Invalid URL hostname");
  assertAllowedWebUrl(u);
  u.hash = "";
  u.pathname = u.pathname.replace(/\/+$/, "") || "/";
  u.search = canonicalizeSearchParams(u.searchParams).toString();
  return u;
}
