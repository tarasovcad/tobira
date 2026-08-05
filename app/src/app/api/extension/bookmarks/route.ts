import {NextResponse} from "next/server";
import {z} from "zod";

import {requireExtensionCredential} from "@/lib/auth/extension-credential";
import {createWebsiteBookmark} from "@/lib/bookmarks/website/create";
import {normalizeInputUrl, UnsafeFetchUrlError} from "@/lib/fetch/web/url";
import {NonWebsiteUrlError, assertWebsiteUrl} from "@/lib/fetch/web/website-url";
import {
  ExtensionPairingRateLimitError,
  ExtensionPairingRateLimitUnavailableError,
} from "@/lib/rate-limit/extension-pairings";
import {
  enforceWebsiteBookmarkCreateRateLimit,
  WebsiteBookmarkRateLimitError,
  WebsiteBookmarkRateLimitUnavailableError,
} from "@/lib/rate-limit/website-bookmarks";
import {isAppError} from "@/lib/shared/errors";
import {logger, toLogError} from "@/lib/shared/logger";

export const runtime = "nodejs";

const NO_STORE_HEADERS = {"cache-control": "no-store"};

const extensionBookmarkRequestSchema = z
  .object({
    kind: z.literal("website"),
    url: z.string().trim().min(1),
  })
  .strict();

type ExtensionBookmarkRequest = z.infer<typeof extensionBookmarkRequestSchema>;

export async function POST(request: Request) {
  try {
    const principal = await requireExtensionCredential(request);
    const input = await readBookmarkRequest(request);

    if (!input) {
      return NextResponse.json(
        {
          error: "A website bookmark with a valid URL is required",
          code: "INVALID_BOOKMARK_REQUEST",
        },
        {status: 400, headers: NO_STORE_HEADERS},
      );
    }

    let normalizedUrl: URL;
    try {
      normalizedUrl = normalizeInputUrl(input.url);
      assertWebsiteUrl(normalizedUrl);
    } catch (error) {
      return NextResponse.json(
        {error: getWebsiteUrlErrorMessage(error), code: "INVALID_URL"},
        {status: 400, headers: NO_STORE_HEADERS},
      );
    }

    await enforceWebsiteBookmarkCreateRateLimit(principal.userId);

    const {id, url} = await createWebsiteBookmark({
      normalizedUrl,
      userId: principal.userId,
    });

    return NextResponse.json({ok: true, id, url}, {status: 201, headers: NO_STORE_HEADERS});
  } catch (error) {
    if (error instanceof WebsiteBookmarkRateLimitError) {
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

    if (error instanceof WebsiteBookmarkRateLimitUnavailableError) {
      return NextResponse.json(
        {
          error: "Website bookmark creation temporarily unavailable",
          code: "RATE_LIMIT_UNAVAILABLE",
        },
        {status: 503, headers: NO_STORE_HEADERS},
      );
    }

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
      return NextResponse.json(
        {error: "Extension authentication temporarily unavailable", code: "RATE_LIMIT_UNAVAILABLE"},
        {status: 503, headers: NO_STORE_HEADERS},
      );
    }

    if (isAppError(error)) {
      return NextResponse.json(
        {error: error.message, code: error.code},
        {status: error.statusCode, headers: NO_STORE_HEADERS},
      );
    }

    logger.error("Extension website bookmark creation failed", {
      error: toLogError(error),
    });
    return NextResponse.json(
      {
        error: "Failed to create website bookmark",
        code: "BOOKMARK_CREATE_FAILED",
      },
      {status: 500, headers: NO_STORE_HEADERS},
    );
  }
}

async function readBookmarkRequest(request: Request): Promise<ExtensionBookmarkRequest | null> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return null;
  }

  const result = extensionBookmarkRequestSchema.safeParse(body);
  return result.success ? result.data : null;
}

function getWebsiteUrlErrorMessage(error: unknown): string {
  if (error instanceof NonWebsiteUrlError) return error.message;

  if (error instanceof UnsafeFetchUrlError) {
    if (error.message === "Hostname is not allowed") {
      return "URL must use a public hostname";
    }
    if (error.message === "Only default HTTP/HTTPS ports are supported") {
      return "URL must use the default HTTP/HTTPS port";
    }
    if (error.message === "URL credentials are not allowed") {
      return "URL cannot contain a username or password";
    }
    return error.message;
  }

  return "Please provide a valid website URL";
}
