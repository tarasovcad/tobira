import {
  isRecord,
  isTobiraPublicState,
  type TobiraPublicState,
} from "@/lib/tobira-contracts";

export const TOBIRA_SHOW_TOAST = "TOBIRA_SHOW_TOAST";

export type TobiraToastType =
  | "error"
  | "info"
  | "loading"
  | "success"
  | "warning";

export type TobiraToastMessage = {
  type: typeof TOBIRA_SHOW_TOAST;
  id?: string;
  title: string;
  description?: string;
  toastType: TobiraToastType;
};

export type TobiraRuntimeMessage =
  | { type: "TOBIRA_GET_CONNECTION_STATE" }
  | { type: "START_TOBIRA_PAIRING" }
  | { type: "TOBIRA_OPEN_PAIRING" }
  | { type: "PAIRING_APPROVED"; code: string }
  | { type: "TOBIRA_ACK_CONNECTED" }
  | { type: "TOBIRA_DISCONNECT" };

export type TobiraRuntimeResponse = {
  state: TobiraPublicState;
  notice?: string;
};

export type TobiraStateChangedMessage = TobiraRuntimeResponse & {
  type: "TOBIRA_STATE_CHANGED";
};

export function isTobiraRuntimeResponse(
  value: unknown,
): value is TobiraRuntimeResponse {
  return (
    isRecord(value) &&
    isTobiraPublicState(value.state) &&
    (value.notice === undefined || typeof value.notice === "string")
  );
}

export function isTobiraStateChangedMessage(
  value: unknown,
): value is TobiraStateChangedMessage {
  return (
    isRecord(value) &&
    value.type === "TOBIRA_STATE_CHANGED" &&
    isTobiraRuntimeResponse(value)
  );
}

export function isTobiraToastMessage(
  value: unknown,
): value is TobiraToastMessage {
  return (
    isRecord(value) &&
    value.type === TOBIRA_SHOW_TOAST &&
    (value.id === undefined ||
      (typeof value.id === "string" && value.id.length > 0)) &&
    typeof value.title === "string" &&
    (value.description === undefined ||
      typeof value.description === "string") &&
    isTobiraToastType(value.toastType)
  );
}

export function getRuntimeMessageType(value: unknown): string | null {
  return isRecord(value) && typeof value.type === "string" ? value.type : null;
}

function isTobiraToastType(value: unknown): value is TobiraToastType {
  return (
    value === "error" ||
    value === "info" ||
    value === "loading" ||
    value === "success" ||
    value === "warning"
  );
}
