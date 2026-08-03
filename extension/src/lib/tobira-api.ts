import { buildTobiraUrl, isTobiraAppUrl } from "@/lib/tobira-config";
import {
  parseTobiraPairingResponse,
  parseTobiraRedeemResult,
  parseTobiraRemoteConnection,
  type TobiraPairingResponse,
  type TobiraRedeemResult,
  type TobiraRemoteConnection,
} from "@/lib/tobira-contracts";
import { getTobiraDeviceMetadata } from "@/lib/tobira-connection-storage";

const PAIRINGS_ENDPOINT = "/api/extension/pairings";
const CONNECTION_ENDPOINT = "/api/extension/connection";
const TOBIRA_REQUEST_TIMEOUT_MS = 10_000;

export type TobiraApi = {
  createPairing(): Promise<TobiraPairingResponse>;
  redeemPairing(deviceToken: string): Promise<TobiraRedeemResult>;
  getConnection(apiKey: string): Promise<TobiraRemoteConnection>;
  revokeConnection(apiKey: string): Promise<void>;
};

export class TobiraApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "TobiraApiError";
  }
}

type TobiraRequestOptions = Omit<RequestInit, "headers"> & {
  apiKey?: string;
  headers?: HeadersInit;
};

export const browserTobiraApi: TobiraApi = {
  createPairing: createTobiraPairing,
  redeemPairing: redeemTobiraPairing,
  getConnection: getTobiraConnection,
  revokeConnection: revokeTobiraConnection,
};

export async function requestTobira<T>(
  path: string,
  options: TobiraRequestOptions = {},
): Promise<T> {
  const { apiKey, headers: initialHeaders, ...requestInit } = options;
  const headers = new Headers(initialHeaders);
  const url = buildTobiraUrl(path);

  headers.set("accept", "application/json");
  if (requestInit.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (apiKey) {
    headers.set("x-api-key", apiKey);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...requestInit,
      cache: "no-store",
      headers,
      signal:
        requestInit.signal ?? AbortSignal.timeout(TOBIRA_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === "TimeoutError"
        ? "The Tobira request timed out"
        : `Could not reach Tobira at ${url}`;
    throw new TobiraApiError(message, 0);
  }

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new TobiraApiError(
      getErrorMessage(
        payload,
        `${response.status} ${response.statusText || "Tobira request failed"} (${url})`,
      ),
      response.status,
      parseRetryAfter(response.headers.get("retry-after")),
    );
  }

  return payload as T;
}

async function createTobiraPairing(): Promise<TobiraPairingResponse> {
  const payload = await requestTobira<unknown>(PAIRINGS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ clientMetadata: await getTobiraDeviceMetadata() }),
  });

  const pairing = parseTobiraPairingResponse(payload);
  if (
    !pairing ||
    !isTobiraAppUrl(pairing.verificationUrlComplete)
  ) {
    throw new TobiraApiError(
      "Tobira returned an invalid pairing response",
      502,
    );
  }

  return pairing;
}

async function redeemTobiraPairing(
  deviceToken: string,
): Promise<TobiraRedeemResult> {
  const payload = await requestTobira<unknown>(`${PAIRINGS_ENDPOINT}/redeem`, {
    method: "POST",
    body: JSON.stringify({ deviceToken }),
  });

  const result = parseTobiraRedeemResult(payload);
  if (!result) {
    throw new TobiraApiError(
      "Tobira returned an invalid redemption response",
      502,
    );
  }

  return result;
}

async function getTobiraConnection(
  apiKey: string,
): Promise<TobiraRemoteConnection> {
  const payload = await requestTobira<unknown>(CONNECTION_ENDPOINT, { apiKey });

  const result = parseTobiraRemoteConnection(payload);
  if (!result) {
    throw new TobiraApiError(
      "Tobira returned an invalid connection response",
      502,
    );
  }

  return result;
}

async function revokeTobiraConnection(apiKey: string): Promise<void> {
  const result = await requestTobira<unknown>(CONNECTION_ENDPOINT, {
    method: "DELETE",
    apiKey,
  });

  if (!isRevocationResult(result)) {
    throw new TobiraApiError(
      "Tobira returned an invalid revocation response",
      502,
    );
  }
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null) {
    if ("error" in payload) {
      const error = payload.error;
      if (typeof error === "string" && error.trim()) return error;

      if (typeof error === "object" && error !== null && "message" in error) {
        const message = error.message;
        if (typeof message === "string" && message.trim()) return message;
      }
    }

    if (
      "message" in payload &&
      typeof payload.message === "string" &&
      payload.message.trim()
    ) {
      return payload.message;
    }
  }

  return fallback;
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number.parseInt(value, 10);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);

  const retryAt = Date.parse(value);
  if (Number.isNaN(retryAt)) return null;

  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1_000));
}

function isRevocationResult(value: unknown): value is { revoked: true } {
  return (
    typeof value === "object" &&
    value !== null &&
    "revoked" in value &&
    value.revoked === true
  );
}
