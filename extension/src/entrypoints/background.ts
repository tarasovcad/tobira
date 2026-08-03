import { checkXAuth, fetchXUser } from "@/lib/x-api";
import { saveXConfig, type XConfig } from "@/lib/x-config";
import {
  createTobiraPairing,
  getTobiraConnection,
  redeemTobiraPairing,
  revokeTobiraConnection,
  TobiraApiError,
} from "@/lib/tobira-api";
import { TOBIRA_APP_URL } from "@/lib/tobira-config";
import {
  restrictTobiraStorageAccess,
  tobiraConnection,
  tobiraPendingPairing,
  type TobiraConnection,
  type TobiraConnectionUser,
  type TobiraPendingPairing,
} from "@/lib/tobira-connection-storage";
import type {
  PublicTobiraState,
  TobiraRuntimeMessage,
  TobiraRuntimeResponse,
} from "@/lib/tobira-messages";

const PAIRING_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
const DEVICE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

let storageAccessPromise: Promise<void> | undefined;
let startPairingPromise: Promise<TobiraRuntimeResponse> | null = null;
let redeemPairingPromise: Promise<ReconcileResult> | null = null;
let reconcileConnectionPromise: Promise<string | undefined> | null = null;
let disconnectPromise: Promise<TobiraRuntimeResponse> | null = null;
let operationVersion = 0;

type BackgroundMessage =
  | ({ type: "X_CONFIG" } & Partial<XConfig>)
  | { type: "CHECK_X_AUTH" }
  | { type: "FETCH_X_USER" }
  | TobiraRuntimeMessage;

type MessageSender = {
  tab?: { url?: string };
  url?: string;
};

export default defineBackground(() => {
  storageAccessPromise = restrictTobiraStorageAccess();
  void storageAccessPromise.catch((error) => {
    console.error("Failed to restrict extension storage access", error);
  });

  browser.runtime.onStartup.addListener(() => {
    void reconcileAndBroadcast().catch((error) => {
      console.error("Failed to restore Tobira connection", error);
    });
  });

  void reconcileAndBroadcast().catch((error) => {
    console.error("Failed to initialize Tobira connection", error);
  });

  browser.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
    void handleBackgroundMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.error("Failed to handle extension message", error);
        sendResponse({
          error: error instanceof Error ? error.message : "Extension request failed",
        });
      });

    return true;
  });
});

async function handleBackgroundMessage(
  message: BackgroundMessage,
  sender: MessageSender,
): Promise<unknown> {
  if (message.type === "X_CONFIG") return saveXConfig(message);
  if (message.type === "CHECK_X_AUTH") return checkXAuth();
  if (message.type === "FETCH_X_USER") return fetchXUser();

  if (message.type === "START_TOBIRA_PAIRING") {
    return startTobiraPairing();
  }

  if (message.type === "TOBIRA_OPEN_PAIRING") {
    return openTobiraPairing();
  }

  if (message.type === "PAIRING_APPROVED") {
    if (
      typeof message.code !== "string" ||
      !PAIRING_CODE_PATTERN.test(message.code) ||
      !isTobiraSender(sender)
    ) {
      return getTobiraStateResponse(
        "The Tobira approval could not be verified.",
      );
    }

    return handlePairingApproved(message.code);
  }

  if (message.type === "TOBIRA_GET_CONNECTION_STATE") {
    return getTobiraStateResponse();
  }

  if (message.type === "TOBIRA_ACK_CONNECTED") {
    return acknowledgeConnected();
  }

  if (message.type === "TOBIRA_DISCONNECT") {
    return disconnectTobiraConnection();
  }
}

async function startTobiraPairing(): Promise<TobiraRuntimeResponse> {
  if (startPairingPromise) return startPairingPromise;

  const operation = startTobiraPairingInternal();
  startPairingPromise = operation.finally(() => {
    startPairingPromise = null;
  });

  return startPairingPromise;
}

async function startTobiraPairingInternal(): Promise<TobiraRuntimeResponse> {
  await ensureTobiraStorageAccess();

  const currentState = await getPublicTobiraState();
  if (currentState.kind === "connected") {
    return { state: currentState };
  }

  operationVersion += 1;

  // A new click replaces any abandoned pairing and its device secret.
  await tobiraPendingPairing.removeValue();

  const pairing = await createTobiraPairing();
  await tobiraPendingPairing.setValue(pairing);

  try {
    await browser.tabs.create({ url: pairing.verificationUrlComplete });
  } catch (error) {
    await tobiraPendingPairing.removeValue();
    throw error;
  }

  const state = await getPublicTobiraState();
  broadcastTobiraState(state);
  return { state };
}

async function openTobiraPairing(): Promise<TobiraRuntimeResponse> {
  await ensureTobiraStorageAccess();

  const response = await getTobiraStateResponse();
  if (response.state.kind !== "pairing") return response;

  const pairing = await readStoredPairing();
  if (!pairing) {
    return getTobiraStateResponse();
  }

  try {
    await browser.tabs.create({ url: pairing.verificationUrlComplete });
  } catch {
    return {
      state: response.state,
      error: "Could not reopen the Tobira confirmation page.",
    };
  }

  return response;
}

async function handlePairingApproved(
  code: string,
): Promise<TobiraRuntimeResponse> {
  const result = await reconcilePendingPairing(code);
  const state = await getPublicTobiraState(result.warning);
  broadcastTobiraState(state);

  return {
    state,
    warning: result.warning,
  };
}

async function getTobiraStateResponse(
  warning?: string,
): Promise<TobiraRuntimeResponse> {
  await ensureTobiraStorageAccess();

  let state = await getPublicTobiraState(warning);

  if (state.kind === "connected") {
    // Use the persisted connection for instant popup startup and verify it in
    // the background. A revoked connection will still be pushed to the popup.
    void reconcileStoredConnection()
      .then(async (reconciliationWarning) => {
        broadcastTobiraState(
          await getPublicTobiraState(reconciliationWarning ?? warning),
        );
      })
      .catch((error) => {
        console.error("Failed to reconcile the Tobira connection", error);
      });

    return {state, warning};
  }

  if (state.kind === "pairing") {
    const result = await reconcilePendingPairing();
    state = await getPublicTobiraState(result.warning ?? warning);

    if (result.warning) {
      broadcastTobiraState(state);
    }

    return { state, warning: result.warning };
  }

  return { state };
}

async function acknowledgeConnected(): Promise<TobiraRuntimeResponse> {
  await ensureTobiraStorageAccess();

  const state = await getPublicTobiraState();
  if (state.kind !== "connected" || !state.confirmationPending) {
    return { state };
  }

  const connection = await readStoredConnection();
  if (!connection || connection.apiKeyId !== state.apiKeyId) {
    const currentState = await getPublicTobiraState();
    return { state: currentState };
  }

  await tobiraConnection.setValue({
    ...connection,
    confirmationPending: false,
  });

  const updatedState = await getPublicTobiraState();
  broadcastTobiraState(updatedState);
  return { state: updatedState };
}

async function reconcilePendingPairing(
  expectedCode?: string,
): Promise<ReconcileResult> {
  if (redeemPairingPromise) return redeemPairingPromise;

  const operation = reconcilePendingPairingInternal(expectedCode);
  redeemPairingPromise = operation.finally(() => {
    redeemPairingPromise = null;
  });

  return redeemPairingPromise;
}

async function reconcilePendingPairingInternal(
  expectedCode?: string,
): Promise<ReconcileResult> {
  await ensureTobiraStorageAccess();

  const pairing = await readStoredPairing();
  if (!pairing) return {};

  if (expectedCode && pairing.userCode !== expectedCode) {
    return { warning: "The approval did not match the pending connection." };
  }

  if (isExpired(pairing.expiresAt)) {
    await tobiraPendingPairing.removeValue();
    return {
      warning: "The connection request expired. Start again to reconnect.",
    };
  }

  const currentOperationVersion = operationVersion;

  try {
    const result = await redeemTobiraPairing(pairing.deviceToken);

    if (result.status === "pending") {
      return {};
    }

    if (currentOperationVersion !== operationVersion) {
      await revokeRedeemedKey(result.apiKey);
      return { warning: "The connection was cancelled before it completed." };
    }

    const connection: TobiraConnection = {
      apiKey: result.apiKey,
      apiKeyId: result.apiKeyId,
      user: result.user,
      expiresAt: result.expiresAt,
      confirmationPending: true,
      connectedAt: new Date().toISOString(),
    };

    // Persist the one-time credential before removing the recovery token.
    await tobiraConnection.setValue(connection);
    await removePendingPairing();

    return {};
  } catch (error) {
    if (error instanceof TobiraApiError) {
      if (
        error.status === 400 ||
        error.status === 404 ||
        error.status === 409 ||
        error.status === 410
      ) {
        await tobiraPendingPairing.removeValue();
        return { warning: getPairingFailureMessage(error.status) };
      }

      if (error.status === 429) {
        return {
          warning: error.retryAfterSeconds
            ? `Tobira is rate limiting the connection. Try again in ${error.retryAfterSeconds} seconds.`
            : "Tobira is rate limiting the connection. Try again shortly.",
        };
      }

      if (error.status === 0 || error.status >= 500) {
        return {
          warning:
            "Tobira could not be reached. The connection will remain available to retry.",
        };
      }
    }

    throw error;
  }
}

async function disconnectTobiraConnection(): Promise<TobiraRuntimeResponse> {
  if (disconnectPromise) return disconnectPromise;

  operationVersion += 1;
  const operation = disconnectTobiraConnectionInternal();
  disconnectPromise = operation.finally(() => {
    disconnectPromise = null;
  });

  return disconnectPromise;
}

async function disconnectTobiraConnectionInternal(): Promise<TobiraRuntimeResponse> {
  await ensureTobiraStorageAccess();

  const connection = await readStoredConnection();
  let warning: string | undefined;

  if (connection) {
    try {
      await revokeTobiraConnection(connection.apiKey);
    } catch (error) {
      if (!(error instanceof TobiraApiError && error.status === 401)) {
        warning =
          "Disconnected locally, but Tobira could not confirm server revocation.";
      }
    }
  }

  let cleanupFailed = false;

  try {
    await tobiraConnection.removeValue();
  } catch (error) {
    cleanupFailed = true;
    console.error(
      "Failed to remove Tobira connection from extension storage",
      error,
    );
  }

  try {
    await tobiraPendingPairing.removeValue();
  } catch (error) {
    cleanupFailed = true;
    console.error(
      "Failed to remove pending Tobira pairing from extension storage",
      error,
    );
  }

  if (cleanupFailed) {
    const state = await getPublicTobiraState();
    return {
      state,
      error:
        "The connection could not be fully removed from extension storage.",
    };
  }

  const state: PublicTobiraState = { kind: "disconnected", warning };
  broadcastTobiraState(state);
  return { state, warning };
}

async function reconcileAndBroadcast() {
  await ensureTobiraStorageAccess();

  const initialState = await getPublicTobiraState();
  if (initialState.kind === "connected") {
    const warning = await reconcileStoredConnection();
    broadcastTobiraState(await getPublicTobiraState(warning));
    return;
  }

  if (initialState.kind === "pairing") {
    const result = await reconcilePendingPairing();
    const state = await getPublicTobiraState(result.warning);
    broadcastTobiraState(state);
    return;
  }

  broadcastTobiraState(initialState);
}

async function reconcileStoredConnection(): Promise<string | undefined> {
  if (reconcileConnectionPromise) return reconcileConnectionPromise;

  const operation = reconcileStoredConnectionInternal();
  reconcileConnectionPromise = operation.finally(() => {
    reconcileConnectionPromise = null;
  });

  return reconcileConnectionPromise;
}

async function reconcileStoredConnectionInternal(): Promise<string | undefined> {
  const connection = await readStoredConnection();
  if (!connection || isExpired(connection.expiresAt)) return undefined;

  try {
    const serverConnection = await getTobiraConnection(connection.apiKey);

    if (serverConnection.apiKeyId !== connection.apiKeyId) {
      await tobiraConnection.removeValue();
      return "The stored Tobira connection is no longer available.";
    }

    const updatedConnection: TobiraConnection = {
      ...connection,
      user: serverConnection.user,
      expiresAt: serverConnection.expiresAt,
    };

    if (
      connection.user.id !== updatedConnection.user.id ||
      connection.user.name !== updatedConnection.user.name ||
      connection.user.email !== updatedConnection.user.email ||
      connection.user.image !== updatedConnection.user.image ||
      connection.expiresAt !== updatedConnection.expiresAt
    ) {
      await tobiraConnection.setValue(updatedConnection);
    }

    return undefined;
  } catch (error) {
    if (error instanceof TobiraApiError) {
      if (error.status === 401 || error.status === 403) {
        await tobiraConnection.removeValue();
        return "This Tobira connection was revoked. Connect again to restore access.";
      }

      if (error.status === 0 || error.status === 429 || error.status >= 500) {
        return "Tobira could not verify the connection right now.";
      }
    }

    console.error("Failed to reconcile the Tobira connection", error);
    return "Tobira could not verify the connection right now.";
  }
}

async function getPublicTobiraState(
  warning?: string,
): Promise<PublicTobiraState> {
  await ensureTobiraStorageAccess();

  const connection = await readStoredConnection();
  if (connection && !isExpired(connection.expiresAt)) {
    await removePendingPairing();
    return {
      kind: "connected",
      user: connection.user,
      apiKeyId: connection.apiKeyId,
      expiresAt: connection.expiresAt,
      confirmationPending: connection.confirmationPending,
    };
  }

  if (connection) {
    await tobiraConnection.removeValue();
  }

  const pairing = await readStoredPairing();
  if (pairing && !isExpired(pairing.expiresAt)) {
    return {
      kind: "pairing",
      userCode: pairing.userCode,
      expiresAt: pairing.expiresAt,
      warning,
    };
  }

  if (pairing) {
    await tobiraPendingPairing.removeValue();
  }

  return { kind: "disconnected", warning };
}

async function readStoredConnection(): Promise<TobiraConnection | null> {
  const value = await tobiraConnection.getValue();
  if (!value) return null;

  if (!isStoredConnection(value)) {
    await tobiraConnection.removeValue();
    return null;
  }

  return value;
}

async function readStoredPairing(): Promise<TobiraPendingPairing | null> {
  const value = await tobiraPendingPairing.getValue();
  if (!value) return null;

  if (!isStoredPairing(value)) {
    await tobiraPendingPairing.removeValue();
    return null;
  }

  return value;
}

async function ensureTobiraStorageAccess() {
  if (!storageAccessPromise) {
    storageAccessPromise = restrictTobiraStorageAccess();
  }

  await storageAccessPromise;
}

function broadcastTobiraState(state: PublicTobiraState) {
  void browser.runtime
    .sendMessage({ type: "TOBIRA_STATE_CHANGED", state })
    .catch(() => undefined);
}

function isTobiraSender(sender: {
  tab?: { url?: string };
  url?: string;
}): boolean {
  const senderUrl = sender.tab?.url ?? sender.url;
  if (!senderUrl) return false;

  try {
    return new URL(senderUrl).origin === new URL(TOBIRA_APP_URL).origin;
  } catch {
    return false;
  }
}

function isStoredConnection(value: unknown): value is TobiraConnection {
  if (typeof value !== "object" || value === null) return false;

  const connection = value as {
    apiKey?: unknown;
    apiKeyId?: unknown;
    confirmationPending?: unknown;
    connectedAt?: unknown;
    expiresAt?: unknown;
    user?: unknown;
  };

  return (
    typeof connection.apiKey === "string" &&
    connection.apiKey.length > 0 &&
    typeof connection.apiKeyId === "string" &&
    connection.apiKeyId.length > 0 &&
    isTobiraConnectionUser(connection.user) &&
    (connection.expiresAt === null || isDateString(connection.expiresAt)) &&
    typeof connection.confirmationPending === "boolean" &&
    isDateString(connection.connectedAt)
  );
}

function isStoredPairing(value: unknown): value is TobiraPendingPairing {
  if (typeof value !== "object" || value === null) return false;

  const pairing = value as {
    deviceToken?: unknown;
    expiresAt?: unknown;
    pollIntervalMs?: unknown;
    userCode?: unknown;
    verificationUrl?: unknown;
    verificationUrlComplete?: unknown;
  };

  return (
    typeof pairing.deviceToken === "string" &&
    DEVICE_TOKEN_PATTERN.test(pairing.deviceToken) &&
    typeof pairing.userCode === "string" &&
    PAIRING_CODE_PATTERN.test(pairing.userCode) &&
    typeof pairing.verificationUrl === "string" &&
    typeof pairing.verificationUrlComplete === "string" &&
    isDateString(pairing.expiresAt) &&
    typeof pairing.pollIntervalMs === "number" &&
    pairing.pollIntervalMs > 0
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

function isDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isExpired(value: string | null): boolean {
  return value !== null && Date.parse(value) <= Date.now();
}

function getPairingFailureMessage(status: number): string {
  if (status === 404)
    return "The connection request was not found. Start again.";
  if (status === 409)
    return "The connection request was already completed. Start again if needed.";
  if (status === 410)
    return "The connection request expired or was cancelled. Start again.";
  return "The connection request is invalid. Start again.";
}

async function revokeRedeemedKey(apiKey: string) {
  try {
    await revokeTobiraConnection(apiKey);
  } catch (error) {
    console.error("Failed to revoke a cancelled Tobira connection", error);
  }
}

async function removePendingPairing() {
  try {
    await tobiraPendingPairing.removeValue();
  } catch (error) {
    console.error("Failed to remove the completed Tobira pairing", error);
  }
}

type ReconcileResult = {
  warning?: string;
};
