const TOBIRA_EXTENSION_PAIRING_APPROVED = "TOBIRA_EXTENSION_PAIRING_APPROVED";
const EXTENSION_PAIRING_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

type ExtensionPairingApprovedMessage = {
  code: string;
  type: typeof TOBIRA_EXTENSION_PAIRING_APPROVED;
};

function isExtensionPairingApprovedMessage(
  value: unknown,
): value is ExtensionPairingApprovedMessage {
  if (typeof value !== "object" || value === null) return false;

  const message = value as {code?: unknown; type?: unknown};

  return (
    message.type === TOBIRA_EXTENSION_PAIRING_APPROVED &&
    typeof message.code === "string" &&
    EXTENSION_PAIRING_CODE_PATTERN.test(message.code)
  );
}

export default defineContentScript({
  matches: [
    "http://localhost:3000/*",
    "http://127.0.0.1:3000/*",
    "https://tobira.app/*",
  ],
  runAt: "document_idle",
  main() {
    window.addEventListener("message", async (event) => {
      if (event.source !== window || !event.data?.type) return;

      if (isExtensionPairingApprovedMessage(event.data)) {
        // The code is public and only identifies the pending pairing. The
        // background worker must redeem the locally stored device token.
        void browser.runtime.sendMessage({
          type: "PAIRING_APPROVED",
          code: event.data.code,
        }).catch(() => undefined);
        return;
      }

      if (event.data.type === "TOBIRA_EXTENSION_PING") {
        window.postMessage(
          { type: "TOBIRA_EXTENSION_PONG", requestId: event.data.requestId },
          "*"
        );
        return;
      }

      if (event.data.type !== "TOBIRA_EXTENSION_FETCH_X_USER") return;

      try {
        const payload = await browser.runtime.sendMessage({
          type: "FETCH_X_USER",
        });
        window.postMessage(
          {
            type: "TOBIRA_EXTENSION_X_USER",
            requestId: event.data.requestId,
            payload,
          },
          "*"
        );
      } catch (error) {
        window.postMessage(
          {
            type: "TOBIRA_EXTENSION_X_USER",
            requestId: event.data.requestId,
            payload: {
              error: error instanceof Error ? error.message : String(error),
            },
          },
          "*"
        );
      }
    });
  },
});
