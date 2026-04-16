export default defineContentScript({
  matches: ["http://localhost:3000/*", "https://tobira.app/*"],
  runAt: "document_idle",
  main() {
    window.addEventListener("message", async (event) => {
      if (event.source !== window || !event.data?.type) return;

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
