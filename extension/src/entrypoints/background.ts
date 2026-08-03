import { checkXAuth, fetchXUser } from "@/lib/x-api";
import { saveXConfig, type XConfig } from "@/lib/x-config";
import { browserTobiraApi } from "@/lib/tobira-api";
import { isTobiraAppUrl } from "@/lib/tobira-config";
import { TobiraConnectionManager } from "@/lib/tobira-connection-manager";
import {
  browserTobiraAuthStore,
  restrictTobiraStorageAccess,
} from "@/lib/tobira-connection-storage";
import { isTobiraPairingCode } from "@/lib/tobira-contracts";
import {
  getRuntimeMessageType,
  type TobiraRuntimeResponse,
} from "@/lib/tobira-messages";

type XConfigMessage = { type: "X_CONFIG" } & Partial<XConfig>;

type MessageSender = {
  tab?: { url?: string };
  url?: string;
};

let storageAccessPromise: Promise<void> | null = null;

const tobiraConnectionManager = new TobiraConnectionManager({
  api: browserTobiraApi,
  store: browserTobiraAuthStore,
  async openTab(url) {
    await browser.tabs.create({ url });
  },
  broadcast(response) {
    void browser.runtime
      .sendMessage({ type: "TOBIRA_STATE_CHANGED", ...response })
      .catch(() => undefined);
  },
  now: Date.now,
  logError(message, error) {
    console.error(message, error);
  },
});

export default defineBackground(() => {
  void initializeTobiraStorage().catch((error) => {
    console.error("Failed to initialize extension storage", error);
  });

  browser.runtime.onMessage.addListener(
    (message: unknown, sender, sendResponse) => {
      void handleBackgroundMessage(message, sender)
        .then(sendResponse)
        .catch((error) => {
          console.error("Failed to handle extension message", error);
          sendResponse(undefined);
        });

      return true;
    },
  );
});

async function initializeTobiraStorage(): Promise<void> {
  await ensureTobiraStorageAccess();
  await tobiraConnectionManager.initialize();
}

async function handleBackgroundMessage(
  message: unknown,
  sender: MessageSender,
): Promise<unknown> {
  const type = getRuntimeMessageType(message);
  if (!type) return undefined;

  if (type === "X_CONFIG") {
    return saveXConfig(message as XConfigMessage);
  }
  if (type === "CHECK_X_AUTH") return checkXAuth();
  if (type === "FETCH_X_USER") return fetchXUser();

  await ensureTobiraStorageAccess();

  if (type === "TOBIRA_GET_CONNECTION_STATE") {
    return tobiraConnectionManager.getState();
  }
  if (type === "START_TOBIRA_PAIRING") {
    return tobiraConnectionManager.startPairing();
  }
  if (type === "TOBIRA_OPEN_PAIRING") {
    return tobiraConnectionManager.reopenPairing();
  }
  if (type === "TOBIRA_ACK_CONNECTED") {
    return tobiraConnectionManager.acknowledgeConnected();
  }
  if (type === "TOBIRA_DISCONNECT") {
    return tobiraConnectionManager.disconnect();
  }
  if (type === "PAIRING_APPROVED") {
    const code = getPairingApprovalCode(message);
    if (!code || !isTobiraSender(sender)) {
      const response = await tobiraConnectionManager.getState();
      return {
        ...response,
        notice: "The Tobira approval could not be verified.",
      } satisfies TobiraRuntimeResponse;
    }

    return tobiraConnectionManager.approvePairing(code);
  }

  return undefined;
}

async function ensureTobiraStorageAccess(): Promise<void> {
  storageAccessPromise ??= restrictTobiraStorageAccess();

  try {
    await storageAccessPromise;
  } catch (error) {
    storageAccessPromise = null;
    throw error;
  }
}

function getPairingApprovalCode(message: unknown): string | null {
  if (typeof message !== "object" || message === null || !("code" in message)) {
    return null;
  }

  return isTobiraPairingCode(message.code) ? message.code : null;
}

function isTobiraSender(sender: MessageSender): boolean {
  const senderUrl = sender.tab?.url ?? sender.url;
  return senderUrl ? isTobiraAppUrl(senderUrl) : false;
}
