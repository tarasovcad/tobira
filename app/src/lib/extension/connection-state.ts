import type {ExtensionConnectionStatus} from "@/db/schema";

export type ExtensionConnectionStateInput = {
  status: ExtensionConnectionStatus;
  pairingExpiresAt: string;
  credentialExpiresAt: string | null;
};

export type ExtensionConnectionState =
  | "pending"
  | "approved"
  | "active"
  | "cancelled"
  | "revoked"
  | "pairing-expired"
  | "connection-expired";

export function classifyExtensionConnection(
  connection: ExtensionConnectionStateInput,
  now: Date,
): ExtensionConnectionState {
  if (connection.status === "cancelled") return "cancelled";
  if (connection.status === "revoked") return "revoked";

  if (connection.status === "active") {
    if (
      connection.credentialExpiresAt &&
      new Date(connection.credentialExpiresAt).getTime() <= now.getTime()
    ) {
      return "connection-expired";
    }

    return "active";
  }

  if (new Date(connection.pairingExpiresAt).getTime() <= now.getTime()) {
    return "pairing-expired";
  }

  return connection.status;
}
