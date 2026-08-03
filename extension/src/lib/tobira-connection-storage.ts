import { browser } from "wxt/browser";
import { storage } from "wxt/utils/storage";

import {
  parseTobiraStoredAuth,
  type TobiraStoredAuth,
} from "@/lib/tobira-contracts";
import { isTobiraAppUrl } from "@/lib/tobira-config";

export type TobiraDeviceMetadata = {
  installationId: string;
  browser: "chrome";
  os: string;
  architecture: string;
  extensionVersion: string;
};

export type TobiraAuthStore = {
  get(): Promise<TobiraStoredAuth | null>;
  set(value: TobiraStoredAuth | null): Promise<void>;
};

const tobiraInstallation = storage.defineItem<TobiraDeviceMetadata | null>(
  "local:tobiraInstallation",
  { fallback: null },
);

const tobiraAuth = storage.defineItem<unknown>("local:tobiraAuth", {
  fallback: null,
});

export const browserTobiraAuthStore: TobiraAuthStore = {
  async get() {
    const value = await tobiraAuth.getValue();
    if (value === null) return null;

    const auth = parseTobiraStoredAuth(value);
    if (
      !auth ||
      (auth.kind === "pairing" &&
        !isTobiraAppUrl(auth.pairing.verificationUrlComplete))
    ) {
      await tobiraAuth.removeValue();
      return null;
    }

    if (JSON.stringify(value) !== JSON.stringify(auth)) {
      await tobiraAuth.setValue(auth);
    }

    return auth;
  },
  async set(value) {
    if (value === null) {
      await tobiraAuth.removeValue();
      return;
    }

    await tobiraAuth.setValue(value);
  },
};

export async function restrictTobiraStorageAccess(): Promise<void> {
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

  if (!hasSameDeviceMetadata(existing, metadata)) {
    await tobiraInstallation.setValue(metadata);
  }

  return metadata;
}

function hasSameDeviceMetadata(
  left: TobiraDeviceMetadata | null,
  right: TobiraDeviceMetadata,
): boolean {
  return (
    left?.installationId === right.installationId &&
    left.browser === right.browser &&
    left.os === right.os &&
    left.architecture === right.architecture &&
    left.extensionVersion === right.extensionVersion
  );
}
