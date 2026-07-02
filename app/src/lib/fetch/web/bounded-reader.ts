class BodyLimitExceededError extends Error {
  constructor(
    readonly limit: number,
    readonly bytesRead: number,
  ) {
    super(`Response body exceeds ${limit} byte limit (read ${bytesRead} bytes)`);
    this.name = "BodyLimitExceededError";
  }
}

type ReadableBody = {
  headers: Headers;
  body: ReadableStream<Uint8Array> | null;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
};

function tryParseContentLength(headers: Headers): number | null {
  const v = headers.get("content-length");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Stream a Response body as text, aborting if decoded bytes exceed `maxBytes`.
 * Checks `Content-Length` header first for early rejection.
 * Returns the complete accumulated text or throws when the limit is exceeded.
 */
export async function readTextWithLimit(response: ReadableBody, maxBytes: number): Promise<string> {
  const contentLength = tryParseContentLength(response.headers);
  if (contentLength !== null && contentLength > maxBytes) {
    await response.body?.cancel().catch(() => {});
    throw new BodyLimitExceededError(maxBytes, contentLength);
  }

  if (!response.body) {
    const text = await response.text();
    const bytesRead = Buffer.byteLength(text, "utf8");
    if (bytesRead > maxBytes) {
      throw new BodyLimitExceededError(maxBytes, bytesRead);
    }
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  let bytesRead = 0;

  try {
    while (true) {
      const {done, value} = await reader.read();
      if (value) {
        bytesRead += value.length;
        if (bytesRead > maxBytes) {
          await reader.cancel().catch(() => {});
          throw new BodyLimitExceededError(maxBytes, bytesRead);
        }
        result += decoder.decode(value, {stream: true});
      }
      if (done) {
        result += decoder.decode();
        break;
      }
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }

  return result;
}

/**
 * Stream a Response body into a Buffer, aborting if raw bytes exceed `maxBytes`.
 * Checks `Content-Length` header first for early rejection.
 * Validates `Content-Type` against `allowedTypes` before reading (pass empty array to skip).
 */
export async function readBufferWithLimit(
  response: ReadableBody,
  maxBytes: number,
  allowedTypes: string[] = [],
): Promise<Buffer> {
  const contentLength = tryParseContentLength(response.headers);
  if (contentLength !== null && contentLength > maxBytes) {
    await response.body?.cancel().catch(() => {});
    throw new BodyLimitExceededError(maxBytes, contentLength);
  }

  if (allowedTypes.length > 0) {
    const ct =
      (response.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
    if (!allowedTypes.includes(ct)) {
      await response.body?.cancel().catch(() => {});
      throw new Error(`Unexpected content type: ${ct || "unknown"}`);
    }
  }

  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) {
      throw new BodyLimitExceededError(maxBytes, buffer.length);
    }
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;

  try {
    while (true) {
      const {done, value} = await reader.read();
      if (value) {
        bytesRead += value.length;
        if (bytesRead > maxBytes) {
          await reader.cancel().catch(() => {});
          throw new BodyLimitExceededError(maxBytes, bytesRead);
        }
        chunks.push(value);
      }
      if (done) break;
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }

  return Buffer.concat(chunks);
}

export {BodyLimitExceededError};
