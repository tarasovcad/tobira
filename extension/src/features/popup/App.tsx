import { useEffect, useState } from "react";

import { AccountConnectedPage, ConnectAccountPage } from "./pages/TobiraConnectionPages";
import { MainPage } from "./pages/MainPage";
import type { ProviderId } from "./providers/providers";

const CONNECTION_DELAY_MS = 3_000;

function App() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMainPage, setIsMainPage] = useState(false);
  const [activeProviderId, setActiveProviderId] = useState<ProviderId | null>(null);
  const [connectedProviderIds, setConnectedProviderIds] = useState<ProviderId[]>([]);

  useEffect(() => {
    if (!isConnecting) return;

    const confirmationTimer = window.setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, CONNECTION_DELAY_MS);

    return () => window.clearTimeout(confirmationTimer);
  }, [isConnecting]);

  const logOut = () => {
    setIsConnecting(false);
    setIsConnected(false);
    setIsMainPage(false);
    setActiveProviderId(null);
  };

  const connectProvider = (id: ProviderId) => {
    setConnectedProviderIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  if (isMainPage) {
    return (
      <MainPage
        activeProviderId={activeProviderId}
        connectedProviderIds={connectedProviderIds}
        onCloseProvider={() => setActiveProviderId(null)}
        onConnectProvider={connectProvider}
        onSelectProvider={setActiveProviderId}
        onLogOut={logOut}
      />
    );
  }

  if (isConnected) {
    return <AccountConnectedPage onContinue={() => setIsMainPage(true)} />;
  }

  return <ConnectAccountPage isConnecting={isConnecting} onConnect={() => setIsConnecting(true)} />;
}

export default App;
