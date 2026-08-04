import {createHash, createHmac, randomBytes, randomInt} from "node:crypto";

export const EXTENSION_PAIRING_PATH = "/connect-extension";
export const EXTENSION_PAIRING_TTL_MS = 5 * 60 * 1000;
export const EXTENSION_CREDENTIAL_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const EXTENSION_PAIRING_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;
export const EXTENSION_CREDENTIAL_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

const DEVICE_TOKEN_BYTES = 32;
const USER_CODE_LENGTH = 8;
const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type ExtensionPairingCredentials = {
  deviceToken: string;
  credentialHash: string;
  userCode: string;
  userCodeHash: string;
};

export type ExtensionPairingUrls = {
  verificationUrl: string;
  verificationUrlComplete: string;
};

export function generateExtensionPairingCredentials(): ExtensionPairingCredentials {
  const deviceToken = randomBytes(DEVICE_TOKEN_BYTES).toString("base64url");
  const userCode = formatExtensionPairingCode(generateExtensionPairingCode());

  return {
    deviceToken,
    credentialHash: hashExtensionCredential(deviceToken),
    userCode,
    userCodeHash: hashExtensionPairingCode(userCode),
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

export function hashExtensionCredential(credential: string) {
  return createHash("sha256").update(credential, "utf8").digest("base64url");
}

export function hashExtensionPairingCode(code: string) {
  return createHmac("sha256", getPairingHashSecret())
    .update(`tobira:extension-pairing:user-code:${normalizeExtensionPairingCode(code)}`, "utf8")
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

  appUrl.search = "";
  appUrl.hash = "";
  return appUrl;
}

function getPairingHashSecret() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required for extension pairing");
  }

  return secret;
}
