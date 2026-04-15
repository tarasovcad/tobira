import { checkXAuth, fetchXUser } from "@/lib/x-api";
import { saveXConfig } from "@/lib/x-config";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === "X_CONFIG") return saveXConfig(message);
    if (message.type === "CHECK_X_AUTH") return checkXAuth();
    if (message.type === "FETCH_X_USER") return fetchXUser();
  });
});
