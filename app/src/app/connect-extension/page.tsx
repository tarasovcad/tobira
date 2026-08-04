import type {Metadata} from "next";
import {redirect} from "next/navigation";

import {getCurrentUserId} from "@/lib/auth/session";
import {getLoginPath} from "@/lib/auth/redirect";
import {getExtensionPairingViewState} from "@/lib/extension/connections";
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

async function getViewState(
  codeParam: ConnectExtensionSearchParams["code"],
): Promise<ConnectExtensionViewState> {
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

  const code = `${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4)}`;
  const state = await getExtensionPairingViewState(code);

  if (state.kind === "pending") return {kind: "pending", code};
  if (state.kind === "approved") return {kind: "approved"};
  if (state.kind === "connected") return {kind: "connected"};

  return state;
}

export default async function ConnectExtensionPage({
  searchParams,
}: {
  searchParams: Promise<ConnectExtensionSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const userId = await getCurrentUserId();

  if (!userId) {
    const destinationParams = new URLSearchParams();
    if (typeof resolvedSearchParams.code === "string") {
      destinationParams.set("code", resolvedSearchParams.code);
    }

    const returnTo = `/connect-extension${
      destinationParams.size > 0 ? `?${destinationParams.toString()}` : ""
    }`;
    redirect(getLoginPath(returnTo));
  }

  const {code} = resolvedSearchParams;

  return <ConnectExtensionView state={await getViewState(code)} />;
}
