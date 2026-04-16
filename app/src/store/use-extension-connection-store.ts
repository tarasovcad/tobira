import {create} from "zustand";

const EXTENSION_PING = "TOBIRA_EXTENSION_PING";
const EXTENSION_PONG = "TOBIRA_EXTENSION_PONG";
const EXTENSION_FETCH_X_USER = "TOBIRA_EXTENSION_FETCH_X_USER";
const EXTENSION_X_USER = "TOBIRA_EXTENSION_X_USER";

const PRESENCE_TIMEOUT_MS = 1000;
const X_USER_TIMEOUT_MS = 2500;

type ExtensionPresence = "unknown" | "checking" | "installed" | "missing";

type ExtensionMessage<TPayload = unknown> = {
  payload?: TPayload;
  requestId: string;
  type: string;
};

type XUserPayload = {
  avatar?: string;
  error?: string;
  name?: string;
  screenName?: string;
  userId?: string;
};

export interface ExtensionXUser {
  avatar: string | null;
  name: string;
  screenName: string;
  userId: string;
}

interface ExtensionConnectionStore {
  error: string | null;
  initialize: () => Promise<void>;
  loadUser: () => Promise<ExtensionXUser | null>;
  presence: ExtensionPresence;
  user: ExtensionXUser | null;
}

const createRequestId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const requestExtensionMessage = <TPayload>(
  requestType: string,
  responseType: string,
  timeoutMs: number,
): Promise<TPayload | null> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Extension bridge is only available in the browser."));
  }

  const requestId = createRequestId();

  return new Promise<TPayload | null>((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", handleMessage);
    };

    const handleMessage = (event: MessageEvent<ExtensionMessage<TPayload>>) => {
      if (
        event.source !== window ||
        event.data?.type !== responseType ||
        event.data?.requestId !== requestId
      )
        return;

      cleanup();
      resolve(event.data.payload ?? null);
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${responseType}.`));
    }, timeoutMs);

    window.addEventListener("message", handleMessage);
    window.postMessage({type: requestType, requestId}, "*");
  });
};

export const useExtensionConnectionStore = create<ExtensionConnectionStore>((set) => ({
  presence: "unknown",
  user: null,
  error: null,

  initialize: async () => {
    set({presence: "checking", error: null});

    try {
      await requestExtensionMessage(EXTENSION_PING, EXTENSION_PONG, PRESENCE_TIMEOUT_MS);
    } catch {
      set({presence: "missing", user: null});
      return;
    }

    set({presence: "installed"});

    try {
      const payload = await requestExtensionMessage<XUserPayload>(
        EXTENSION_FETCH_X_USER,
        EXTENSION_X_USER,
        X_USER_TIMEOUT_MS,
      );

      if (!payload || payload.error || !payload.screenName || !payload.userId) {
        set({
          user: null,
          error: payload?.error ?? "Could not load your X profile from the extension.",
        });
        return;
      }

      set({
        user: {
          name: payload.name ?? payload.screenName,
          screenName: payload.screenName,
          avatar: payload.avatar ?? null,
          userId: payload.userId,
        },
        error: null,
      });
    } catch (err) {
      set({
        user: null,
        error: err instanceof Error ? err.message : "Could not load your X profile.",
      });
    }
  },

  loadUser: async (): Promise<ExtensionXUser | null> => {
    // Delegates to initialize so presence check is never duplicated
    await useExtensionConnectionStore.getState().initialize();
    return useExtensionConnectionStore.getState().user;
  },
}));
