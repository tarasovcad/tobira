import {NextResponse} from "next/server";

import {revokeExtensionConnection} from "@/lib/auth/extension-connections";
import {EXTENSION_API_KEY_PERMISSIONS, requireExtensionApiKey} from "@/lib/auth/extension-api-key";
import {isAppError} from "@/lib/shared/errors";
import {logger, toLogError} from "@/lib/shared/logger";

export const runtime = "nodejs";

const NO_STORE_HEADERS = {"cache-control": "no-store"};
export async function GET(request: Request) {
  try {
    const principal = await requireExtensionApiKey(
      request,
      EXTENSION_API_KEY_PERMISSIONS.accountRead,
    );

    return NextResponse.json(
      {
        user: principal.user,
        apiKeyId: principal.apiKeyId,
        expiresAt: principal.expiresAt?.toISOString() ?? null,
      },
      {headers: NO_STORE_HEADERS},
    );
  } catch (error) {
    return handleConnectionError(error, "reading extension connection");
  }
}

export async function DELETE(request: Request) {
  try {
    const principal = await requireExtensionApiKey(
      request,
      EXTENSION_API_KEY_PERMISSIONS.connectionDelete,
    );

    await revokeExtensionConnection(principal.userId, principal.apiKeyId);

    return NextResponse.json({revoked: true}, {headers: NO_STORE_HEADERS});
  } catch (error) {
    return handleConnectionError(error, "revoking extension connection");
  }
}

function handleConnectionError(error: unknown, operation: string) {
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
