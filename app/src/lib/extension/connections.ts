import {and, eq, inArray, isNotNull, isNull, lt, ne, or, sql} from "drizzle-orm";

import {db} from "@/db";
import {extensionConnections, user, type ExtensionConnectionStatus} from "@/db/schema";
import {
  parseExtensionClientMetadata,
  type ExtensionClientMetadata,
} from "@/lib/extension/device-metadata";
import {classifyExtensionConnection} from "@/lib/extension/connection-state";
import {
  EXTENSION_CREDENTIAL_TTL_MS,
  hashExtensionCredential,
  hashExtensionPairingCode,
} from "@/lib/extension/pairings";
import {logger, toLogError} from "@/lib/shared/logger";

const PAIRING_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const CONNECTION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

type ExtensionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

type ConnectionState = {
  id: string;
  status: ExtensionConnectionStatus;
  userId: string | null;
  clientMetadata: unknown;
  pairingExpiresAt: string;
  credentialExpiresAt: string | null;
  approvedAt: string | null;
  activatedAt: string | null;
  cancelledAt: string | null;
  revokedAt: string | null;
};

export type ExtensionPairingViewState =
  | {kind: "pending"; device: ExtensionClientMetadata}
  | {kind: "approved"; device: ExtensionClientMetadata}
  | {kind: "connected"; device: ExtensionClientMetadata}
  | {kind: "not-found"}
  | {kind: "expired"}
  | {kind: "cancelled"}
  | {kind: "used"};

export type ExtensionPairingApprovalResult =
  | "approved"
  | "not-found"
  | "expired"
  | "cancelled"
  | "used"
  | "error";

export type ExtensionPairingRedemptionResult =
  | {kind: "pending"}
  | {
      kind: "redeemed";
      connectionId: string;
      credentialExpiresAt: string | null;
      user: ExtensionUser;
    }
  | {kind: "not-found"}
  | {kind: "expired"}
  | {kind: "cancelled"}
  | {kind: "revoked"}
  | {kind: "connection-expired"}
  | {kind: "invalid-account"};

export async function getExtensionPairingViewState(
  code: string,
): Promise<ExtensionPairingViewState> {
  const connection = await findConnectionByUserCodeHash(hashExtensionPairingCode(code));
  if (!connection) return {kind: "not-found"};

  const device = parseExtensionClientMetadata(connection.clientMetadata);
  if (!device) return {kind: "not-found"};

  const state = classifyExtensionConnection(connection, new Date());
  if (state === "cancelled") return {kind: "cancelled"};
  if (state === "revoked" || state === "connection-expired") return {kind: "used"};
  if (state === "active") return {kind: "connected", device};
  if (state === "pairing-expired") return {kind: "expired"};
  if (state === "approved") return {kind: "approved", device};
  return {kind: "pending", device};
}

export async function approveExtensionPairingForUser(
  code: string,
  userId: string,
): Promise<ExtensionPairingApprovalResult> {
  const userCodeHash = hashExtensionPairingCode(code);
  const now = new Date();
  const nowIso = now.toISOString();

  const [approved] = await db
    .update(extensionConnections)
    .set({
      status: "approved",
      userId,
      approvedAt: nowIso,
      updatedAt: nowIso,
    })
    .where(
      and(
        eq(extensionConnections.userCodeHash, userCodeHash),
        eq(extensionConnections.status, "pending"),
        isNull(extensionConnections.userId),
        isNull(extensionConnections.approvedAt),
        isNull(extensionConnections.cancelledAt),
        gtIso(extensionConnections.pairingExpiresAt, nowIso),
      ),
    )
    .returning({id: extensionConnections.id});

  if (approved) return "approved";

  const connection = await findConnectionByUserCodeHash(userCodeHash);
  if (!connection) return "not-found";
  const state = classifyExtensionConnection(connection, now);
  if (state === "cancelled") return "cancelled";
  if (state === "pairing-expired") return "expired";
  if (state !== "pending") return "used";
  return "error";
}

export async function cancelExtensionPairing(code: string): Promise<boolean> {
  const now = new Date().toISOString();
  const [cancelled] = await db
    .update(extensionConnections)
    .set({status: "cancelled", cancelledAt: now, updatedAt: now})
    .where(
      and(
        eq(extensionConnections.userCodeHash, hashExtensionPairingCode(code)),
        eq(extensionConnections.status, "pending"),
        isNull(extensionConnections.userId),
      ),
    )
    .returning({id: extensionConnections.id});

  return cancelled !== undefined;
}

export async function redeemExtensionPairing(
  credential: string,
): Promise<ExtensionPairingRedemptionResult> {
  const credentialHash = hashExtensionCredential(credential);
  const now = new Date();
  const nowIso = now.toISOString();
  const credentialExpiresAt = new Date(now.getTime() + EXTENSION_CREDENTIAL_TTL_MS).toISOString();

  const [activated] = await db
    .update(extensionConnections)
    .set({
      status: "active",
      activatedAt: nowIso,
      credentialExpiresAt,
      lastUsedAt: nowIso,
      updatedAt: nowIso,
    })
    .where(
      and(
        eq(extensionConnections.credentialHash, credentialHash),
        eq(extensionConnections.status, "approved"),
        isNotNull(extensionConnections.userId),
        isNotNull(extensionConnections.approvedAt),
        isNull(extensionConnections.cancelledAt),
        gtIso(extensionConnections.pairingExpiresAt, nowIso),
      ),
    )
    .returning({id: extensionConnections.id});

  const connection = await findConnectionByCredentialHash(credentialHash);
  if (!connection) return {kind: "not-found"};
  const state = classifyExtensionConnection(connection, now);
  if (state === "cancelled") return {kind: "cancelled"};
  if (state === "revoked") return {kind: "revoked"};
  if (state === "connection-expired") return {kind: "connection-expired"};

  if (state === "active") {
    if (!connection.userId) return {kind: "invalid-account"};
    const owner = await findExtensionUser(connection.userId);
    if (!owner) return {kind: "invalid-account"};

    if (activated) {
      await revokeReplacedInstallationConnections(connection, nowIso);
    }

    return {
      kind: "redeemed",
      connectionId: connection.id,
      credentialExpiresAt: connection.credentialExpiresAt,
      user: owner,
    };
  }

  if (state === "pairing-expired") return {kind: "expired"};
  return {kind: "pending"};
}

export async function cleanupExpiredExtensionConnections() {
  const now = Date.now();
  const pairingCutoff = new Date(now - PAIRING_RETENTION_MS).toISOString();
  const connectionCutoff = new Date(now - CONNECTION_RETENTION_MS).toISOString();

  await db
    .delete(extensionConnections)
    .where(
      or(
        and(
          inArray(extensionConnections.status, ["pending", "approved", "cancelled"]),
          lt(extensionConnections.pairingExpiresAt, pairingCutoff),
        ),
        and(
          eq(extensionConnections.status, "revoked"),
          isNotNull(extensionConnections.revokedAt),
          lt(extensionConnections.revokedAt, connectionCutoff),
        ),
        and(
          eq(extensionConnections.status, "active"),
          isNotNull(extensionConnections.credentialExpiresAt),
          lt(extensionConnections.credentialExpiresAt, connectionCutoff),
        ),
      ),
    );
}

async function findConnectionByUserCodeHash(userCodeHash: string) {
  const [connection] = await selectConnectionState(
    eq(extensionConnections.userCodeHash, userCodeHash),
  );
  return connection ?? null;
}

async function findConnectionByCredentialHash(credentialHash: string) {
  const [connection] = await selectConnectionState(
    eq(extensionConnections.credentialHash, credentialHash),
  );
  return connection ?? null;
}

function selectConnectionState(where: ReturnType<typeof eq>) {
  return db
    .select({
      id: extensionConnections.id,
      status: extensionConnections.status,
      userId: extensionConnections.userId,
      clientMetadata: extensionConnections.clientMetadata,
      pairingExpiresAt: extensionConnections.pairingExpiresAt,
      credentialExpiresAt: extensionConnections.credentialExpiresAt,
      approvedAt: extensionConnections.approvedAt,
      activatedAt: extensionConnections.activatedAt,
      cancelledAt: extensionConnections.cancelledAt,
      revokedAt: extensionConnections.revokedAt,
    })
    .from(extensionConnections)
    .where(where)
    .limit(1);
}

async function findExtensionUser(userId: string): Promise<ExtensionUser | null> {
  const [owner] = await db
    .select({id: user.id, name: user.name, email: user.email, image: user.image})
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return owner ?? null;
}

async function revokeReplacedInstallationConnections(connection: ConnectionState, nowIso: string) {
  const metadata = parseExtensionClientMetadata(connection.clientMetadata);
  if (!metadata || !connection.userId) return;

  try {
    await db
      .update(extensionConnections)
      .set({status: "revoked", revokedAt: nowIso, updatedAt: nowIso})
      .where(
        and(
          eq(extensionConnections.userId, connection.userId),
          eq(extensionConnections.status, "active"),
          ne(extensionConnections.id, connection.id),
          sql`${extensionConnections.clientMetadata}->>'installationId' = ${metadata.installationId}`,
        ),
      );
  } catch (error) {
    logger.error("Failed to revoke a replaced extension connection", {error: toLogError(error)});
  }
}

function gtIso(column: typeof extensionConnections.pairingExpiresAt, value: string) {
  return sql`${column} > ${value}`;
}
