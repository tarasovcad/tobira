import {eq} from "drizzle-orm";

import {db} from "@/db";
import {user} from "@/db/schema";
import {auth, EXTENSION_API_KEY_CONFIG_ID} from "@/lib/auth/auth";
import {
  EXTENSION_API_KEY_PERMISSIONS,
  type ExtensionApiKeyPermissionSet,
} from "@/lib/auth/extension-permissions";
import {ForbiddenError, RateLimitError, UnauthorizedError} from "@/lib/shared/errors";

export const EXTENSION_API_KEY_HEADER = "x-api-key";

export type ExtensionApiKeyPermissions = ExtensionApiKeyPermissionSet;

export {EXTENSION_API_KEY_PERMISSIONS};

export type ExtensionApiKeyPrincipal = {
  apiKeyId: string;
  expiresAt: Date | null;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export function getExtensionApiKey(request: Request) {
  const key = request.headers.get(EXTENSION_API_KEY_HEADER)?.trim();

  if (!key) {
    throw new UnauthorizedError();
  }

  return key;
}

export async function requireExtensionApiKey(
  request: Request,
  permissions?: ExtensionApiKeyPermissions,
): Promise<ExtensionApiKeyPrincipal> {
  const key = getExtensionApiKey(request);
  const result = await auth.api.verifyApiKey({
    body: {
      configId: EXTENSION_API_KEY_CONFIG_ID,
      key,
    },
  });

  const errorCode = result.error?.code;
  if (errorCode === "RATE_LIMITED" || errorCode === "USAGE_EXCEEDED") {
    throw new RateLimitError("Extension API key rate limit exceeded");
  }

  const apiKey = result.valid && result.key ? result.key : null;

  if (!apiKey || apiKey.configId !== EXTENSION_API_KEY_CONFIG_ID || !apiKey.referenceId) {
    throw new UnauthorizedError();
  }

  if (permissions && !hasRequiredPermissions(apiKey.permissions, permissions)) {
    throw new ForbiddenError("This extension connection lacks the required permission");
  }

  const [owner] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(user)
    .where(eq(user.id, apiKey.referenceId))
    .limit(1);

  if (!owner) {
    throw new UnauthorizedError();
  }

  return {
    apiKeyId: apiKey.id,
    expiresAt: apiKey.expiresAt,
    userId: owner.id,
    user: owner,
  };
}

function hasRequiredPermissions(granted: unknown, required: ExtensionApiKeyPermissions): boolean {
  if (typeof granted !== "object" || granted === null) return false;

  for (const [resource, actions] of Object.entries(required)) {
    const grantedActions = Object.entries(granted as Record<string, unknown>).find(
      ([key]) => key === resource,
    )?.[1];
    if (!Array.isArray(grantedActions)) return false;

    for (const action of actions) {
      if (!grantedActions.includes(action)) return false;
    }
  }

  return true;
}
