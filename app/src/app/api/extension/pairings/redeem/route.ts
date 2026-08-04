import {NextResponse} from "next/server";
import {z} from "zod";

import {redeemExtensionPairing} from "@/lib/extension/connections";
import {EXTENSION_CREDENTIAL_PATTERN, hashExtensionCredential} from "@/lib/extension/pairings";
import {
  enforceExtensionPairingRedeemRateLimit,
  ExtensionPairingRateLimitError,
  ExtensionPairingRateLimitUnavailableError,
} from "@/lib/rate-limit/extension-pairings";
import {logger, toLogError} from "@/lib/shared/logger";
import {getIp} from "@/lib/utils/ip";

export const runtime = "nodejs";

const NO_STORE_HEADERS = {"cache-control": "no-store"};
const redeemPairingSchema = z
  .object({
    deviceToken: z.string().regex(EXTENSION_CREDENTIAL_PATTERN),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request);
    if (!body) {
      return jsonError("A valid device token is required", "INVALID_DEVICE_TOKEN", 400);
    }

    const credentialHash = hashExtensionCredential(body.deviceToken);
    await enforceExtensionPairingRedeemRateLimit(await getIp(), credentialHash);

    const result = await redeemExtensionPairing(body.deviceToken);
    switch (result.kind) {
      case "pending":
        return NextResponse.json({status: "pending"}, {status: 202, headers: NO_STORE_HEADERS});
      case "redeemed":
        return NextResponse.json(
          {
            status: "redeemed",
            apiKey: body.deviceToken,
            apiKeyId: result.connectionId,
            expiresAt: result.credentialExpiresAt,
            user: result.user,
          },
          {headers: NO_STORE_HEADERS},
        );
      case "not-found":
        return jsonError("Pairing not found", "PAIRING_NOT_FOUND", 404);
      case "expired":
        return jsonError("Pairing expired", "PAIRING_EXPIRED", 410);
      case "cancelled":
        return jsonError("Pairing was cancelled", "PAIRING_CANCELLED", 410);
      case "revoked":
        return jsonError("Extension connection was revoked", "CONNECTION_REVOKED", 410);
      case "connection-expired":
        return jsonError("Extension connection expired", "CONNECTION_EXPIRED", 410);
      case "invalid-account":
        return jsonError("The pairing account could not be found", "PAIRING_ACCOUNT_INVALID", 409);
    }
  } catch (error) {
    if (error instanceof ExtensionPairingRateLimitError) {
      return NextResponse.json(
        {error: error.message, code: "RATE_LIMITED"},
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
      return jsonError(
        "Extension pairing is temporarily unavailable",
        "RATE_LIMIT_UNAVAILABLE",
        503,
      );
    }

    logger.error("Extension pairing redemption failed", {error: toLogError(error)});
    return jsonError("Failed to redeem extension pairing", "PAIRING_REDEEM_FAILED", 500);
  }
}

async function readRequestBody(
  request: Request,
): Promise<z.infer<typeof redeemPairingSchema> | null> {
  try {
    const result = redeemPairingSchema.safeParse(await request.json());
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function jsonError(message: string, code: string, status: number) {
  return NextResponse.json({error: message, code}, {status, headers: NO_STORE_HEADERS});
}
