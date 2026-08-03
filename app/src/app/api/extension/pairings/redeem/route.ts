import {and, eq, gt, isNull, isNotNull} from "drizzle-orm";
import {NextResponse} from "next/server";

import {auth, EXTENSION_API_KEY_CONFIG_ID} from "@/lib/auth/auth";
import {db} from "@/db";
import {apikey, extensionPairings, user} from "@/db/schema";
import {
  enforceExtensionPairingRedeemRateLimit,
  ExtensionPairingRateLimitError,
  ExtensionPairingRateLimitUnavailableError,
} from "@/lib/rate-limit/extension-pairings";
import {hashExtensionPairingSecret} from "@/lib/extension/pairings";
import {parseExtensionClientMetadata} from "@/lib/extension/device-metadata";
import {logger, toLogError} from "@/lib/shared/logger";
import {getIp} from "@/lib/utils/ip";

export const runtime = "nodejs";

const EXTENSION_API_KEY_NAME = "Tobira Chrome extension";
const EXTENSION_DEVICE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const NO_STORE_HEADERS = {"cache-control": "no-store"};

type PairingState = {
  apiKeyId: string | null;
  approvedAt: string | null;
  cancelledAt: string | null;
  claimedAt: string | null;
  expiresAt: string;
  redeemedAt: string | null;
  userId: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request);
    if (!body) {
      return jsonError("A valid device token is required", 400);
    }

    const deviceTokenHash = hashExtensionPairingSecret(body.deviceToken, "device");
    await enforceExtensionPairingRedeemRateLimit(await getIp(), deviceTokenHash);

    const now = new Date();
    const nowIso = now.toISOString();
    const claimedPairing = await claimPairing(deviceTokenHash, nowIso);

    if (!claimedPairing) {
      return respondForPairingState(await findPairing(deviceTokenHash), now);
    }

    if (!claimedPairing.userId) {
      await releasePairingClaim(claimedPairing.id, nowIso);
      return jsonError("The pairing is not associated with an account", 409);
    }

    const clientMetadata = parseExtensionClientMetadata(claimedPairing.clientMetadata);
    if (!clientMetadata) {
      await releasePairingClaim(claimedPairing.id, nowIso);
      return jsonError("The pairing device metadata is invalid", 409);
    }

    const [pairingUser] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, claimedPairing.userId))
      .limit(1);

    if (!pairingUser) {
      await releasePairingClaim(claimedPairing.id, nowIso);
      return jsonError("The pairing account could not be found", 409);
    }

    let createdApiKey: Awaited<ReturnType<typeof auth.api.createApiKey>>;

    try {
      createdApiKey = await auth.api.createApiKey({
        body: {
          configId: EXTENSION_API_KEY_CONFIG_ID,
          userId: claimedPairing.userId,
          name: EXTENSION_API_KEY_NAME,
          metadata: {
            source: "chrome-extension",
            pairingId: claimedPairing.id,
            ...clientMetadata,
            connectedAt: nowIso,
          },
        },
      });
    } catch (error) {
      await releasePairingClaim(claimedPairing.id, nowIso);
      throw error;
    }

    const redeemedAt = new Date().toISOString();
    let redeemedPairing: {id: string} | undefined;

    try {
      [redeemedPairing] = await db
        .update(extensionPairings)
        .set({
          apiKeyId: createdApiKey.id,
          redeemedAt,
          updatedAt: redeemedAt,
        })
        .where(
          and(
            eq(extensionPairings.id, claimedPairing.id),
            eq(extensionPairings.claimedAt, nowIso),
            isNull(extensionPairings.apiKeyId),
            isNull(extensionPairings.redeemedAt),
          ),
        )
        .returning({id: extensionPairings.id});
    } catch (error) {
      await deleteUnpublishedApiKey(createdApiKey.id, claimedPairing.userId);
      await releasePairingClaim(claimedPairing.id, nowIso);
      throw error;
    }

    if (!redeemedPairing) {
      await deleteUnpublishedApiKey(createdApiKey.id, claimedPairing.userId);
      await releasePairingClaim(claimedPairing.id, nowIso);
      return jsonError("The pairing could not be completed", 409);
    }

    return NextResponse.json(
      {
        status: "redeemed",
        apiKey: createdApiKey.key,
        apiKeyId: createdApiKey.id,
        expiresAt: createdApiKey.expiresAt?.toISOString() ?? null,
        user: pairingUser,
      },
      {headers: NO_STORE_HEADERS},
    );
  } catch (error) {
    if (error instanceof ExtensionPairingRateLimitError) {
      return NextResponse.json(
        {error: error.message},
        {
          status: 429,
          headers: {
            ...NO_STORE_HEADERS,
            "retry-after": String(error.retryAfterSeconds),
          },
        },
      );
    }

    if (error instanceof ExtensionPairingRateLimitUnavailableError) {
      return jsonError("Extension pairing is temporarily unavailable", 503);
    }

    logger.error("Extension pairing redemption failed", {error: toLogError(error)});
    return jsonError("Failed to redeem extension pairing", 500);
  }
}

async function readRequestBody(request: Request): Promise<{deviceToken: string} | null> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return null;
  }

  if (typeof body !== "object" || body === null || !("deviceToken" in body)) {
    return null;
  }

  const deviceToken = body.deviceToken;
  if (typeof deviceToken !== "string" || !EXTENSION_DEVICE_TOKEN_PATTERN.test(deviceToken)) {
    return null;
  }

  return {deviceToken};
}

async function claimPairing(deviceTokenHash: string, nowIso: string) {
  const [pairing] = await db
    .update(extensionPairings)
    .set({
      claimedAt: nowIso,
      updatedAt: nowIso,
    })
    .where(
      and(
        eq(extensionPairings.deviceTokenHash, deviceTokenHash),
        isNotNull(extensionPairings.userId),
        isNotNull(extensionPairings.approvedAt),
        isNull(extensionPairings.claimedAt),
        isNull(extensionPairings.redeemedAt),
        isNull(extensionPairings.cancelledAt),
        gt(extensionPairings.expiresAt, nowIso),
      ),
    )
    .returning({
      id: extensionPairings.id,
      clientMetadata: extensionPairings.clientMetadata,
      expiresAt: extensionPairings.expiresAt,
      userId: extensionPairings.userId,
    });

  return pairing ?? null;
}

async function findPairing(deviceTokenHash: string): Promise<PairingState | null> {
  const [pairing] = await db
    .select({
      apiKeyId: extensionPairings.apiKeyId,
      approvedAt: extensionPairings.approvedAt,
      cancelledAt: extensionPairings.cancelledAt,
      claimedAt: extensionPairings.claimedAt,
      expiresAt: extensionPairings.expiresAt,
      redeemedAt: extensionPairings.redeemedAt,
      userId: extensionPairings.userId,
    })
    .from(extensionPairings)
    .where(eq(extensionPairings.deviceTokenHash, deviceTokenHash))
    .limit(1);

  return pairing ?? null;
}

function respondForPairingState(pairing: PairingState | null, now: Date) {
  if (!pairing) return jsonError("Pairing not found", 404);
  if (pairing.cancelledAt) return jsonError("Pairing was cancelled", 410);
  if (new Date(pairing.expiresAt).getTime() <= now.getTime()) {
    return jsonError("Pairing expired", 410);
  }
  if (pairing.redeemedAt || pairing.apiKeyId) {
    return jsonError("Pairing already redeemed", 409);
  }

  return NextResponse.json({status: "pending"}, {status: 202, headers: NO_STORE_HEADERS});
}

async function releasePairingClaim(pairingId: string, claimedAt: string) {
  try {
    await db
      .update(extensionPairings)
      .set({claimedAt: null, updatedAt: new Date().toISOString()})
      .where(
        and(
          eq(extensionPairings.id, pairingId),
          eq(extensionPairings.claimedAt, claimedAt),
          isNull(extensionPairings.apiKeyId),
          isNull(extensionPairings.redeemedAt),
        ),
      );
  } catch (error) {
    logger.error("Failed to release extension pairing claim", {error: toLogError(error)});
  }
}

async function deleteUnpublishedApiKey(apiKeyId: string, userId: string) {
  try {
    await db
      .delete(apikey)
      .where(
        and(
          eq(apikey.id, apiKeyId),
          eq(apikey.referenceId, userId),
          eq(apikey.configId, EXTENSION_API_KEY_CONFIG_ID),
        ),
      );
  } catch (error) {
    logger.error("Failed to remove unpublished extension API key", {error: toLogError(error)});
  }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({error: message}, {status, headers: NO_STORE_HEADERS});
}
