import { useEffect, useState } from "react";

type AuthResponse = {
  connected: boolean;
};

type XUser = {
  name: string;
  screenName: string;
  avatar: string;
  userId: string;
};

type Status = "checking" | "connected" | "disconnected";

function App() {
  const [status, setStatus] = useState<Status>("checking");
  const [user, setUser] = useState<XUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  const fetchUser = async () => {
    setUserLoading(true);
    try {
      const res = await browser.runtime.sendMessage({ type: "FETCH_X_USER" });
      if (res?.name) setUser(res);
    } finally {
      setUserLoading(false);
    }
  };

  const checkAuth = async () => {
    setStatus("checking");
    setUser(null);
    try {
      const response: AuthResponse = await browser.runtime.sendMessage({
        type: "CHECK_X_AUTH",
      });
      const connected = response?.connected ?? false;
      setStatus(connected ? "connected" : "disconnected");
      if (connected) fetchUser();
    } catch {
      setStatus("disconnected");
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="w-72 bg-white font-sans text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-gray-900">Tobira</span>
        <span className="text-xs text-gray-400">X Sync</span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Checking spinner */}
        {status === "checking" && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
            <span className="text-xs">Checking connection...</span>
          </div>
        )}

        {/* Connected — user profile card */}
        {status === "connected" && (
          <div className="space-y-3">
            {userLoading ? (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                  <div className="h-2.5 bg-gray-200 rounded animate-pulse w-16" />
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full shrink-0 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-xs truncate">
                    {user.name}
                  </p>
                  <p className="text-gray-400 text-[11px] truncate">
                    @{user.screenName}
                  </p>
                </div>
                <div
                  className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                  title="Connected"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span className="text-xs font-medium text-green-800">
                  Connected to X
                </span>
              </div>
            )}
          </div>
        )}

        {/* Disconnected */}
        {status === "disconnected" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span className="text-xs font-medium text-red-800">
                Not connected to X
              </span>
            </div>
            <a
              href="https://x.com/login"
              target="_blank"
              rel="noreferrer"
              className="block text-center text-xs font-medium bg-gray-900 text-white rounded-md py-2 hover:bg-gray-700 transition-colors"
            >
              Log in to X
            </a>
          </div>
        )}

        {/* Check again */}
        {status !== "checking" && (
          <button
            onClick={checkAuth}
            className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Check again
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
