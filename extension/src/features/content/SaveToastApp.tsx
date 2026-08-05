import { useEffect } from "react";
import { browser } from "wxt/browser";

import { toastManager } from "@/components/ui/toast";
import { isTobiraToastMessage } from "@/lib/tobira-messages";

export function SaveToastApp() {
  useEffect(() => {
    const handleMessage = (message: unknown) => {
      if (!isTobiraToastMessage(message)) return;

      toastManager.add({
        id: message.id,
        title: message.title,
        description: message.description,
        type: message.toastType,
        timeout: 2000,
      });
    };

    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return null;
}
