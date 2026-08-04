import {and, desc, eq, gt, isNull, or} from "drizzle-orm";

import {db} from "@/db";
import {extensionConnections} from "@/db/schema";
import {
  parseExtensionClientMetadata,
  type ExtensionClientMetadata,
} from "@/lib/extension/device-metadata";

export type ExtensionConnection = {
  id: string;
  name: string;
  device: ExtensionClientMetadata | null;
  createdAt: string;
  lastRequest: string | null;
  expiresAt: string | null;
};

export async function listExtensionConnections(userId: string): Promise<ExtensionConnection[]> {
  const now = new Date().toISOString();
  const rows = await db
    .select({
      id: extensionConnections.id,
      name: extensionConnections.name,
      metadata: extensionConnections.clientMetadata,
      createdAt: extensionConnections.activatedAt,
      lastRequest: extensionConnections.lastUsedAt,
      expiresAt: extensionConnections.credentialExpiresAt,
    })
    .from(extensionConnections)
    .where(
      and(
        eq(extensionConnections.userId, userId),
        eq(extensionConnections.status, "active"),
        isNull(extensionConnections.revokedAt),
        or(
          isNull(extensionConnections.credentialExpiresAt),
          gt(extensionConnections.credentialExpiresAt, now),
        ),
      ),
    )
    .orderBy(desc(extensionConnections.activatedAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    device: parseExtensionClientMetadata(row.metadata),
    createdAt: row.createdAt ?? now,
    lastRequest: row.lastRequest,
    expiresAt: row.expiresAt,
  }));
}

export async function revokeExtensionConnection(userId: string, connectionId: string) {
  const now = new Date().toISOString();
  const [revoked] = await db
    .update(extensionConnections)
    .set({
      status: "revoked",
      revokedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(extensionConnections.id, connectionId),
        eq(extensionConnections.userId, userId),
        eq(extensionConnections.status, "active"),
        isNull(extensionConnections.revokedAt),
      ),
    )
    .returning({id: extensionConnections.id});

  return revoked !== undefined;
}
