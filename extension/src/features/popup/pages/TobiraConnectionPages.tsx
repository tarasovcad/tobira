import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import type { TobiraConnectionUser } from "@/lib/tobira-connection-storage";
import { CloseButton } from "../components/CloseButton";

export function AccountConnectedPage({
  user,
  onContinue,
}: {
  user: TobiraConnectionUser;
  onContinue: () => void;
}) {
  return (
    <div className="relative w-72 select-none bg-background font-sans text-sm">
      <CloseButton className="absolute top-3 right-3" />

      <div className="flex flex-col items-center px-5 pt-8 pb-5 text-center">
        <div className="relative mb-4">
          <div className="flex size-11 items-center justify-center rounded-xl border bg-card shadow-xs">
            <img src="/logo/dark-logo.svg" alt="" className="size-6 shrink-0 object-contain" />
          </div>
          <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-success text-white">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 6.25L5.05 8.3L9.25 4.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-[16px] leading-snug font-medium tracking-tight text-foreground">
          Account connected
        </h1>
        <p className="mt-1 max-w-[17rem] text-[13px] leading-relaxed text-muted-foreground">
          {user.email} is now connected to this browser.
        </p>

        <Button className="mt-4 w-full text-[13px]" size="xs" onClick={onContinue}>
          Next
        </Button>
      </div>
    </div>
  );
}

type ConnectAccountPageProps = {
  error?: string | null;
  expiresAt?: string;
  isConnecting: boolean;
  userCode?: string;
  onConnect: () => void;
  onReopen: () => void;
};

export function ConnectAccountPage({
  error,
  expiresAt,
  isConnecting,
  userCode,
  onConnect,
  onReopen,
}: ConnectAccountPageProps) {
  return (
    <div className="relative w-72 select-none bg-background font-sans text-sm">
      <CloseButton className="absolute top-3 right-3" />

      <div className="flex flex-col items-center px-5 pt-8 pb-5 text-center">
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl border bg-card">
          <img src="/logo/dark-logo.svg" alt="" className="size-6 shrink-0 object-contain" />
        </div>

        <h1 className="text-[16px] leading-snug font-medium tracking-tight text-foreground">
          Bring your saves together
        </h1>
        <p className="mt-1 max-w-[17rem] text-[13px] leading-relaxed text-muted-foreground">
          Import and sync your saved content from all your sources.
        </p>

        <Button
          className="mt-4 w-full gap-2 text-[13px]"
          size="xs"
          disabled={isConnecting}
          onClick={onConnect}
        >
          {isConnecting ? (
            <>
              <Spinner className="size-3.5" />
              Waiting for confirmation
            </>
          ) : (
            "Connect to Tobira"
          )}
        </Button>

        {isConnecting && (
          <Button className="mt-2 w-full text-[13px]" size="xs" variant="ghost" onClick={onReopen}>
            Return to confirmation
          </Button>
        )}

        {isConnecting && userCode && (
          <div className="mt-3 rounded-lg border border-dashed py-2.5 text-left w-full px-3">
            <p className="text-[12px] text-muted-foreground">
              Confirm this code on the Tobira page:
            </p>
            <p className="font-mono mt-0.5 text-[13px] font-semibold text-foreground">{userCode}</p>
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs leading-relaxed text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function formatExpiry(value: string): string {
  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) return "soon";

  return expiresAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
