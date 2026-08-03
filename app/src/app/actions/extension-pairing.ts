"use server";

import {and, eq, gt, isNull} from "drizzle-orm";

import {db} from "@/db";
import {extensionPairings} from "@/db/schema";
import {getCurrentUserId} from "@/lib/auth/session";
import {
  EXTENSION_PAIRING_CODE_PATTERN,
  hashExtensionPairingSecret,
  normalizeExtensionPairingCode,
} from "@/lib/extension/pairings";
import {logger, toLogError} from "@/lib/shared/logger";
import type {ExtensionPairingApprovalState} from "./extension-pairing-state";

export async function approveExtensionPairing(
  _previousState: ExtensionPairingApprovalState,
  formData: FormData,
): Promise<ExtensionPairingApprovalState> {
  const rawCode = formData.get("code");

  if (typeof rawCode !== "string") {
    return {status: "invalid-code"};
  }

  const normalizedCode = normalizeExtensionPairingCode(rawCode);
  if (!EXTENSION_PAIRING_CODE_PATTERN.test(normalizedCode)) {
    return {status: "invalid-code"};
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {status: "unauthenticated"};
    }

    const userCodeHash = hashExtensionPairingSecret(normalizedCode, "user-code");
    const now = new Date();
    const nowIso = now.toISOString();

    const [approvedPairing] = await db
      .update(extensionPairings)
      .set({
        userId,
        approvedAt: nowIso,
        updatedAt: nowIso,
      })
      .where(
        and(
          eq(extensionPairings.userCodeHash, userCodeHash),
          isNull(extensionPairings.userId),
          isNull(extensionPairings.approvedAt),
          isNull(extensionPairings.claimedAt),
          isNull(extensionPairings.redeemedAt),
          isNull(extensionPairings.cancelledAt),
          isNull(extensionPairings.apiKeyId),
          gt(extensionPairings.expiresAt, nowIso),
        ),
      )
      .returning({id: extensionPairings.id});

    if (approvedPairing) {
      return {status: "approved"};
    }

    const [pairing] = await db
      .select({
        userId: extensionPairings.userId,
        apiKeyId: extensionPairings.apiKeyId,
        expiresAt: extensionPairings.expiresAt,
        approvedAt: extensionPairings.approvedAt,
        claimedAt: extensionPairings.claimedAt,
        redeemedAt: extensionPairings.redeemedAt,
        cancelledAt: extensionPairings.cancelledAt,
      })
      .from(extensionPairings)
      .where(eq(extensionPairings.userCodeHash, userCodeHash))
      .limit(1);

    if (!pairing) {
      return {status: "not-found"};
    }

    if (pairing.cancelledAt) {
      return {status: "cancelled"};
    }

    if (new Date(pairing.expiresAt).getTime() <= now.getTime()) {
      return {status: "expired"};
    }

    if (
      pairing.userId ||
      pairing.apiKeyId ||
      pairing.approvedAt ||
      pairing.claimedAt ||
      pairing.redeemedAt
    ) {
      return {status: "used"};
    }

    logger.warn("Extension pairing approval did not update a pending pairing");
    return {status: "error"};
  } catch (error) {
    logger.error("Extension pairing approval failed", {error: toLogError(error)});
    return {status: "error"};
  }
}
