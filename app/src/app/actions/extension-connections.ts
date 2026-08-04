"use server";

import {revalidatePath} from "next/cache";
import {z} from "zod";

import {requireAuthenticatedUserId} from "@/lib/auth/session";
import {revokeExtensionConnection} from "@/lib/auth/extension-connections";
import {logger, toLogError} from "@/lib/shared/logger";

const revokeConnectionSchema = z.object({
  connectionId: z.string().trim().min(1).max(128),
});

export type RevokeExtensionConnectionResult = {success: true} | {success: false; error: string};

export async function revokeConnectedExtension(
  input: unknown,
): Promise<RevokeExtensionConnectionResult> {
  const parsed = revokeConnectionSchema.safeParse(input);
  if (!parsed.success) {
    return {success: false, error: "The connection could not be identified."};
  }

  try {
    const userId = await requireAuthenticatedUserId();
    const revoked = await revokeExtensionConnection(userId, parsed.data.connectionId);

    if (!revoked) {
      return {success: false, error: "This connection is no longer active."};
    }

    revalidatePath("/settings");
    return {success: true};
  } catch (error) {
    logger.error("Failed to revoke connected extension", {error: toLogError(error)});
    return {success: false, error: "The connection could not be revoked. Try again."};
  }
}
