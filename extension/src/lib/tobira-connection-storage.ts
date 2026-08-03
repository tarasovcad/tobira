import { browser } from "wxt/browser";
import { storage } from "wxt/utils/storage";

export type TobiraDeviceMetadata = {
  installationId: string;
  browser: "chrome";
  os: string;
  architecture: string;
  extensionVersion: string;
};

export type TobiraConnectionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type TobiraConnection = {
  apiKey: string;
  apiKeyId: string;
  user: TobiraConnectionUser;
  expiresAt: string | null;
  confirmationPending: boolean;
  connectedAt: string;
};

export type TobiraPendingPairing = {
  deviceToken: string;
  userCode: string;
  verificationUrl: string;
  verificationUrlComplete: string;
  expiresAt: string;
  pollIntervalMs: number;
};

export const tobiraInstallation = storage.defineItem<TobiraDeviceMetadata | null>(
  "local:tobiraInstallation",
  { fallback: null },
);

export const tobiraConnection = storage.defineItem<TobiraConnection | null>(
  "local:tobiraConnection",
  { fallback: null },
);

export const tobiraPendingPairing =
  storage.defineItem<TobiraPendingPairing | null>(
    "local:tobiraPendingPairing",
    { fallback: null },
  );

export async function restrictTobiraStorageAccess() {
  await browser.storage.local.setAccessLevel({
    accessLevel: "TRUSTED_CONTEXTS",
  });
}

export async function getTobiraDeviceMetadata(): Promise<TobiraDeviceMetadata> {
  const existing = await tobiraInstallation.getValue();
  const platform = await browser.runtime.getPlatformInfo();
  const manifest = browser.runtime.getManifest();

  const metadata: TobiraDeviceMetadata = {
    installationId: existing?.installationId ?? crypto.randomUUID(),
    browser: "chrome",
    os: platform.os,
    architecture: platform.arch,
    extensionVersion: manifest.version,
  };

  if (JSON.stringify(existing) !== JSON.stringify(metadata)) {
    await tobiraInstallation.setValue(metadata);
  }

  return metadata;
}
