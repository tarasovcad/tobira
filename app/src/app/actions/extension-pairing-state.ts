export type ExtensionPairingApprovalState =
  | {status: "idle"}
  | {status: "approved"}
  | {status: "unauthenticated"}
  | {status: "invalid-code"}
  | {status: "not-found"}
  | {status: "expired"}
  | {status: "used"}
  | {status: "cancelled"}
  | {status: "error"};

export const initialExtensionPairingApprovalState: ExtensionPairingApprovalState = {
  status: "idle",
};
