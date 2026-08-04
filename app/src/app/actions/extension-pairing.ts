"use server";

import {redirect} from "next/navigation";

import {getCurrentUserId, requireAuthenticatedUserId} from "@/lib/auth/session";
import {
  approveExtensionPairingForUser,
  cancelExtensionPairing as cancelPairing,
} from "@/lib/extension/connections";
import {
  EXTENSION_PAIRING_CODE_PATTERN,
  normalizeExtensionPairingCode,
} from "@/lib/extension/pairings";
import {
  enforceExtensionPairingApprovalRateLimit,
  ExtensionPairingRateLimitError,
} from "@/lib/rate-limit/extension-pairings";
import {logger, toLogError} from "@/lib/shared/logger";
import type {ExtensionPairingApprovalState} from "./extension-pairing-state";

export async function approveExtensionPairing(
  _previousState: ExtensionPairingApprovalState,
  formData: FormData,
): Promise<ExtensionPairingApprovalState> {
  const code = readPairingCode(formData);
  if (!code) return {status: "invalid-code"};

  try {
    const userId = await getCurrentUserId();
    if (!userId) return {status: "unauthenticated"};

    await enforceExtensionPairingApprovalRateLimit(userId);
    const result = await approveExtensionPairingForUser(code, userId);
    return {status: result};
  } catch (error) {
    if (error instanceof ExtensionPairingRateLimitError) {
      return {status: "rate-limited"};
    }

    logger.error("Extension pairing approval failed", {error: toLogError(error)});
    return {status: "error"};
  }
}

export async function cancelExtensionPairing(formData: FormData): Promise<void> {
  const code = readPairingCode(formData);
  if (!code) redirect("/home");

  try {
    const userId = await requireAuthenticatedUserId();
    await enforceExtensionPairingApprovalRateLimit(userId);
    await cancelPairing(code);
  } catch (error) {
    logger.error("Extension pairing cancellation failed", {error: toLogError(error)});
  }

  redirect("/home");
}

function readPairingCode(formData: FormData) {
  const rawCode = formData.get("code");
  if (typeof rawCode !== "string") return null;

  const normalizedCode = normalizeExtensionPairingCode(rawCode);
  return EXTENSION_PAIRING_CODE_PATTERN.test(normalizedCode) ? normalizedCode : null;
}
