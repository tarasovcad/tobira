import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

import {
  DEVELOPMENT_TOBIRA_APP_URL,
  PRODUCTION_TOBIRA_APP_URL,
} from "./src/lib/tobira-origins";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  targetBrowsers: ["chrome"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  dev: {
    server: {
      port: 3001,
      origin: "http://localhost:3001",
    },
  },
  manifest: ({ mode }) => {
    const tobiraAppUrl =
      mode === "development"
        ? DEVELOPMENT_TOBIRA_APP_URL
        : PRODUCTION_TOBIRA_APP_URL;

    return {
      name: "Tobira",
      description:
        "Connect Tobira to your browser and bring your saved content together.",
      permissions: ["contextMenus", "cookies", "storage"],
      host_permissions: [
        "<all_urls>",
        "*://*.x.com/*",
        "*://*.twitter.com/*",
        `${tobiraAppUrl}/*`,
      ],
      omnibox: {
        keyword: "tobira",
      },
      commands: {
        "save-current-page": {
          suggested_key: {
            default: "Ctrl+Shift+S",
            mac: "Command+Shift+S",
          },
          description: "Save the current page to Tobira",
        },
      },
    };
  },
});
