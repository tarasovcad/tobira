import {NextResponse} from "next/server";

import {revokeExtensionConnection} from "@/lib/auth/extension-connections";
import {requireExtensionCredential} from "@/lib/auth/extension-credential";
import {
  ExtensionPairingRateLimitError,
  ExtensionPairingRateLimitUnavailableError,
} from "@/lib/rate-limit/extension-pairings";
import {isAppError} from "@/lib/shared/errors";
import {logger, toLogError} from "@/lib/shared/logger";

export const runtime = "nodejs";

const NO_STORE_HEADERS = {"cache-control": "no-store"};
export async function GET(request: Request) {
  try {
    const principal = await requireExtensionCredential(request);

    return NextResponse.json(
      {
        user: principal.user,
        apiKeyId: principal.connectionId,
        expiresAt: principal.expiresAt,
      },
      {headers: NO_STORE_HEADERS},
    );
  } catch (error) {
    return handleConnectionError(error, "reading extension connection");
  }
}

export async function DELETE(request: Request) {
  try {
    const principal = await requireExtensionCredential(request);

    await revokeExtensionConnection(principal.userId, principal.connectionId);

    return NextResponse.json({revoked: true}, {headers: NO_STORE_HEADERS});
  } catch (error) {
    return handleConnectionError(error, "revoking extension connection");
  }
}

function handleConnectionError(error: unknown, operation: string) {
  if (error instanceof ExtensionPairingRateLimitError) {
    return NextResponse.json(
      {error: error.message, code: "RATE_LIMITED"},
      {
        status: 429,
        headers: {...NO_STORE_HEADERS, "retry-after": String(error.retryAfterSeconds)},
      },
    );
  }

  if (error instanceof ExtensionPairingRateLimitUnavailableError) {
    return NextResponse.json(
      {error: "Extension connection temporarily unavailable", code: "RATE_LIMIT_UNAVAILABLE"},
      {status: 503, headers: NO_STORE_HEADERS},
    );
  }

  if (isAppError(error)) {
    return NextResponse.json(
      {error: error.message, code: error.code},
      {status: error.statusCode, headers: NO_STORE_HEADERS},
    );
  }

  logger.error(`Failed ${operation}`, {error: toLogError(error)});
  return NextResponse.json(
    {error: "Extension connection unavailable"},
    {status: 500, headers: NO_STORE_HEADERS},
  );
}
