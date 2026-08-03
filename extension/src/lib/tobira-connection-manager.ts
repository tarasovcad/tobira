import { TobiraApiError, type TobiraApi } from "@/lib/tobira-api";
import type { TobiraAuthStore } from "@/lib/tobira-connection-storage";
import {
  isTobiraExpired,
  type TobiraPendingPairing,
  type TobiraPublicState,
  type TobiraStoredAuth,
  type TobiraStoredConnection,
} from "@/lib/tobira-contracts";
import type { TobiraRuntimeResponse } from "@/lib/tobira-messages";

export type TobiraConnectionManagerDependencies = {
  api: TobiraApi;
  store: TobiraAuthStore;
  openTab(url: string): Promise<void>;
  broadcast(response: TobiraRuntimeResponse): void;
  now(): number;
  logError(message: string, error: unknown): void;
};

type AuthSnapshot = {
  auth: TobiraStoredAuth | null;
  revision: number;
};

export class TobiraConnectionManager {
  private revision = 0;
  private stateLock: Promise<void> = Promise.resolve();
  private readonly inFlight = new Map<
    string,
    Promise<TobiraRuntimeResponse>
  >();

  constructor(
    private readonly dependencies: TobiraConnectionManagerDependencies,
  ) {}

  async initialize(): Promise<void> {
    await this.getAuthSnapshot();
  }

  async getState(): Promise<TobiraRuntimeResponse> {
    const snapshot = await this.getAuthSnapshot();
    const response = toRuntimeResponse(snapshot.auth);

    if (snapshot.auth?.kind === "connected") {
      this.scheduleReconciliation(
        this.reconcileConnection(snapshot.auth.connection.apiKeyId),
      );
    } else if (snapshot.auth?.kind === "pairing") {
      this.scheduleReconciliation(
        this.reconcilePairing(snapshot.auth.pairing.userCode),
      );
    }

    return response;
  }

  startPairing(): Promise<TobiraRuntimeResponse> {
    return this.runSingleFlight("start-pairing", async () => {
      const response = await this.startPairingInternal();
      this.dependencies.broadcast(response);
      return response;
    });
  }

  async reopenPairing(): Promise<TobiraRuntimeResponse> {
    const snapshot = await this.getAuthSnapshot();
    if (snapshot.auth?.kind !== "pairing") {
      return toRuntimeResponse(snapshot.auth);
    }

    try {
      await this.dependencies.openTab(
        snapshot.auth.pairing.verificationUrlComplete,
      );
      return toRuntimeResponse(snapshot.auth);
    } catch (error) {
      this.dependencies.logError(
        "Failed to reopen the Tobira confirmation page",
        error,
      );
      return toRuntimeResponse(
        snapshot.auth,
        "Could not reopen the Tobira confirmation page.",
      );
    }
  }

  async approvePairing(code: string): Promise<TobiraRuntimeResponse> {
    const response = await this.reconcilePairing(code);
    this.dependencies.broadcast(response);
    return response;
  }

  async acknowledgeConnected(): Promise<TobiraRuntimeResponse> {
    const response = await this.withStateLock(async () => {
      const auth = await this.readActiveAuthUnlocked();
      if (
        auth?.kind !== "connected" ||
        !auth.connection.confirmationPending
      ) {
        return toRuntimeResponse(auth);
      }

      const updatedAuth: TobiraStoredAuth = {
        ...auth,
        connection: {
          ...auth.connection,
          confirmationPending: false,
        },
      };

      await this.dependencies.store.set(updatedAuth);
      this.revision += 1;
      return toRuntimeResponse(updatedAuth);
    });

    this.dependencies.broadcast(response);
    return response;
  }

  disconnect(): Promise<TobiraRuntimeResponse> {
    return this.runSingleFlight("disconnect", async () => {
      const response = await this.disconnectInternal();
      this.dependencies.broadcast(response);
      return response;
    });
  }

  private async startPairingInternal(): Promise<TobiraRuntimeResponse> {
    const preparation = await this.withStateLock(async () => {
      const auth = await this.readActiveAuthUnlocked();
      if (auth?.kind === "connected") {
        return {
          kind: "blocked",
          response: toRuntimeResponse(auth),
        } as const;
      }

      this.revision += 1;
      const operationRevision = this.revision;
      await this.dependencies.store.set(null);
      return { kind: "ready", operationRevision } as const;
    });

    if (preparation.kind === "blocked") return preparation.response;

    let pairing: TobiraPendingPairing;
    try {
      pairing = await this.dependencies.api.createPairing();
    } catch (error) {
      this.dependencies.logError("Failed to start Tobira pairing", error);
      return this.getCurrentResponse(getPairingStartNotice(error));
    }

    if (isTobiraExpired(pairing.expiresAt, this.dependencies.now())) {
      return this.getCurrentResponse(
        "Tobira returned an expired connection request. Please try again.",
      );
    }

    const stored = await this.withStateLock(async () => {
      if (this.revision !== preparation.operationRevision) return false;

      const current = await this.readActiveAuthUnlocked();
      if (current !== null) return false;

      await this.dependencies.store.set({
        version: 1,
        kind: "pairing",
        pairing,
      });
      this.revision += 1;
      return true;
    });

    if (!stored) {
      return this.getCurrentResponse(
        "The connection request was replaced before it completed.",
      );
    }

    try {
      await this.dependencies.openTab(pairing.verificationUrlComplete);
    } catch (error) {
      this.dependencies.logError(
        "Failed to open the Tobira confirmation page",
        error,
      );
      await this.clearPairing(pairing);
      return this.getCurrentResponse(
        "Could not open the Tobira confirmation page.",
      );
    }

    return this.getCurrentResponse();
  }

  private async reconcilePairing(
    expectedCode: string,
  ): Promise<TobiraRuntimeResponse> {
    const snapshot = await this.getAuthSnapshot();
    if (snapshot.auth?.kind !== "pairing") {
      return toRuntimeResponse(snapshot.auth);
    }

    if (snapshot.auth.pairing.userCode !== expectedCode) {
      return toRuntimeResponse(
        snapshot.auth,
        "The approval did not match the pending connection.",
      );
    }

    const pairing = snapshot.auth.pairing;
    return this.runSingleFlight(`redeem:${expectedCode}`, () =>
      this.reconcilePairingInternal(pairing),
    );
  }

  private async reconcilePairingInternal(
    pairing: TobiraPendingPairing,
  ): Promise<TobiraRuntimeResponse> {
    const operationRevision = await this.withStateLock(async () => {
      const auth = await this.readActiveAuthUnlocked();
      if (!isSamePairing(auth, pairing)) return null;

      this.revision += 1;
      return this.revision;
    });

    if (operationRevision === null) return this.getCurrentResponse();

    try {
      const result = await this.dependencies.api.redeemPairing(
        pairing.deviceToken,
      );

      if (result.status === "pending") {
        return this.getCurrentResponse();
      }

      const connection: TobiraStoredConnection = {
        apiKey: result.apiKey,
        apiKeyId: result.apiKeyId,
        user: result.user,
        expiresAt: result.expiresAt,
        confirmationPending: true,
      };

      const accepted = await this.withStateLock(async () => {
        const auth = await this.readActiveAuthUnlocked();
        if (
          this.revision !== operationRevision ||
          !isSamePairing(auth, pairing)
        ) {
          return false;
        }

        await this.dependencies.store.set({
          version: 1,
          kind: "connected",
          connection,
        });
        this.revision += 1;
        return true;
      });

      if (!accepted) {
        await this.revokeLateConnection(result.apiKey);
        return this.getCurrentResponse(
          "The connection was cancelled before it completed.",
        );
      }

      return this.getCurrentResponse();
    } catch (error) {
      return this.handlePairingError(pairing, operationRevision, error);
    }
  }

  private async handlePairingError(
    pairing: TobiraPendingPairing,
    operationRevision: number,
    error: unknown,
  ): Promise<TobiraRuntimeResponse> {
    if (error instanceof TobiraApiError) {
      if (isTerminalPairingStatus(error.status)) {
        await this.withStateLock(async () => {
          const auth = await this.readActiveAuthUnlocked();
          if (
            this.revision === operationRevision &&
            isSamePairing(auth, pairing)
          ) {
            await this.dependencies.store.set(null);
            this.revision += 1;
          }
        });

        return this.getCurrentResponse(getPairingFailureMessage(error.status));
      }

      if (error.status === 429) {
        return this.getCurrentResponse(
          error.retryAfterSeconds
            ? `Tobira is rate limiting the connection. Try again in ${error.retryAfterSeconds} seconds.`
            : "Tobira is rate limiting the connection. Try again shortly.",
        );
      }

      if (error.status === 0 || error.status >= 500) {
        return this.getCurrentResponse(
          "Tobira could not be reached. The connection remains available to retry.",
        );
      }
    }

    this.dependencies.logError("Failed to redeem the Tobira pairing", error);
    return this.getCurrentResponse(
      "Tobira could not complete the connection. Please try again.",
    );
  }

  private async reconcileConnection(
    apiKeyId: string,
  ): Promise<TobiraRuntimeResponse> {
    return this.runSingleFlight(`reconcile:${apiKeyId}`, async () => {
      const snapshot = await this.getAuthSnapshot();
      if (
        snapshot.auth?.kind !== "connected" ||
        snapshot.auth.connection.apiKeyId !== apiKeyId
      ) {
        return toRuntimeResponse(snapshot.auth);
      }

      const connection = snapshot.auth.connection;

      try {
        const remote = await this.dependencies.api.getConnection(
          connection.apiKey,
        );

        if (
          remote.apiKeyId !== connection.apiKeyId ||
          isTobiraExpired(remote.expiresAt, this.dependencies.now())
        ) {
          await this.clearConnection(connection.apiKeyId);
          return this.getCurrentResponse(
            "The stored Tobira connection is no longer available.",
          );
        }

        await this.withStateLock(async () => {
          const auth = await this.readActiveAuthUnlocked();
          if (
            this.revision !== snapshot.revision ||
            !isSameConnection(auth, connection.apiKeyId)
          ) {
            return;
          }

          if (
            sameUser(auth.connection.user, remote.user) &&
            auth.connection.expiresAt === remote.expiresAt
          ) {
            return;
          }

          await this.dependencies.store.set({
            ...auth,
            connection: {
              ...auth.connection,
              user: remote.user,
              expiresAt: remote.expiresAt,
            },
          });
          this.revision += 1;
        });

        return this.getCurrentResponse();
      } catch (error) {
        if (
          error instanceof TobiraApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          await this.clearConnection(connection.apiKeyId);
          return this.getCurrentResponse(
            "This Tobira connection was revoked. Connect again to restore access.",
          );
        }

        if (
          error instanceof TobiraApiError &&
          (error.status === 0 || error.status === 429 || error.status >= 500)
        ) {
          return this.getCurrentResponse(
            "Tobira could not verify the connection right now.",
          );
        }

        this.dependencies.logError(
          "Failed to reconcile the Tobira connection",
          error,
        );
        return this.getCurrentResponse(
          "Tobira could not verify the connection right now.",
        );
      }
    });
  }

  private async disconnectInternal(): Promise<TobiraRuntimeResponse> {
    const auth = await this.withStateLock(async () => {
      const auth = await this.readActiveAuthUnlocked();
      this.revision += 1;
      return auth;
    });

    if (auth?.kind !== "connected") {
      try {
        await this.withStateLock(async () => {
          await this.dependencies.store.set(null);
          this.revision += 1;
        });
        return toRuntimeResponse(null);
      } catch (error) {
        this.dependencies.logError(
          "Failed to clear the Tobira connection from storage",
          error,
        );
        return this.getCurrentResponse(
          "The connection could not be removed from extension storage.",
        );
      }
    }

    const connection = auth.connection;
    let notice: string | undefined;

    try {
      await this.dependencies.api.revokeConnection(connection.apiKey);
    } catch (error) {
      if (!(error instanceof TobiraApiError && error.status === 401)) {
        notice =
          "Disconnected locally, but Tobira could not confirm server revocation.";
      }
    }

    try {
      await this.withStateLock(async () => {
        const auth = await this.readActiveAuthUnlocked();
        if (isSameConnection(auth, connection.apiKeyId)) {
          await this.dependencies.store.set(null);
          this.revision += 1;
        }
      });
    } catch (error) {
      this.dependencies.logError(
        "Failed to clear the Tobira connection from storage",
        error,
      );
      return this.getCurrentResponse(
        "The connection could not be removed from extension storage.",
      );
    }

    return this.getCurrentResponse(notice);
  }

  private async getAuthSnapshot(): Promise<AuthSnapshot> {
    return this.withStateLock(async () => ({
      auth: await this.readActiveAuthUnlocked(),
      revision: this.revision,
    }));
  }

  private async getCurrentResponse(
    notice?: string,
  ): Promise<TobiraRuntimeResponse> {
    const snapshot = await this.getAuthSnapshot();
    return toRuntimeResponse(snapshot.auth, notice);
  }

  private async readActiveAuthUnlocked(): Promise<TobiraStoredAuth | null> {
    const auth = await this.dependencies.store.get();
    if (!auth) return null;

    const expiresAt =
      auth.kind === "pairing"
        ? auth.pairing.expiresAt
        : auth.connection.expiresAt;

    if (!isTobiraExpired(expiresAt, this.dependencies.now())) return auth;

    await this.dependencies.store.set(null);
    this.revision += 1;
    return null;
  }

  private async clearPairing(pairing: TobiraPendingPairing): Promise<void> {
    await this.withStateLock(async () => {
      const auth = await this.readActiveAuthUnlocked();
      if (!isSamePairing(auth, pairing)) return;

      await this.dependencies.store.set(null);
      this.revision += 1;
    });
  }

  private async clearConnection(apiKeyId: string): Promise<void> {
    await this.withStateLock(async () => {
      const auth = await this.readActiveAuthUnlocked();
      if (!isSameConnection(auth, apiKeyId)) return;

      await this.dependencies.store.set(null);
      this.revision += 1;
    });
  }

  private async revokeLateConnection(apiKey: string): Promise<void> {
    try {
      await this.dependencies.api.revokeConnection(apiKey);
    } catch (error) {
      this.dependencies.logError(
        "Failed to revoke a cancelled Tobira connection",
        error,
      );
    }
  }

  private scheduleReconciliation(
    operation: Promise<TobiraRuntimeResponse>,
  ): void {
    void operation
      .then((response) => this.dependencies.broadcast(response))
      .catch((error) => {
        this.dependencies.logError(
          "Failed to reconcile the Tobira connection",
          error,
        );
      });
  }

  private runSingleFlight(
    key: string,
    operation: () => Promise<TobiraRuntimeResponse>,
  ): Promise<TobiraRuntimeResponse> {
    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const promise = operation().finally(() => {
      if (this.inFlight.get(key) === promise) {
        this.inFlight.delete(key);
      }
    });
    this.inFlight.set(key, promise);
    return promise;
  }

  private withStateLock<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.stateLock.then(operation, operation);
    this.stateLock = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}

function toRuntimeResponse(
  auth: TobiraStoredAuth | null,
  notice?: string,
): TobiraRuntimeResponse {
  return {
    state: toPublicState(auth),
    ...(notice ? { notice } : {}),
  };
}

function toPublicState(auth: TobiraStoredAuth | null): TobiraPublicState {
  if (!auth) return { kind: "disconnected" };

  if (auth.kind === "pairing") {
    return {
      kind: "pairing",
      userCode: auth.pairing.userCode,
      expiresAt: auth.pairing.expiresAt,
    };
  }

  return {
    kind: "connected",
    user: auth.connection.user,
    confirmationPending: auth.connection.confirmationPending,
  };
}

function isSamePairing(
  auth: TobiraStoredAuth | null,
  pairing: TobiraPendingPairing,
): auth is Extract<TobiraStoredAuth, { kind: "pairing" }> {
  return (
    auth?.kind === "pairing" &&
    auth.pairing.userCode === pairing.userCode &&
    auth.pairing.deviceToken === pairing.deviceToken
  );
}

function isSameConnection(
  auth: TobiraStoredAuth | null,
  apiKeyId: string,
): auth is Extract<TobiraStoredAuth, { kind: "connected" }> {
  return auth?.kind === "connected" && auth.connection.apiKeyId === apiKeyId;
}

function sameUser(
  left: TobiraStoredConnection["user"],
  right: TobiraStoredConnection["user"],
): boolean {
  return (
    left.id === right.id &&
    left.name === right.name &&
    left.email === right.email
  );
}

function isTerminalPairingStatus(status: number): boolean {
  return status === 400 || status === 404 || status === 409 || status === 410;
}

function getPairingFailureMessage(status: number): string {
  if (status === 404) {
    return "The connection request was not found. Start again.";
  }
  if (status === 409) {
    return "The connection request was already completed. Start again if needed.";
  }
  if (status === 410) {
    return "The connection request expired or was cancelled. Start again.";
  }
  return "The connection request is invalid. Start again.";
}

function getPairingStartNotice(error: unknown): string {
  if (error instanceof TobiraApiError) {
    if (error.status === 429) {
      return error.retryAfterSeconds
        ? `Tobira is rate limiting new connections. Try again in ${error.retryAfterSeconds} seconds.`
        : "Tobira is rate limiting new connections. Try again shortly.";
    }

    if (error.status === 0 || error.status >= 500) {
      return "Tobira could not start the connection. Please try again.";
    }
  }

  return "Could not start the Tobira connection. Please try again.";
}
