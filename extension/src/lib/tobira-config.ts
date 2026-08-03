import {
  DEVELOPMENT_TOBIRA_APP_URL,
  PRODUCTION_TOBIRA_APP_URL,
} from "@/lib/tobira-origins";

export const TOBIRA_APP_URL = import.meta.env.DEV
  ? DEVELOPMENT_TOBIRA_APP_URL
  : PRODUCTION_TOBIRA_APP_URL;

export const TOBIRA_APP_ORIGIN = new URL(TOBIRA_APP_URL).origin;
export const TOBIRA_APP_MATCH_PATTERN = `${TOBIRA_APP_ORIGIN}/*`;

export function buildTobiraUrl(path: string): string {
  return new URL(path, `${TOBIRA_APP_URL}/`).toString();
}

export function isTobiraAppUrl(value: string): boolean {
  try {
    return new URL(value).origin === TOBIRA_APP_ORIGIN;
  } catch {
    return false;
  }
}
