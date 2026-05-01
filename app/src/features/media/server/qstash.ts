import {Receiver} from "@upstash/qstash";
import {NextRequest} from "next/server";
import {uploadToR2} from "@/lib/storage/r2-storage";

function getQstashReceiver() {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    throw new Error("Missing QSTASH_CURRENT_SIGNING_KEY or QSTASH_NEXT_SIGNING_KEY");
  }
  return new Receiver({currentSigningKey, nextSigningKey});
}

export async function verifyQstashRequest(request: NextRequest, rawBody: string): Promise<boolean> {
  const signature = request.headers.get("Upstash-Signature");
  if (!signature) return false;

  const url = new URL(request.url);
  url.search = "";
  url.hash = "";

  try {
    const receiver = getQstashReceiver();
    return await receiver.verify({signature, body: rawBody, url: url.toString()});
  } catch {
    return false;
  }
}

export function buildTwitterSizedUrl(
  url: string,
  size: "small" | "medium" | "large",
): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("pbs.twimg.com")) return null;
    u.searchParams.set("name", size);
    return u.toString();
  } catch {
    return null;
  }
}

export async function downloadAndUploadToR2(
  sourceUrl: string,
  r2Key: string,
): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl, {cache: "no-store"});
    if (!res.ok) return null;

    const contentTypeRaw = res.headers.get("content-type") ?? "image/jpeg";
    const contentType = contentTypeRaw.split(";")[0] ?? "image/jpeg";

    await uploadToR2({
      key: r2Key,
      body: Buffer.from(await res.arrayBuffer()),
      contentType,
    });

    return r2Key;
  } catch {
    return null;
  }
}
