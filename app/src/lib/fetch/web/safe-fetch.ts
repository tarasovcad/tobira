import {lookup} from "node:dns/promises";
import ipaddr from "ipaddr.js";
import {assertAllowedWebUrl, isRestrictedIpAddress, UnsafeFetchUrlError} from "./url";

const DEFAULT_MAX_REDIRECTS = 3;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

type SafeWebFetchInit = RequestInit & {
  maxRedirects?: number;
};

export async function assertPublicFetchUrl(url: URL | string) {
  const parsed = typeof url === "string" ? new URL(url) : url;
  assertAllowedWebUrl(parsed);

  const hostname = parsed.hostname.replace(/^\[(.*)]$/, "$1").replace(/\.+$/, "");
  if (ipaddr.isValid(hostname)) return;

  const resolved = await lookup(hostname, {all: true, verbatim: true});
  if (resolved.length === 0) {
    throw new UnsafeFetchUrlError("Hostname did not resolve");
  }

  for (const address of resolved) {
    if (isRestrictedIpAddress(address.address)) {
      throw new UnsafeFetchUrlError("Hostname resolves to a restricted address");
    }
  }
}

export async function safeWebFetch(input: URL | string, init: SafeWebFetchInit = {}) {
  const maxRedirects = init.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  let url = typeof input === "string" ? new URL(input) : new URL(input.toString());
  let redirectCount = 0;
  let method = init.method ?? "GET";
  let body = init.body;

  while (true) {
    await assertPublicFetchUrl(url);

    const headers = new Headers(init.headers);
    headers.delete("authorization");
    headers.delete("cookie");
    headers.delete("host");
    headers.delete("proxy-authorization");

    const response = await fetch(url, {
      ...init,
      body,
      credentials: "omit",
      headers,
      method,
      redirect: "manual",
    });

    if (!REDIRECT_STATUSES.has(response.status)) return response;

    await response.body?.cancel().catch(() => {});
    const location = response.headers.get("location");
    if (!location) return response;

    redirectCount += 1;
    if (redirectCount > maxRedirects) {
      throw new UnsafeFetchUrlError("Too many redirects");
    }

    url = new URL(location, url);
    if (
      response.status === 303 ||
      ((response.status === 301 || response.status === 302) && method !== "GET")
    ) {
      method = "GET";
      body = undefined;
    }
  }
}
