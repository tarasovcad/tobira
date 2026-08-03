import type { TobiraConnectionUser } from "@/lib/tobira-connection-storage";

export type PublicTobiraState =
  | { kind: "bootstrapping" }
  | { kind: "disconnected"; warning?: string }
  | {
      kind: "pairing";
      userCode: string;
      expiresAt: string;
      warning?: string;
    }
  | {
      kind: "connected";
      user: TobiraConnectionUser;
      apiKeyId: string;
      expiresAt: string | null;
      confirmationPending: boolean;
    }
  | {
      kind: "disconnecting";
      user: TobiraConnectionUser;
    };

export type TobiraRuntimeMessage =
  | { type: "TOBIRA_GET_CONNECTION_STATE" }
  | { type: "START_TOBIRA_PAIRING" }
  | { type: "TOBIRA_OPEN_PAIRING" }
  | { type: "PAIRING_APPROVED"; code: string }
  | { type: "TOBIRA_ACK_CONNECTED" }
  | { type: "TOBIRA_DISCONNECT" };

export type TobiraRuntimeResponse = {
  state: PublicTobiraState;
  error?: string;
  warning?: string;
};

export type TobiraStateChangedMessage = {
  type: "TOBIRA_STATE_CHANGED";
  state: PublicTobiraState;
};

export function isTobiraStateChangedMessage(
  value: unknown,
): value is TobiraStateChangedMessage {
  if (typeof value !== "object" || value === null) return false;

  const message = value as { state?: unknown; type?: unknown };
  return (
    message.type === "TOBIRA_STATE_CHANGED" &&
    isPublicTobiraState(message.state)
  );
}

function isPublicTobiraState(value: unknown): value is PublicTobiraState {
  if (typeof value !== "object" || value === null) return false;

  const state = value as {
    apiKeyId?: unknown;
    confirmationPending?: unknown;
    expiresAt?: unknown;
    kind?: unknown;
    user?: unknown;
    userCode?: unknown;
    warning?: unknown;
  };

  if (state.kind === "bootstrapping") return true;

  if (state.kind === "disconnected") {
    return state.warning === undefined || typeof state.warning === "string";
  }

  if (state.kind === "pairing") {
    return (
      typeof state.userCode === "string" &&
      typeof state.expiresAt === "string" &&
      (state.warning === undefined || typeof state.warning === "string")
    );
  }

  if (state.kind === "disconnecting") {
    return isTobiraConnectionUser(state.user);
  }

  return (
    state.kind === "connected" &&
    isTobiraConnectionUser(state.user) &&
    typeof state.apiKeyId === "string" &&
    (state.expiresAt === null || typeof state.expiresAt === "string") &&
    typeof state.confirmationPending === "boolean"
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
