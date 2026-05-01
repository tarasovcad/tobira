import { useEffect, useState } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import Spinner from "../../components/ui/spinner";

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

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.633 5.903-5.633Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function App() {
  const [status, setStatus] = useState<Status>("checking");
  const [user, setUser] = useState<XUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUser = async () => {
    setUserLoading(true);
    try {
      const res = await browser.runtime.sendMessage({ type: "FETCH_X_USER" });
      if (res?.name) setUser(res);
    } finally {
      setUserLoading(false);
    }
  };

  const checkAuth = async (isManualRefresh = false) => {
    if (!isManualRefresh) setStatus("checking");
    else setIsRefreshing(true);
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
    } finally {
      if (isManualRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const initials = user
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "X";

  return (
    <div className="w-72 bg-background font-sans text-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <img
            src="/logo/dark-logo.svg"
            alt=""
            className="size-6 shrink-0 object-contain"
          />
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon-xs">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.62491 2.06909C6.93134 1.60944 7.44721 1.33334 7.99967 1.33334C8.55214 1.33334 9.06801 1.60944 9.37441 2.06909L9.63247 2.4562C9.89821 2.85472 10.3828 3.04717 10.8495 2.93947L11.1041 2.88072C11.6685 2.75046 12.2603 2.92017 12.6699 3.32979C13.0795 3.73941 13.2492 4.33114 13.1189 4.8956L13.0602 5.15016C12.9525 5.61686 13.1449 6.1015 13.5435 6.36718L13.9306 6.62525C14.3903 6.93168 14.6663 7.44754 14.6663 8.00001C14.6663 8.55248 14.3903 9.06834 13.9306 9.37474L13.5435 9.63281C13.1449 9.89854 12.9525 10.3831 13.0602 10.8499L13.1189 11.1044C13.2492 11.6689 13.0795 12.2606 12.6699 12.6702C12.2603 13.0799 11.6685 13.2495 11.1041 13.1193L10.8495 13.0605C10.3828 12.9529 9.89821 13.1453 9.63247 13.5438L9.37441 13.9309C9.06801 14.3906 8.55214 14.6667 7.99967 14.6667C7.44721 14.6667 6.93134 14.3906 6.62491 13.9309L6.36684 13.5438C6.10116 13.1453 5.61653 12.9529 5.14983 13.0605L4.89526 13.1193C4.33081 13.2495 3.73907 13.0799 3.32945 12.6702C2.91984 12.2606 2.75013 11.6689 2.88039 11.1044L2.93913 10.8499C3.04683 10.3831 2.85439 9.89854 2.45587 9.63281L2.06875 9.37474C1.6091 9.06834 1.33301 8.55248 1.33301 8.00001C1.33301 7.44754 1.6091 6.93168 2.06875 6.62525L2.45587 6.36718C2.85439 6.1015 3.04683 5.61686 2.93913 5.15016L2.88039 4.8956C2.75013 4.33115 2.91983 3.73941 3.32945 3.32979C3.73907 2.92017 4.33081 2.75046 4.89526 2.88072L5.14983 2.93947C5.61653 3.04717 6.10116 2.85472 6.36684 2.4562L6.62491 2.06909ZM5.91634 8.00001C5.91634 6.84941 6.84907 5.91668 7.99967 5.91668C9.15027 5.91668 10.083 6.84941 10.083 8.00001C10.083 9.15061 9.15027 10.0833 7.99967 10.0833C6.84907 10.0833 5.91634 9.15061 5.91634 8.00001Z"
                fill="currentColor"
              />
            </svg>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Close"
            onClick={() => window.close()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M4.16699 4.16667L11.8337 11.8333M11.8337 4.16667L4.16699 11.8333"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Button>
        </div>
      </div>

      <Separator />

      <div className="px-4 py-3 space-y-3">
        {/* Checking */}
        {status === "checking" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Spinner className="size-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Checking connection…
            </span>
          </div>
        )}

        {/* Connected */}
        {status === "connected" && (
          <div className="space-y-3">
            {userLoading ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5">
                <div className="size-9 rounded-full bg-muted-strong animate-pulse shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-2.5 w-24 rounded bg-muted-strong animate-pulse" />
                  <div className="h-2 w-16 rounded bg-muted-strong animate-pulse" />
                </div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5">
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-xs truncate leading-tight">
                    {user.name}
                  </p>
                  <p className="text-muted-foreground text-[11px] truncate leading-tight mt-0.5">
                    @{user.screenName}
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  Live
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
                <div className="size-1.5 rounded-full bg-success shrink-0" />
                <span className="text-xs font-medium text-foreground">
                  Connected to X
                </span>
              </div>
            )}
          </div>
        )}

        {/* Disconnected */}
        {status === "disconnected" && (
          <div className="space-y-3">
            <div className="flex items-center gap-1 flex-col text-center py-2">
              <div className="relative mb-3">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-px origin-bottom-left -translate-x-0.5 -rotate-10 scale-84 flex size-9 shrink-0 items-center justify-center rounded-md border bg-card text-foreground shadow-sm/5"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-px origin-bottom-right translate-x-0.5 rotate-10 scale-84 flex size-9 shrink-0 items-center justify-center rounded-md border bg-card text-foreground shadow-sm/5"
                />
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-md border bg-card text-foreground shadow-sm/5">
                  <XLogo className="size-4.5" />
                </div>
              </div>
              <p className="text-[15px] font-medium text-foreground">
                Not connected
              </p>
              <p className="text-[13px] text-muted-foreground">
                Sign in to X to enable sync
              </p>
            </div>
            <Button
              className="w-full gap-2 text-[13px]"
              size="xs"
              render={
                <a
                  href="https://x.com/login"
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              Log in to X
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      {status !== "checking" && (
        <>
          <Separator />
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {status === "connected" ? "Syncing active" : "Sync paused"}
            </span>
            <Button
              variant="ghost"
              size="xs"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => checkAuth(true)}
              disabled={isRefreshing}
            >
              {isRefreshing && <Spinner className="size-3" />}
              Refresh
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
