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
      permissions: ["cookies", "storage"],
      host_permissions: [
        "*://*.x.com/*",
        "*://*.twitter.com/*",
        `${tobiraAppUrl}/*`,
      ],
    };
  },
});
