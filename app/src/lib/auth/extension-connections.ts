import {and, desc, eq, gt, isNull, or} from "drizzle-orm";

import {db} from "@/db";
import {apikey} from "@/db/schema";
import {EXTENSION_API_KEY_CONFIG_ID} from "@/lib/auth/auth";
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
      id: apikey.id,
      name: apikey.name,
      metadata: apikey.metadata,
      createdAt: apikey.createdAt,
      lastRequest: apikey.lastRequest,
      expiresAt: apikey.expiresAt,
    })
    .from(apikey)
    .where(
      and(
        eq(apikey.referenceId, userId),
        eq(apikey.configId, EXTENSION_API_KEY_CONFIG_ID),
        eq(apikey.enabled, true),
        or(isNull(apikey.expiresAt), gt(apikey.expiresAt, now)),
      ),
    )
    .orderBy(desc(apikey.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? "Tobira extension",
    device: parseExtensionClientMetadata(parseJson(row.metadata)),
    createdAt: row.createdAt,
    lastRequest: row.lastRequest,
    expiresAt: row.expiresAt,
  }));
}

export async function revokeExtensionConnection(userId: string, apiKeyId: string) {
  const [revoked] = await db
    .update(apikey)
    .set({
      enabled: false,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(apikey.id, apiKeyId),
        eq(apikey.referenceId, userId),
        eq(apikey.configId, EXTENSION_API_KEY_CONFIG_ID),
        eq(apikey.enabled, true),
      ),
    )
    .returning({id: apikey.id});

  return revoked !== undefined;
}

function parseJson(value: string | null): unknown {
  if (!value) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
