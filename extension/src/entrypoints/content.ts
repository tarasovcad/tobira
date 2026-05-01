export default defineContentScript({
  matches: ["*://x.com/*", "*://twitter.com/*"],
  runAt: "document_idle",
  main() {
    // Inject into the real page context so we can access X's webpack bundle
    const script = document.createElement("script");
    script.textContent = `
      (function () {
        try {
          const queryIds = {};
          let bearerToken = null;

          webpackChunk_twitter_responsive_web.push([
            ["tobira_extract"],
            {},
            function (e) {
              for (const id in e.c) {
                const exp = e.c[id]?.exports;
                if (!exp) continue;

                // query IDs — modules that export { queryId, operationName }
                if (typeof exp === "object" && "queryId" in exp && "operationName" in exp) {
                  queryIds[exp.operationName] = exp.queryId;
                }

                // bearer token — a string starting with "AAAA" or nested in an object
                if (!bearerToken) {
                  if (typeof exp === "string" && exp.startsWith("AAAA")) {
                    bearerToken = exp;
                  } else if (typeof exp === "object") {
                    for (const key of Object.keys(exp)) {
                      const val = exp[key];
                      if (typeof val === "string" && val.startsWith("AAAA")) {
                        bearerToken = val;
                        break;
                      }
                    }
                  }
                }
              }
            },
          ]);

          window.postMessage({ type: "TOBIRA_X_CONFIG", queryIds, bearerToken }, "*");
        } catch (_) {
          // webpack not ready or unavailable — background will use fallback values
        }
      })();
    `;

    document.documentElement.appendChild(script);
    script.remove();

    window.addEventListener(
      "message",
      (event) => {
        if (event.source !== window || event.data?.type !== "TOBIRA_X_CONFIG") return;
        browser.runtime.sendMessage({
          type: "X_CONFIG",
          queryIds: event.data.queryIds,
          bearerToken: event.data.bearerToken,
        });
      },
      { once: true }
    );
  },
});
