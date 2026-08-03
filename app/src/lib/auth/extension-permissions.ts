export const EXTENSION_API_KEY_PERMISSIONS = {
  accountRead: {account: ["read"]},
  connectionDelete: {connection: ["delete"]},
} as const;

export type ExtensionApiKeyPermissionSet = Record<string, readonly string[]>;
