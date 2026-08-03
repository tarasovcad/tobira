export const TOBIRA_AUTH_STORAGE_VERSION = 1;

export const TOBIRA_EXTENSION_PAIRING_APPROVED =
  "TOBIRA_EXTENSION_PAIRING_APPROVED";

export const TOBIRA_PAIRING_CODE_PATTERN =
  /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
export const TOBIRA_DEVICE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type TobiraConnectionUser = {
  id: string;
  name: string;
  email: string;
};

export type TobiraPendingPairing = {
  deviceToken: string;
  userCode: string;
  verificationUrlComplete: string;
  expiresAt: string;
};

export type TobiraStoredConnection = {
  apiKey: string;
  apiKeyId: string;
  user: TobiraConnectionUser;
  expiresAt: string | null;
  confirmationPending: boolean;
};

export type TobiraStoredAuth =
  | {
      version: typeof TOBIRA_AUTH_STORAGE_VERSION;
      kind: "pairing";
      pairing: TobiraPendingPairing;
    }
  | {
      version: typeof TOBIRA_AUTH_STORAGE_VERSION;
      kind: "connected";
      connection: TobiraStoredConnection;
    };

export type TobiraPublicState =
  | { kind: "disconnected" }
  | {
      kind: "pairing";
      userCode: string;
      expiresAt: string;
    }
  | {
      kind: "connected";
      user: TobiraConnectionUser;
      confirmationPending: boolean;
    };

export type TobiraPairingResponse = TobiraPendingPairing;

export type TobiraRemoteConnection = {
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

export function isTobiraPairingCode(value: unknown): value is string {
  return typeof value === "string" && TOBIRA_PAIRING_CODE_PATTERN.test(value);
}

export function isTobiraDeviceToken(value: unknown): value is string {
  return typeof value === "string" && TOBIRA_DEVICE_TOKEN_PATTERN.test(value);
}

export function isTobiraDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function isTobiraConnectionUser(
  value: unknown,
): value is TobiraConnectionUser {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string"
  );
}

export function parseTobiraConnectionUser(
  value: unknown,
): TobiraConnectionUser | null {
  if (!isTobiraConnectionUser(value)) return null;

  return {
    id: value.id,
    name: value.name,
    email: value.email,
  };
}

export function parseTobiraPairingResponse(
  value: unknown,
): TobiraPairingResponse | null {
  if (!isRecord(value)) return null;

  if (!(
    isTobiraDeviceToken(value.deviceToken) &&
    isTobiraPairingCode(value.userCode) &&
    typeof value.verificationUrlComplete === "string" &&
    isTobiraDateString(value.expiresAt)
  )) {
    return null;
  }

  return {
    deviceToken: value.deviceToken,
    userCode: value.userCode,
    verificationUrlComplete: value.verificationUrlComplete,
    expiresAt: value.expiresAt,
  };
}

export function parseTobiraRedeemResult(
  value: unknown,
): TobiraRedeemResult | null {
  if (!isRecord(value)) return null;
  if (value.status === "pending") return { status: "pending" };

  const user = parseTobiraConnectionUser(value.user);
  if (!(
    value.status === "redeemed" &&
    typeof value.apiKey === "string" &&
    value.apiKey.length > 0 &&
    typeof value.apiKeyId === "string" &&
    value.apiKeyId.length > 0 &&
    (value.expiresAt === null || isTobiraDateString(value.expiresAt)) &&
    user
  )) {
    return null;
  }

  return {
    status: "redeemed",
    apiKey: value.apiKey,
    apiKeyId: value.apiKeyId,
    expiresAt: value.expiresAt,
    user,
  };
}

export function parseTobiraRemoteConnection(
  value: unknown,
): TobiraRemoteConnection | null {
  if (!isRecord(value)) return null;

  const user = parseTobiraConnectionUser(value.user);
  if (!(
    typeof value.apiKeyId === "string" &&
    value.apiKeyId.length > 0 &&
    (value.expiresAt === null || isTobiraDateString(value.expiresAt)) &&
    user
  )) {
    return null;
  }

  return {
    apiKeyId: value.apiKeyId,
    expiresAt: value.expiresAt,
    user,
  };
}

export function isTobiraStoredAuth(value: unknown): value is TobiraStoredAuth {
  if (
    !isRecord(value) ||
    value.version !== TOBIRA_AUTH_STORAGE_VERSION
  ) {
    return false;
  }

  if (value.kind === "pairing") {
    return parseTobiraPairingResponse(value.pairing) !== null;
  }

  if (value.kind !== "connected" || !isRecord(value.connection)) {
    return false;
  }

  const connection = value.connection;
  return (
    typeof connection.apiKey === "string" &&
    connection.apiKey.length > 0 &&
    typeof connection.apiKeyId === "string" &&
    connection.apiKeyId.length > 0 &&
    isTobiraConnectionUser(connection.user) &&
    (connection.expiresAt === null ||
      isTobiraDateString(connection.expiresAt)) &&
    typeof connection.confirmationPending === "boolean"
  );
}

export function parseTobiraStoredAuth(
  value: unknown,
): TobiraStoredAuth | null {
  if (!isTobiraStoredAuth(value)) return null;

  if (value.kind === "pairing") {
    const pairing = parseTobiraPairingResponse(value.pairing);
    if (!pairing) return null;

    return {
      version: TOBIRA_AUTH_STORAGE_VERSION,
      kind: "pairing",
      pairing,
    };
  }

  const user = parseTobiraConnectionUser(value.connection.user);
  if (!user) return null;

  return {
    version: TOBIRA_AUTH_STORAGE_VERSION,
    kind: "connected",
    connection: {
      apiKey: value.connection.apiKey,
      apiKeyId: value.connection.apiKeyId,
      user,
      expiresAt: value.connection.expiresAt,
      confirmationPending: value.connection.confirmationPending,
    },
  };
}

export function isTobiraPublicState(
  value: unknown,
): value is TobiraPublicState {
  if (!isRecord(value)) return false;
  if (value.kind === "disconnected") return true;

  if (value.kind === "pairing") {
    return (
      isTobiraPairingCode(value.userCode) &&
      isTobiraDateString(value.expiresAt)
    );
  }

  return (
    value.kind === "connected" &&
    isTobiraConnectionUser(value.user) &&
    typeof value.confirmationPending === "boolean"
  );
}

export function isTobiraExpired(
  value: string | null,
  now: number,
): boolean {
  return value !== null && Date.parse(value) <= now;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
