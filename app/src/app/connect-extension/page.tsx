import type {Metadata} from "next";

import {
  EXTENSION_PAIRING_CODE_PATTERN,
  normalizeExtensionPairingCode,
} from "@/lib/extension/pairings";
import {
  ConnectExtensionView,
  type ConnectExtensionViewState,
} from "./_components/ConnectExtensionView";

export const metadata: Metadata = {
  title: "Connect Tobira Extension - Tobira",
  description: "Connect the Tobira browser extension to your account.",
};

type ConnectExtensionSearchParams = {
  code?: string | string[];
};

function getViewState(codeParam: ConnectExtensionSearchParams["code"]): ConnectExtensionViewState {
  if (!codeParam) {
    return {kind: "missing-code"};
  }

  if (Array.isArray(codeParam)) {
    return {kind: "invalid-code"};
  }

  const normalizedCode = normalizeExtensionPairingCode(codeParam);

  if (!EXTENSION_PAIRING_CODE_PATTERN.test(normalizedCode)) {
    return {kind: "invalid-code"};
  }

  return {
    kind: "pending",
    code: `${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4)}`,
  };
}

export default async function ConnectExtensionPage({
  searchParams,
}: {
  searchParams: Promise<ConnectExtensionSearchParams>;
}) {
  const {code} = await searchParams;

  return <ConnectExtensionView state={getViewState(code)} />;
}
