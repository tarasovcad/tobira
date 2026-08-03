import {NextResponse} from "next/server";
import {db} from "@/db";
import {extensionPairings} from "@/db/schema";
import {
  buildExtensionPairingUrls,
  EXTENSION_PAIRING_POLL_INTERVAL_MS,
  EXTENSION_PAIRING_TTL_MS,
  generateExtensionPairingCredentials,
} from "@/lib/extension/pairings";
import {
  enforceExtensionPairingCreateRateLimit,
  ExtensionPairingRateLimitError,
  ExtensionPairingRateLimitUnavailableError,
} from "@/lib/rate-limit/extension-pairings";
import {logger, toLogError} from "@/lib/shared/logger";
import {getIp} from "@/lib/utils/ip";
import {extensionClientMetadataSchema} from "@/lib/extension/device-metadata";

export const runtime = "nodejs";

const MAX_INSERT_ATTEMPTS = 3;
const NO_STORE_HEADERS = {"cache-control": "no-store"};

export async function POST(request: Request) {
  try {
    const clientMetadata = await readClientMetadata(request);
    if (!clientMetadata) {
      return NextResponse.json(
        {error: "Valid extension device metadata is required", code: "INVALID_METADATA"},
        {status: 400, headers: NO_STORE_HEADERS},
      );
    }

    const ip = await getIp();
    await enforceExtensionPairingCreateRateLimit(ip);

    const now = Date.now();
    const expiresAt = new Date(now + EXTENSION_PAIRING_TTL_MS).toISOString();

    for (let attempt = 0; attempt < MAX_INSERT_ATTEMPTS; attempt += 1) {
      const credentials = generateExtensionPairingCredentials();
      const urls = buildExtensionPairingUrls(credentials.userCode);

      try {
        // The API key is created only after the user approves this pairing.
        await db.insert(extensionPairings).values({
          userCodeHash: credentials.userCodeHash,
          deviceTokenHash: credentials.deviceTokenHash,
          clientMetadata,
          expiresAt,
        });

        return NextResponse.json(
          {
            deviceToken: credentials.deviceToken,
            userCode: credentials.userCode,
            verificationUrl: urls.verificationUrl,
            verificationUrlComplete: urls.verificationUrlComplete,
            expiresAt,
            pollIntervalMs: EXTENSION_PAIRING_POLL_INTERVAL_MS,
          },
          {status: 201, headers: NO_STORE_HEADERS},
        );
      } catch (error) {
        // Regenerate both secrets if a rare unique-code collision occurs.
        if (isUniqueViolation(error) && attempt < MAX_INSERT_ATTEMPTS - 1) {
          continue;
        }

        throw error;
      }
    }
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
      return NextResponse.json(
        {error: "Extension pairing is temporarily unavailable"},
        {status: 503, headers: NO_STORE_HEADERS},
      );
    }

    logger.error("Extension pairing creation failed", {error: toLogError(error)});
    return NextResponse.json(
      {error: "Failed to create extension pairing"},
      {status: 500, headers: NO_STORE_HEADERS},
    );
  }

  logger.error("Extension pairing creation exhausted insert attempts");
  return NextResponse.json(
    {error: "Failed to create extension pairing"},
    {status: 500, headers: NO_STORE_HEADERS},
  );
}

async function readClientMetadata(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return null;
  }

  if (typeof body !== "object" || body === null || !("clientMetadata" in body)) {
    return null;
  }

  const result = extensionClientMetadataSchema.safeParse(body.clientMetadata);
  return result.success ? result.data : null;
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  return error.code === "23505";
}
