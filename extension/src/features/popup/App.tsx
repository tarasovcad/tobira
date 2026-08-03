import {useEffect, useState} from "react";
import {browser} from "wxt/browser";

import {
  AccountConnectedPage,
  ConnectAccountPage,
} from "./pages/TobiraConnectionPages";
import {MainPage} from "./pages/MainPage";
import type {ProviderId} from "./providers/providers";
import type {TobiraConnectionUser} from "@/lib/tobira-connection-storage";
import {
  isTobiraStateChangedMessage,
  type PublicTobiraState,
  type TobiraRuntimeResponse,
} from "@/lib/tobira-messages";

const INITIAL_STATE: PublicTobiraState = {kind: "bootstrapping"};

function App() {
  const [connectionState, setConnectionState] =
    useState<PublicTobiraState>(INITIAL_STATE);
  const [activeProviderId, setActiveProviderId] = useState<ProviderId | null>(
    null,
  );
  const [connectedProviderIds, setConnectedProviderIds] = useState<
    ProviderId[]
  >([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleStateChanged = (message: unknown) => {
      if (!isMounted || !isTobiraStateChangedMessage(message)) return;

      setConnectionState(message.state);
      setConnectionError(
        message.state.kind === "pairing" ? message.state.warning ?? null : null,
      );
    };

    browser.runtime.onMessage.addListener(handleStateChanged);

    void requestTobiraState()
      .then((response) => {
        if (!isMounted) return;
        applyRuntimeResponse(response, setConnectionState, setConnectionError);
      })
      .catch((error) => {
        if (!isMounted) return;
        setConnectionState({kind: "disconnected"});
        setConnectionError(getConnectionErrorMessage(error));
      });

    return () => {
      isMounted = false;
      browser.runtime.onMessage.removeListener(handleStateChanged);
    };
  }, []);

  const startConnection = async () => {
    if (
      connectionState.kind === "pairing" ||
      connectionState.kind === "connected" ||
      connectionState.kind === "disconnecting"
    ) {
      return;
    }

    setConnectionError(null);

    try {
      const response = await browser.runtime.sendMessage({
        type: "START_TOBIRA_PAIRING",
      });
      applyRuntimeResponse(
        response as TobiraRuntimeResponse,
        setConnectionState,
        setConnectionError,
      );
    } catch (error) {
      setConnectionState({kind: "disconnected"});
      setConnectionError(getConnectionErrorMessage(error));
    }
  };

  const reopenConnection = async () => {
    setConnectionError(null);

    try {
      const response = await browser.runtime.sendMessage({
        type: "TOBIRA_OPEN_PAIRING",
      });
      applyRuntimeResponse(
        response as TobiraRuntimeResponse,
        setConnectionState,
        setConnectionError,
      );
    } catch (error) {
      setConnectionError(getConnectionErrorMessage(error));
    }
  };

  const acknowledgeConnected = async () => {
    try {
      const response = await browser.runtime.sendMessage({
        type: "TOBIRA_ACK_CONNECTED",
      });
      applyRuntimeResponse(
        response as TobiraRuntimeResponse,
        setConnectionState,
        setConnectionError,
      );
    } catch (error) {
      setConnectionError(getConnectionErrorMessage(error));
    }
  };

  const disconnect = async () => {
    if (connectionState.kind !== "connected") return;

    setConnectionState({
      kind: "disconnecting",
      user: connectionState.user,
    });
    setConnectionError(null);

    try {
      const response = await browser.runtime.sendMessage({
        type: "TOBIRA_DISCONNECT",
      });
      applyRuntimeResponse(
        response as TobiraRuntimeResponse,
        setConnectionState,
        setConnectionError,
      );
      setActiveProviderId(null);
    } catch (error) {
      setConnectionError(getConnectionErrorMessage(error));
      setConnectionState({kind: "disconnected"});
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
        connectionUser={mainUser}
        isDisconnecting={connectionState.kind === "disconnecting"}
        onCloseProvider={() => setActiveProviderId(null)}
        onConnectProvider={connectProvider}
        onDisconnect={() => void disconnect()}
        onSelectProvider={setActiveProviderId}
      />
    );
  }

  if (
    connectionState.kind === "connected" &&
    connectionState.confirmationPending
  ) {
    return (
      <AccountConnectedPage
        user={connectionState.user}
        onContinue={() => void acknowledgeConnected()}
      />
    );
  }

  const isConnecting =
    connectionState.kind === "bootstrapping" ||
    connectionState.kind === "pairing";

  return (
    <ConnectAccountPage
      error={
        connectionError ??
        (connectionState.kind === "pairing"
          ? connectionState.warning ?? null
          : null)
      }
      expiresAt={
        connectionState.kind === "pairing"
          ? connectionState.expiresAt
          : undefined
      }
      isConnecting={isConnecting}
      userCode={
        connectionState.kind === "pairing"
          ? connectionState.userCode
          : undefined
      }
      onConnect={() => void startConnection()}
      onReopen={() => void reopenConnection()}
    />
  );
}

async function requestTobiraState(): Promise<TobiraRuntimeResponse> {
  return (await browser.runtime.sendMessage({
    type: "TOBIRA_GET_CONNECTION_STATE",
  })) as TobiraRuntimeResponse;
}

function applyRuntimeResponse(
  response: TobiraRuntimeResponse | null | undefined,
  setState: (state: PublicTobiraState) => void,
  setError: (error: string | null) => void,
) {
  if (!response?.state) {
    setError(
      response && "error" in response && typeof response.error === "string"
        ? response.error
        : "Could not update the Tobira connection. Please try again.",
    );
    return;
  }

  setState(response.state);
  setError(response.error ?? response.warning ?? getStateWarning(response.state));
}

function getStateWarning(state: PublicTobiraState): string | null {
  if (state.kind === "disconnected" || state.kind === "pairing") {
    return state.warning ?? null;
  }

  return null;
}

function getMainUser(state: PublicTobiraState): TobiraConnectionUser | null {
  if (state.kind === "disconnecting") return state.user;
  if (state.kind === "connected" && !state.confirmationPending) {
    return state.user;
  }

  return null;
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
