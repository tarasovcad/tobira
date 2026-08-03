import {createHash, randomBytes, randomInt} from "node:crypto";

export const EXTENSION_PAIRING_PATH = "/connect-extension";
export const EXTENSION_PAIRING_TTL_MS = 5 * 60 * 1000;
export const EXTENSION_PAIRING_POLL_INTERVAL_MS = 5 * 1000;

const DEVICE_TOKEN_BYTES = 32;
const USER_CODE_LENGTH = 8;
const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type ExtensionPairingCredentials = {
  deviceToken: string;
  deviceTokenHash: string;
  userCode: string;
  userCodeHash: string;
};

export type ExtensionPairingUrls = {
  verificationUrl: string;
  verificationUrlComplete: string;
};

// Return plaintext only to the caller; the database receives hashes below.
export function generateExtensionPairingCredentials(): ExtensionPairingCredentials {
  const deviceToken = randomBytes(DEVICE_TOKEN_BYTES).toString("base64url");
  const userCode = formatExtensionPairingCode(generateExtensionPairingCode());

  return {
    deviceToken,
    deviceTokenHash: hashExtensionPairingSecret(deviceToken, "device"),
    userCode,
    userCodeHash: hashExtensionPairingSecret(userCode, "user-code"),
  };
}

export function buildExtensionPairingUrls(userCode: string): ExtensionPairingUrls {
  const appUrl = getApplicationUrl();
  const verificationUrl = new URL(EXTENSION_PAIRING_PATH, appUrl);
  const verificationUrlComplete = new URL(verificationUrl);
  verificationUrlComplete.searchParams.set("code", userCode);

  return {
    verificationUrl: verificationUrl.toString(),
    verificationUrlComplete: verificationUrlComplete.toString(),
  };
}

export function hashExtensionPairingSecret(secret: string, kind: "device" | "user-code") {
  const canonicalSecret = kind === "user-code" ? normalizeExtensionPairingCode(secret) : secret;

  // Keep device tokens and display codes in separate hash domains.
  return createHash("sha256")
    .update(`tobira:extension-pairing:${kind}:${canonicalSecret}`, "utf8")
    .digest("base64url");
}

export function normalizeExtensionPairingCode(code: string): string {
  return code.replace(/-/g, "").trim().toUpperCase();
}

function generateExtensionPairingCode(): string {
  return Array.from({length: USER_CODE_LENGTH}, () => {
    const index = randomInt(0, USER_CODE_ALPHABET.length);
    return USER_CODE_ALPHABET.charAt(index);
  }).join("");
}

function formatExtensionPairingCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function getApplicationUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  let appUrl: URL;
  try {
    appUrl = new URL(configuredUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL is invalid");
  }

  if (appUrl.protocol !== "http:" && appUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTP or HTTPS");
  }

  if (appUrl.username || appUrl.password) {
    throw new Error("NEXT_PUBLIC_APP_URL must not contain credentials");
  }

  // Never build verification links from the request Host header.
  appUrl.search = "";
  appUrl.hash = "";
  return appUrl;
}
