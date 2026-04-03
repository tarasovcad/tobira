// ─── Centralised Server Logger ───────────────────────────────────────────────
// Rule: always log full error server-side; never expose stack traces to the client.

type Level = "info" | "warn" | "error" | "debug";
type Payload = Record<string, unknown>;

function log(level: Level, message: string, payload?: Payload) {
  if (process.env.NODE_ENV === "test") return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...payload,
  };

  const serialised = JSON.stringify(entry, null, process.env.NODE_ENV === "development" ? 2 : 0);

  // Use explicit calls to avoid dynamic property access lint warnings
  switch (level) {
    case "debug":
      console.debug(serialised);
      break;
    case "info":
      console.info(serialised);
      break;
    case "warn":
      console.warn(serialised);
      break;
    case "error":
      console.error(serialised);
      break;
  }
}

export const logger = {
  info: (msg: string, payload?: Payload) => log("info", msg, payload),
  warn: (msg: string, payload?: Payload) => log("warn", msg, payload),
  error: (msg: string, payload?: Payload) => log("error", msg, payload),
  debug: (msg: string, payload?: Payload) => log("debug", msg, payload),
};
