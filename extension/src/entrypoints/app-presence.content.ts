import {
  TOBIRA_APP_MATCH_PATTERN,
  TOBIRA_APP_ORIGIN,
} from "@/lib/tobira-config";
import {
  isRecord,
  isTobiraPairingCode,
  TOBIRA_EXTENSION_PAIRING_APPROVED,
} from "@/lib/tobira-contracts";

type ExtensionPairingApprovedMessage = {
  code: string;
  type: typeof TOBIRA_EXTENSION_PAIRING_APPROVED;
};

export default defineContentScript({
  matches: [TOBIRA_APP_MATCH_PATTERN],
  runAt: "document_idle",
  main() {
    window.addEventListener("message", (event) => {
      if (
        event.source !== window ||
        event.origin !== TOBIRA_APP_ORIGIN ||
        !isRecord(event.data)
      ) {
        return;
      }

      if (isExtensionPairingApprovedMessage(event.data)) {
        // The background can redeem this public code only with the device
        // token stored in the trusted extension context.
        void browser.runtime
          .sendMessage({
            type: "PAIRING_APPROVED",
            code: event.data.code,
          })
          .catch(() => undefined);
        return;
      }

      if (event.data.type === "TOBIRA_EXTENSION_PING") {
        window.postMessage(
          { type: "TOBIRA_EXTENSION_PONG", requestId: event.data.requestId },
          TOBIRA_APP_ORIGIN,
        );
        return;
      }

      if (event.data.type !== "TOBIRA_EXTENSION_FETCH_X_USER") return;

      void browser.runtime
        .sendMessage({ type: "FETCH_X_USER" })
        .then((payload) => {
          window.postMessage(
            {
              type: "TOBIRA_EXTENSION_X_USER",
              requestId: event.data.requestId,
              payload,
            },
            TOBIRA_APP_ORIGIN,
          );
        })
        .catch((error) => {
          window.postMessage(
            {
              type: "TOBIRA_EXTENSION_X_USER",
              requestId: event.data.requestId,
              payload: {
                error: error instanceof Error ? error.message : String(error),
              },
            },
            TOBIRA_APP_ORIGIN,
          );
        });
    });
  },
});

function isExtensionPairingApprovedMessage(
  value: Record<string, unknown>,
): value is Record<string, unknown> & ExtensionPairingApprovedMessage {
  return (
    value.type === TOBIRA_EXTENSION_PAIRING_APPROVED &&
    isTobiraPairingCode(value.code)
  );
}
