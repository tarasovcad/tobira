import { checkXAuth, fetchXUser } from "@/lib/x-api";
import { saveXConfig, type XConfig } from "@/lib/x-config";
import {
  browserTobiraApi,
  TobiraApiError,
  type TobiraBulkWebsiteBookmarkResult,
} from "@/lib/tobira-api";
import { isTobiraAppUrl } from "@/lib/tobira-config";
import { TobiraConnectionManager } from "@/lib/tobira-connection-manager";
import {
  browserTobiraAuthStore,
  restrictTobiraStorageAccess,
} from "@/lib/tobira-connection-storage";
import { isTobiraPairingCode } from "@/lib/tobira-contracts";
import {
  getRuntimeMessageType,
  TOBIRA_SHOW_TOAST,
  type TobiraToastMessage,
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

const SAVE_PAGE_MENU_ID = "save-to-tobira-page";
const SAVE_LINK_MENU_ID = "save-to-tobira-link";
const SAVE_SELECTED_TABS_MENU_ID = "save-selected-tabs-to-tobira";
const SAVE_CURRENT_PAGE_COMMAND = "save-current-page";
const TOBIRA_BULK_WEBSITE_MAX_URLS = 10;

type TabContextMenuProperties = {
  id: string;
  title: string;
  contexts: ["tab"];
};

export default defineBackground(() => {
  void initializeTobiraStorage().catch((error) => {
    console.error("Failed to initialize extension storage", error);
  });

  void initializeContextMenus().catch((error) => {
    console.error("Failed to initialize Tobira context menus", error);
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === SAVE_SELECTED_TABS_MENU_ID) {
      void saveSelectedTabsFromContextMenu(tab).catch((error) => {
        console.error("Failed to save selected tabs to Tobira", error);
      });
      return;
    }

    if (info.menuItemId === SAVE_LINK_MENU_ID && info.linkUrl) {
      void saveWebsiteBookmarkFromContextMenu(info.linkUrl, tab?.id);
      return;
    }

    if (info.menuItemId !== SAVE_PAGE_MENU_ID) return;

    const pageUrl = info.pageUrl ?? tab?.url;
    if (!pageUrl) return;

    void saveWebsiteBookmarkFromContextMenu(pageUrl, tab?.id);
  });

  browser.tabs.onHighlighted.addListener(({tabIds}) => {
    void updateSelectedTabsMenuTitle(tabIds.length).catch((error) => {
      console.error("Failed to update the selected tabs menu", error);
    });
  });

  browser.commands.onCommand.addListener((command, tab) => {
    if (command !== SAVE_CURRENT_PAGE_COMMAND) return;

    void saveCurrentPage(tab).catch((error) => {
      console.error("Failed to save the current page from keyboard shortcut", error);
    });
  });

  void browser.omnibox
    .setDefaultSuggestion({description: "Save current page to Tobira"})
    .catch((error) => {
      console.error("Failed to initialize the Tobira omnibox suggestion", error);
    });

  browser.omnibox.onInputEntered.addListener(() => {
    void saveCurrentPage(undefined).catch((error) => {
      console.error("Failed to save the current page from the Tobira omnibox", error);
    });
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

async function initializeContextMenus(): Promise<void> {
  await browser.contextMenus.removeAll();
  await browser.contextMenus.create({
    id: SAVE_PAGE_MENU_ID,
    title: "Save page to Tobira",
    contexts: ["page"],
  });
  await browser.contextMenus.create({
    id: SAVE_LINK_MENU_ID,
    title: "Save link to Tobira",
    contexts: ["link"],
  });

  // Chrome supports the tab context, but the installed WXT browser types do not include it yet.
  const selectedTabsMenu: TabContextMenuProperties = {
    id: SAVE_SELECTED_TABS_MENU_ID,
    title: "Save selected pages to Tobira",
    contexts: ["tab"],
  };
  await browser.contextMenus.create(
    selectedTabsMenu as unknown as Parameters<typeof browser.contextMenus.create>[0],
  );

  await updateSelectedTabsMenuTitle();
}

async function updateSelectedTabsMenuTitle(tabCount?: number): Promise<void> {
  const count =
    tabCount ??
    (
      await browser.tabs.query({
        highlighted: true,
        lastFocusedWindow: true,
      })
    ).length;

  if (count === 0) return;

  await browser.contextMenus.update(SAVE_SELECTED_TABS_MENU_ID, {
    title: getSelectedTabsMenuTitle(count),
  });
}

function getSelectedTabsMenuTitle(count: number): string {
  return count === 1
    ? "Save page to Tobira"
    : `Save ${count} pages to Tobira`;
}

async function saveSelectedTabsFromContextMenu(
  tab: {id?: number; url?: string; windowId?: number} | undefined,
): Promise<void> {
  const highlightedTabs = await browser.tabs.query(
    typeof tab?.windowId === "number"
      ? {highlighted: true, windowId: tab.windowId}
      : {highlighted: true, lastFocusedWindow: true},
  );
  const urls = highlightedTabs.flatMap((highlightedTab) =>
    highlightedTab.url ? [highlightedTab.url] : [],
  );

  if (urls.length === 0 && tab?.url) urls.push(tab.url);
  if (urls.length === 0) return;

  if (urls.length === 1) {
    await saveWebsiteBookmarkFromContextMenu(urls[0]!, tab?.id);
    return;
  }

  await saveBulkWebsiteBookmarksFromContextMenu(urls, tab?.id);
}

async function saveBulkWebsiteBookmarksFromContextMenu(
  urls: string[],
  tabId: number | undefined,
): Promise<void> {
  let toastId: string | undefined;

  try {
    await ensureTobiraStorageAccess();

    const auth = await browserTobiraAuthStore.get();
    if (
      !auth ||
      auth.kind !== "connected" ||
      auth.connection.confirmationPending
    ) {
      await showContextMenuToast(
        tabId,
        "Connect Tobira first",
        "Open the Tobira extension popup and connect your account before saving pages.",
        "error",
      );
      return;
    }

    toastId = `bookmark-save-${crypto.randomUUID()}`;
    const result = await createBulkWebsiteBookmarksInBatches(
      auth.connection.apiKey,
      urls,
    );
    const savedCount = result.bookmarks.length;
    const skippedCount = result.rejected.length + result.duplicates.length;

    await showContextMenuToast(
      tabId,
      savedCount > 0
        ? `Saved ${savedCount} ${savedCount === 1 ? "page" : "pages"} to Tobira`
        : "No pages saved to Tobira",
      skippedCount > 0
        ? `${skippedCount} ${skippedCount === 1 ? "page was" : "pages were"} skipped.`
        : undefined,
      savedCount > 0 ? "success" : "warning",
      toastId,
    );
  } catch (error) {
    console.error("Failed to save selected pages to Tobira", error);

    await showContextMenuToast(
      tabId,
      "Could not save pages to Tobira",
      getContextMenuSaveErrorMessage(error),
      "error",
      toastId,
    );
  }
}

async function createBulkWebsiteBookmarksInBatches(
  apiKey: string,
  urls: string[],
): Promise<TobiraBulkWebsiteBookmarkResult> {
  const results: TobiraBulkWebsiteBookmarkResult[] = [];

  for (
    let start = 0;
    start < urls.length;
    start += TOBIRA_BULK_WEBSITE_MAX_URLS
  ) {
    results.push(
      await browserTobiraApi.createBulkWebsiteBookmarks(
        apiKey,
        urls.slice(start, start + TOBIRA_BULK_WEBSITE_MAX_URLS),
      ),
    );
  }

  return {
    bookmarks: results.flatMap((result) => result.bookmarks),
    rejected: results.flatMap((result) => result.rejected),
    duplicates: results.flatMap((result) => result.duplicates),
  };
}

async function saveCurrentPage(
  tab: {id?: number; url?: string} | undefined,
): Promise<void> {
  const currentTab =
    tab?.url
      ? tab
      : (await browser.tabs.query({active: true, lastFocusedWindow: true}))[0];

  if (!currentTab?.url) return;

  await saveWebsiteBookmarkFromContextMenu(currentTab.url, currentTab.id);
}

async function saveWebsiteBookmarkFromContextMenu(
  url: string,
  tabId: number | undefined,
): Promise<void> {
  let toastId: string | undefined;

  try {
    await ensureTobiraStorageAccess();

    const auth = await browserTobiraAuthStore.get();
    if (
      !auth ||
      auth.kind !== "connected" ||
      auth.connection.confirmationPending
    ) {
      await showContextMenuToast(
        tabId,
        "Connect Tobira first",
        "Open the Tobira extension popup and connect your account before saving links.",
        "error",
      );
      return;
    }

    toastId = `bookmark-save-${crypto.randomUUID()}`;
    await showContextMenuToast(
      tabId,
      "Saved to Tobira",
      undefined,
      "success",
      toastId,
    );

    await browserTobiraApi.createWebsiteBookmark(auth.connection.apiKey, url);
  } catch (error) {
    console.error("Failed to save website bookmark from context menu", error);

    await showContextMenuToast(
      tabId,
      "Could not save to Tobira",
      getContextMenuSaveErrorMessage(error),
      "error",
      toastId,
    );
  }
}

async function showContextMenuToast(
  tabId: number | undefined,
  title: string,
  message: string | undefined,
  toastType: TobiraToastMessage["toastType"],
  id?: string,
): Promise<void> {
  if (tabId === undefined) return;

  const toastMessage: TobiraToastMessage = {
    type: TOBIRA_SHOW_TOAST,
    ...(id ? {id} : {}),
    title,
    description: message,
    toastType,
  };

  try {
    await browser.tabs.sendMessage(tabId, toastMessage);
  } catch (error) {
    console.error("Failed to show Tobira context menu toast", error);
  }
}

function getContextMenuSaveErrorMessage(error: unknown): string {
  if (error instanceof TobiraApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Your Tobira connection expired. Reconnect the extension and try again.";
    }

    if (error.status === 429) {
      return error.retryAfterSeconds
        ? `Tobira is rate limiting saves. Try again in ${error.retryAfterSeconds} seconds.`
        : "Tobira is rate limiting saves. Try again shortly.";
    }

    if (error.status === 400) return error.message;
  }

  return "Please try again in a moment.";
}

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
