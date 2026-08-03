import { buildTobiraUrl } from "@/lib/tobira-config";
import {
  getTobiraDeviceMetadata,
  type TobiraConnectionUser,
} from "@/lib/tobira-connection-storage";

const PAIRINGS_ENDPOINT = "/api/extension/pairings";
const CONNECTION_ENDPOINT = "/api/extension/connection";

export type TobiraPairing = {
  deviceToken: string;
  userCode: string;
  verificationUrl: string;
  verificationUrlComplete: string;
  expiresAt: string;
  pollIntervalMs: number;
};

export type TobiraConnection = {
  user: TobiraConnectionUser;
  apiKeyId: string;
  expiresAt: string | null;
};

export type TobiraRedeemResult =
  | { status: "pending" }
  | {
      status: "redeemed";
      apiKey: string;
      apiKeyId: string;
      expiresAt: string | null;
      user: TobiraConnectionUser;
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
    });
  } catch {
    throw new TobiraApiError(`Could not reach Tobira at ${url}`, 0);
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

export async function createTobiraPairing(): Promise<TobiraPairing> {
  const pairing = await requestTobira<unknown>(PAIRINGS_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({clientMetadata: await getTobiraDeviceMetadata()}),
  });

  if (!isTobiraPairing(pairing)) {
    throw new TobiraApiError(
      "Tobira returned an invalid pairing response",
      502,
    );
  }

  return pairing;
}

export async function redeemTobiraPairing(
  deviceToken: string,
): Promise<TobiraRedeemResult> {
  const result = await requestTobira<unknown>(`${PAIRINGS_ENDPOINT}/redeem`, {
    method: "POST",
    body: JSON.stringify({ deviceToken }),
  });

  if (!isTobiraRedeemResult(result)) {
    throw new TobiraApiError(
      "Tobira returned an invalid redemption response",
      502,
    );
  }

  return result;
}

export async function getTobiraConnection(
  apiKey: string,
): Promise<TobiraConnection> {
  const result = await requestTobira<unknown>(CONNECTION_ENDPOINT, { apiKey });

  if (!isTobiraConnection(result)) {
    throw new TobiraApiError(
      "Tobira returned an invalid connection response",
      502,
    );
  }

  return result;
}

export async function revokeTobiraConnection(
  apiKey: string,
): Promise<{ revoked: true }> {
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

  return result;
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

    if ("message" in payload && typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  }

  return fallback || "Tobira request failed";
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) ? seconds : null;
}

function isTobiraPairing(value: unknown): value is TobiraPairing {
  if (typeof value !== "object" || value === null) return false;

  const pairing = value as Partial<TobiraPairing>;

  return (
    typeof pairing.deviceToken === "string" &&
    /^[A-Za-z0-9_-]{43}$/.test(pairing.deviceToken) &&
    typeof pairing.userCode === "string" &&
    /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(pairing.userCode) &&
    typeof pairing.verificationUrl === "string" &&
    typeof pairing.verificationUrlComplete === "string" &&
    typeof pairing.expiresAt === "string" &&
    !Number.isNaN(Date.parse(pairing.expiresAt)) &&
    typeof pairing.pollIntervalMs === "number" &&
    pairing.pollIntervalMs > 0
  );
}

function isTobiraRedeemResult(value: unknown): value is TobiraRedeemResult {
  if (typeof value !== "object" || value === null) return false;

  const result = value as {
    apiKey?: unknown;
    apiKeyId?: unknown;
    expiresAt?: unknown;
    status?: unknown;
    user?: unknown;
  };

  if (result.status === "pending") return true;

  return (
    result.status === "redeemed" &&
    typeof result.apiKey === "string" &&
    result.apiKey.length > 0 &&
    typeof result.apiKeyId === "string" &&
    result.apiKeyId.length > 0 &&
    (result.expiresAt === null || typeof result.expiresAt === "string") &&
    isTobiraConnectionUser(result.user)
  );
}

function isTobiraConnection(value: unknown): value is TobiraConnection {
  if (typeof value !== "object" || value === null) return false;

  const connection = value as {
    apiKeyId?: unknown;
    expiresAt?: unknown;
    user?: unknown;
  };

  return (
    typeof connection.apiKeyId === "string" &&
    connection.apiKeyId.length > 0 &&
    (connection.expiresAt === null ||
      typeof connection.expiresAt === "string") &&
    isTobiraConnectionUser(connection.user)
  );
}

function isRevocationResult(value: unknown): value is { revoked: true } {
  return (
    typeof value === "object" &&
    value !== null &&
    "revoked" in value &&
    value.revoked === true
  );
}

function isTobiraConnectionUser(value: unknown): value is TobiraConnectionUser {
  if (typeof value !== "object" || value === null) return false;

  const user = value as {
    email?: unknown;
    id?: unknown;
    image?: unknown;
    name?: unknown;
  };

  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    (user.image === null || typeof user.image === "string")
  );
}
