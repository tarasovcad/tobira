import {Receiver} from "@upstash/qstash";
import type {NextRequest} from "next/server";
import {readTextWithLimit} from "@/lib/fetch/web/bounded-reader";
import {isRecord} from "@/lib/fetch/web/http";

const QSTASH_BODY_MAX_BYTES = 64 * 1024;

export type WebsiteJobRequest =
  | {ok: true; bookmarkId: string; qstashVerifyMs: number}
  | {ok: false; status: 400 | 401; error: "Missing id" | "Unauthorized"; qstashVerifyMs: number};

export type WebsiteBatchJobRequest =
  | {ok: true; bookmarkIds: string[]; qstashVerifyMs: number}
  | {
      ok: false;
      status: 400 | 401;
      error: "Missing bookmarkIds" | "Unauthorized";
      qstashVerifyMs: number;
    };

export async function readWebsiteJobRequest(request: NextRequest): Promise<WebsiteJobRequest> {
  const rawBody = await readTextWithLimit(request, QSTASH_BODY_MAX_BYTES).catch(() => "");

  const qstashVerifyStartedAt = performance.now();
  const verified = await verifyQstashRequest(request, rawBody);
  const qstashVerifyMs = Math.round(performance.now() - qstashVerifyStartedAt);

  if (!verified) {
    return {ok: false, status: 401, error: "Unauthorized", qstashVerifyMs};
  }

  const bookmarkId = parseWebsiteJobPayload(request.nextUrl.searchParams.get("id"), rawBody);

  return bookmarkId
    ? {ok: true, bookmarkId, qstashVerifyMs}
    : {ok: false, status: 400, error: "Missing id", qstashVerifyMs};
}

export async function readWebsiteBatchJobRequest(
  request: NextRequest,
): Promise<WebsiteBatchJobRequest> {
  const rawBody = await readTextWithLimit(request, QSTASH_BODY_MAX_BYTES).catch(() => "");

  const qstashVerifyStartedAt = performance.now();
  const verified = await verifyQstashRequest(request, rawBody);
  const qstashVerifyMs = Math.round(performance.now() - qstashVerifyStartedAt);

  if (!verified) {
    return {ok: false, status: 401, error: "Unauthorized", qstashVerifyMs};
  }

  const bookmarkIds = parseWebsiteBatchJobPayload(rawBody);

  return bookmarkIds && bookmarkIds.length > 0
    ? {ok: true, bookmarkIds, qstashVerifyMs}
    : {ok: false, status: 400, error: "Missing bookmarkIds", qstashVerifyMs};
}

export function parseWebsiteJobPayload(queryId: string | null, rawBody: string) {
  if (queryId) return queryId;
  if (!rawBody) return undefined;

  try {
    const parsed: unknown = JSON.parse(rawBody);
    return isRecord(parsed) && typeof parsed.id === "string" ? parsed.id : undefined;
  } catch {
    return undefined;
  }
}

export function parseWebsiteBatchJobPayload(rawBody: string): string[] | undefined {
  if (!rawBody) return undefined;

  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!isRecord(parsed)) return undefined;
    if (Array.isArray(parsed.bookmarkIds)) {
      const ids = parsed.bookmarkIds.filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0,
      );
      return ids.length > 0 ? ids : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function verifyQstashRequest(request: NextRequest, rawBody: string) {
  const signature = request.headers.get("Upstash-Signature");
  if (!signature) return false;

  const url = new URL(request.url);
  url.search = "";
  url.hash = "";

  try {
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
    if (!currentSigningKey || !nextSigningKey) return false;

    const receiver = new Receiver({currentSigningKey, nextSigningKey});
    return await receiver.verify({
      signature,
      body: rawBody,
      url: url.toString(),
    });
  } catch {
    return false;
  }
}
