const configuredTobiraAppUrl = import.meta.env.WXT_TOBIRA_APP_URL?.trim();
const defaultTobiraAppUrl = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://tobira.app";

function normalizeTobiraAppUrl(value: string): string {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("WXT_TOBIRA_APP_URL must use HTTP or HTTPS");
  }

  if (url.username || url.password) {
    throw new Error("WXT_TOBIRA_APP_URL must not contain credentials");
  }

  return url.toString().replace(/\/$/, "");
}

export const TOBIRA_APP_URL = normalizeTobiraAppUrl(
  configuredTobiraAppUrl || defaultTobiraAppUrl,
);

export function buildTobiraUrl(path: string): string {
  return new URL(path, `${TOBIRA_APP_URL}/`).toString();
}
