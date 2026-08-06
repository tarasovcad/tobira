import {NextResponse} from "next/server";
import {z} from "zod";

import {requireExtensionCredential} from "@/lib/auth/extension-credential";
import {createBulkWebsiteBookmarks} from "@/lib/bookmarks/website/create";
import {
  BULK_WEBSITE_MAX_URLS,
  normalizeBulkWebsiteUrls,
} from "@/lib/bookmarks/website/normalize-bulk-urls";
import {queueWebsiteBookmarkBatch} from "@/lib/bookmarks/website/queue";
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

const extensionBulkBookmarkRequestSchema = z
  .object({
    kind: z.literal("website"),
    urls: z
      .array(z.string())
      .min(1, "At least one URL is required")
      .max(BULK_WEBSITE_MAX_URLS, `Maximum ${BULK_WEBSITE_MAX_URLS} URLs allowed`),
  })
  .strict();

type ExtensionBulkBookmarkRequest = z.infer<typeof extensionBulkBookmarkRequestSchema>;

export async function POST(request: Request) {
  try {
    const principal = await requireExtensionCredential(request);
    const input = await readBulkBookmarkRequest(request);

    if (!input) {
      return NextResponse.json(
        {
          error: `A website bookmark batch with 1 to ${BULK_WEBSITE_MAX_URLS} URLs is required`,
          code: "INVALID_BOOKMARK_REQUEST",
        },
        {status: 400, headers: NO_STORE_HEADERS},
      );
    }

    const {accepted, rejected, duplicates} = normalizeBulkWebsiteUrls(input.urls);

    if (accepted.length === 0) {
      return NextResponse.json(
        {
          error: getAllInvalidUrlsMessage(rejected),
          code: "INVALID_URLS",
          rejected,
          duplicates,
        },
        {status: 400, headers: NO_STORE_HEADERS},
      );
    }

    await enforceWebsiteBookmarkCreateRateLimit(principal.userId);

    const {createdBookmarks} = await createBulkWebsiteBookmarks({
      normalizedUrls: accepted,
      userId: principal.userId,
    });

    const bookmarkIds = createdBookmarks.map((bookmark) => bookmark.id);

    try {
      await queueWebsiteBookmarkBatch(bookmarkIds, {
        deduplicationId: `bulk-website-batch-${bookmarkIds[0]}`,
      });
    } catch (error) {
      logger.error("Failed to queue extension bulk website bookmark batch", {
        bookmarkIds,
        error: toLogError(error),
      });
    }

    return NextResponse.json(
      {
        ok: true,
        bookmarks: createdBookmarks,
        rejected,
        duplicates,
      },
      {status: 201, headers: NO_STORE_HEADERS},
    );
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
        {
          error: "Extension authentication temporarily unavailable",
          code: "RATE_LIMIT_UNAVAILABLE",
        },
        {status: 503, headers: NO_STORE_HEADERS},
      );
    }

    if (isAppError(error)) {
      return NextResponse.json(
        {error: error.message, code: error.code},
        {status: error.statusCode, headers: NO_STORE_HEADERS},
      );
    }

    logger.error("Extension bulk website bookmark creation failed", {
      error: toLogError(error),
    });
    return NextResponse.json(
      {
        error: "Failed to create website bookmarks",
        code: "BULK_BOOKMARK_CREATE_FAILED",
      },
      {status: 500, headers: NO_STORE_HEADERS},
    );
  }
}

async function readBulkBookmarkRequest(
  request: Request,
): Promise<ExtensionBulkBookmarkRequest | null> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return null;
  }

  const result = extensionBulkBookmarkRequestSchema.safeParse(body);
  return result.success ? result.data : null;
}

function getAllInvalidUrlsMessage(rejected: Array<{reason: string}>): string {
  return rejected.length === 1
    ? `URL is invalid: ${rejected[0]!.reason}`
    : `All ${rejected.length} URLs are invalid. Please check each URL and try again.`;
}
