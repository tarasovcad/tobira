import { useEffect, useState } from "react";
import { browser } from "wxt/browser";

import {
  AccountConnectedPage,
  ConnectAccountPage,
} from "./pages/TobiraConnectionPages";
import { MainPage } from "./pages/MainPage";
import type { ProviderId } from "./providers/providers";
import type {
  TobiraConnectionUser,
  TobiraPublicState,
} from "@/lib/tobira-contracts";
import {
  isTobiraStateChangedMessage,
  type TobiraRuntimeResponse,
} from "@/lib/tobira-messages";
import {
  acknowledgeTobiraConnection,
  disconnectTobiraConnection,
  reopenTobiraPairing,
  requestTobiraState,
  startTobiraPairing,
} from "@/lib/tobira-runtime-client";

function App() {
  const [connectionState, setConnectionState] =
    useState<TobiraPublicState | null>(null);
  const [activeProviderId, setActiveProviderId] = useState<ProviderId | null>(
    null,
  );
  const [connectedProviderIds, setConnectedProviderIds] = useState<
    ProviderId[]
  >([]);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const handleStateChanged = (message: unknown) => {
      if (!isMounted || !isTobiraStateChangedMessage(message)) return;

      applyRuntimeResponse(
        message,
        setConnectionState,
        setConnectionNotice,
      );
    };

    browser.runtime.onMessage.addListener(handleStateChanged);

    void requestTobiraState()
      .then((response) => {
        if (!isMounted) return;
        applyRuntimeResponse(
          response,
          setConnectionState,
          setConnectionNotice,
        );
      })
      .catch((error) => {
        if (!isMounted) return;
        setConnectionState({ kind: "disconnected" });
        setConnectionNotice(getConnectionErrorMessage(error));
      });

    return () => {
      isMounted = false;
      browser.runtime.onMessage.removeListener(handleStateChanged);
    };
  }, []);

  const startConnection = async () => {
    if (!connectionState || connectionState.kind !== "disconnected") return;

    setConnectionNotice(null);
    setIsStarting(true);

    try {
      applyRuntimeResponse(
        await startTobiraPairing(),
        setConnectionState,
        setConnectionNotice,
      );
    } catch (error) {
      setConnectionNotice(getConnectionErrorMessage(error));
    } finally {
      setIsStarting(false);
    }
  };

  const reopenConnection = async () => {
    setConnectionNotice(null);

    try {
      applyRuntimeResponse(
        await reopenTobiraPairing(),
        setConnectionState,
        setConnectionNotice,
      );
    } catch (error) {
      setConnectionNotice(getConnectionErrorMessage(error));
    }
  };

  const acknowledgeConnected = async () => {
    setConnectionNotice(null);

    try {
      applyRuntimeResponse(
        await acknowledgeTobiraConnection(),
        setConnectionState,
        setConnectionNotice,
      );
    } catch (error) {
      setConnectionNotice(getConnectionErrorMessage(error));
    }
  };

  const disconnect = async () => {
    if (connectionState?.kind !== "connected" || isDisconnecting) return;

    const previousState = connectionState;
    setConnectionNotice(null);
    setIsDisconnecting(true);

    try {
      const response = await disconnectTobiraConnection();
      applyRuntimeResponse(
        response,
        setConnectionState,
        setConnectionNotice,
      );
      if (response.state.kind === "disconnected") {
        setActiveProviderId(null);
      }
    } catch (error) {
      const transportNotice = getConnectionErrorMessage(error);

      try {
        const response = await requestTobiraState();
        applyRuntimeResponse(
          {
            ...response,
            notice: response.notice ?? transportNotice,
          },
          setConnectionState,
          setConnectionNotice,
        );
        if (response.state.kind === "disconnected") {
          setActiveProviderId(null);
        }
      } catch {
        setConnectionState(previousState);
        setConnectionNotice(transportNotice);
      }
    } finally {
      setIsDisconnecting(false);
    }
  };

  const connectProvider = (id: ProviderId) => {
    setConnectedProviderIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  };

  const mainUser = getMainUser(connectionState);
  if (mainUser) {
    return (
      <MainPage
        activeProviderId={activeProviderId}
        connectedProviderIds={connectedProviderIds}
        connectionNotice={connectionNotice}
        connectionUser={mainUser}
        isDisconnecting={isDisconnecting}
        onCloseProvider={() => setActiveProviderId(null)}
        onConnectProvider={connectProvider}
        onDisconnect={() => void disconnect()}
        onSelectProvider={setActiveProviderId}
      />
    );
  }

  if (
    connectionState?.kind === "connected" &&
    connectionState.confirmationPending
  ) {
    return (
      <AccountConnectedPage
        error={connectionNotice}
        user={connectionState.user}
        onContinue={() => void acknowledgeConnected()}
      />
    );
  }

  const isPairing = connectionState?.kind === "pairing";

  return (
    <ConnectAccountPage
      canReopen={isPairing}
      error={connectionNotice}
      isConnecting={connectionState === null || isStarting || isPairing}
      userCode={isPairing ? connectionState.userCode : undefined}
      onConnect={() => void startConnection()}
      onReopen={() => void reopenConnection()}
    />
  );
}

function applyRuntimeResponse(
  response: TobiraRuntimeResponse,
  setState: (state: TobiraPublicState) => void,
  setNotice: (notice: string | null) => void,
): void {
  setState(response.state);
  setNotice(response.notice ?? null);
}

function getMainUser(
  state: TobiraPublicState | null,
): TobiraConnectionUser | null {
  return state?.kind === "connected" && !state.confirmationPending
    ? state.user
    : null;
}

function getConnectionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message) return message;
  }

  return "Could not update the Tobira connection. Please try again.";
}

export default App;
