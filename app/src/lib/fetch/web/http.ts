export async function fetchTextWithTimeout(
  url: string,
  timeoutMs: number,
  options?: {userAgent?: string; accept?: string},
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        accept:
          options?.accept ?? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": options?.userAgent ?? "void/1.0",
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number,
  options?: {userAgent?: string; accept?: string},
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        accept: options?.accept ?? "application/json,text/json,*/*;q=0.8",
        "user-agent": options?.userAgent ?? "void/1.0",
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
