import {lookup} from "node:dns/promises";
import {Readable} from "node:stream";
import ipaddr from "ipaddr.js";
import nodeFetch, {
  type RequestInit as NodeFetchRequestInit,
  type Response as NodeFetchResponse,
} from "node-fetch";
import {useAgent as getRequestFilteringAgent} from "request-filtering-agent";
import {assertAllowedWebUrl, isRestrictedIpAddress, UnsafeFetchUrlError} from "./url";

const DEFAULT_MAX_REDIRECTS = 3;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

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

export async function safeWebFetch(
  input: URL | string,
  init: SafeWebFetchInit = {},
): Promise<Response> {
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

    const response = await nodeFetch(url.toString(), {
      method,
      ...(body !== undefined && body !== null ? {body: body as NodeFetchRequestInit["body"]} : {}),
      agent: (parsedUrl) => getRequestFilteringAgent(parsedUrl.href),
      compress: true,
      headers: Object.fromEntries(headers.entries()),
      redirect: "manual",
      signal: init.signal as NodeFetchRequestInit["signal"],
    });

    if (!REDIRECT_STATUSES.has(response.status)) {
      return toWebResponse(response, url.toString());
    }

    const location = response.headers.get("location");
    if (!location) return toWebResponse(response, url.toString());

    destroyNodeFetchBody(response);

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

function toWebResponse(response: NodeFetchResponse, fallbackUrl: string): Response {
  const headers = new Headers();
  response.headers.forEach((value, key) => headers.append(key, value));
  if (NULL_BODY_STATUSES.has(response.status)) {
    destroyNodeFetchBody(response);
  }
  const body =
    response.body && !NULL_BODY_STATUSES.has(response.status)
      ? (Readable.toWeb(
          response.body as unknown as Readable,
        ) as unknown as ReadableStream<Uint8Array>)
      : null;
  const webResponse = new Response(body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });

  Object.defineProperty(webResponse, "url", {
    value: response.url || fallbackUrl,
  });

  return webResponse;
}

function destroyNodeFetchBody(response: NodeFetchResponse) {
  const body = response.body as unknown;
  if (body && typeof body === "object" && "destroy" in body && typeof body.destroy === "function") {
    body.destroy();
  }
}
