import { browser } from "wxt/browser";

import {
  isTobiraRuntimeResponse,
  type TobiraRuntimeMessage,
  type TobiraRuntimeResponse,
} from "@/lib/tobira-messages";

export function requestTobiraState(): Promise<TobiraRuntimeResponse> {
  return sendTobiraMessage({ type: "TOBIRA_GET_CONNECTION_STATE" });
}

export function startTobiraPairing(): Promise<TobiraRuntimeResponse> {
  return sendTobiraMessage({ type: "START_TOBIRA_PAIRING" });
}

export function reopenTobiraPairing(): Promise<TobiraRuntimeResponse> {
  return sendTobiraMessage({ type: "TOBIRA_OPEN_PAIRING" });
}

export function acknowledgeTobiraConnection(): Promise<TobiraRuntimeResponse> {
  return sendTobiraMessage({ type: "TOBIRA_ACK_CONNECTED" });
}

export function disconnectTobiraConnection(): Promise<TobiraRuntimeResponse> {
  return sendTobiraMessage({ type: "TOBIRA_DISCONNECT" });
}

async function sendTobiraMessage(
  message: TobiraRuntimeMessage,
): Promise<TobiraRuntimeResponse> {
  const response: unknown = await browser.runtime.sendMessage(message);
  if (!isTobiraRuntimeResponse(response)) {
    throw new Error("The extension returned an invalid Tobira response.");
  }

  return response;
}
