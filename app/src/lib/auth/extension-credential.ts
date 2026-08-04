import {and, eq, gt, isNull, or} from "drizzle-orm";

import {db} from "@/db";
import {extensionConnections, user} from "@/db/schema";
import {EXTENSION_CREDENTIAL_PATTERN, hashExtensionCredential} from "@/lib/extension/pairings";
import {enforceExtensionConnectionRateLimit} from "@/lib/rate-limit/extension-pairings";
import {UnauthorizedError} from "@/lib/shared/errors";
import {getIp} from "@/lib/utils/ip";

export const EXTENSION_CREDENTIAL_HEADER = "x-api-key";

export type ExtensionCredentialPrincipal = {
  connectionId: string;
  expiresAt: string | null;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export async function requireExtensionCredential(
  request: Request,
): Promise<ExtensionCredentialPrincipal> {
  const credential = request.headers.get(EXTENSION_CREDENTIAL_HEADER)?.trim();
  if (!credential || !EXTENSION_CREDENTIAL_PATTERN.test(credential)) {
    throw new UnauthorizedError();
  }

  const credentialHash = hashExtensionCredential(credential);
  await enforceExtensionConnectionRateLimit(await getIp(), credentialHash);

  const now = new Date().toISOString();
  const [connection] = await db
    .select({
      connectionId: extensionConnections.id,
      expiresAt: extensionConnections.credentialExpiresAt,
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(extensionConnections)
    .innerJoin(user, eq(user.id, extensionConnections.userId))
    .where(
      and(
        eq(extensionConnections.credentialHash, credentialHash),
        eq(extensionConnections.status, "active"),
        isNull(extensionConnections.revokedAt),
        or(
          isNull(extensionConnections.credentialExpiresAt),
          gt(extensionConnections.credentialExpiresAt, now),
        ),
      ),
    )
    .limit(1);

  if (!connection) {
    throw new UnauthorizedError();
  }

  await db
    .update(extensionConnections)
    .set({lastUsedAt: now, updatedAt: now})
    .where(
      and(
        eq(extensionConnections.id, connection.connectionId),
        eq(extensionConnections.status, "active"),
      ),
    );

  return {
    connectionId: connection.connectionId,
    expiresAt: connection.expiresAt,
    userId: connection.userId,
    user: {
      id: connection.userId,
      name: connection.name,
      email: connection.email,
      image: connection.image,
    },
  };
}
