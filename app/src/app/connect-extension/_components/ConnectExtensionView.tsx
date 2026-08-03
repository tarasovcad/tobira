import Image from "next/image";
import Link from "next/link";

import {Button} from "@/components/ui/coss/button";
import {ApproveExtensionButton} from "./ApproveExtensionButton";

export type ConnectExtensionViewState =
  | {kind: "pending"; code: string}
  | {kind: "signed-out"; code: string}
  | {kind: "missing-code"}
  | {kind: "invalid-code"}
  | {kind: "not-found"}
  | {kind: "expired"; code?: string}
  | {kind: "cancelled"; code?: string}
  | {kind: "connected"};

type ConnectExtensionViewProps = {
  state: ConnectExtensionViewState;
};

type ConnectExtensionShellProps = {
  children: React.ReactNode;
};

export function ConnectExtensionShell({children}: ConnectExtensionShellProps) {
  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center">
      <div className="flex w-full max-w-[420px] flex-col items-center px-8">{children}</div>
    </main>
  );
}

export function ConnectExtensionLogo() {
  return (
    <div className="mb-3.5 flex items-center justify-center">
      <div className="border-muted-foreground/40 relative flex h-14 w-14 items-center justify-center rounded-lg border border-dashed">
        <Image
          src="/logo/dark-logo.svg"
          alt="Tobira Logo"
          width={30}
          height={30}
          className="dark:invert"
        />
      </div>
    </div>
  );
}

export function ConnectExtensionView({state}: ConnectExtensionViewProps) {
  return (
    <ConnectExtensionShell>
      <ConnectExtensionLogo />

      {state.kind === "pending" && <PendingState code={state.code} />}
      {state.kind === "signed-out" && <SignedOutState code={state.code} />}
      {state.kind === "missing-code" && (
        <TerminalState
          title="Missing connection code"
          description='Open the Tobira extension and choose "Connect to Tobira" to start.'
        />
      )}
      {state.kind === "invalid-code" && (
        <TerminalState
          title="Invalid connection link"
          description="This code is incomplete or incorrect. Start again from the Tobira extension."
        />
      )}
      {state.kind === "not-found" && (
        <TerminalState
          title="Request not found"
          description="This request may have expired or already been used. Start again from the extension."
        />
      )}
      {state.kind === "expired" && (
        <TerminalState
          title="Code expired"
          description="Connection codes expire after 5 minutes. Return to the extension and try again."
        />
      )}
      {state.kind === "cancelled" && (
        <TerminalState
          title="Connection cancelled"
          description="No account access was granted. You can close this tab or start again from the extension."
        />
      )}
      {state.kind === "connected" && (
        <TerminalState
          title="Account connected"
          description="You can close this tab and return to the extension."
          actionLabel="Go to Tobira"
        />
      )}
    </ConnectExtensionShell>
  );
}

function PageHeader({title, description}: {title: string; description: string}) {
  return (
    <div className="max-w-[360px]">
      <h1
        id="connect-extension-title"
        className="text-foreground text-center text-[22px] font-medium tracking-tight">
        {title}
      </h1>
      <p className="text-muted-foreground mt-1.5 mb-6 w-full text-center text-sm">{description}</p>
    </div>
  );
}

function PendingState({code}: {code: string}) {
  return (
    <section className="w-full" aria-labelledby="connect-extension-title">
      <PageHeader
        title="Connect Tobira extension"
        description="Make sure this code matches the one in your extension."
      />

      <PairingCode code={code} />

      <ApproveExtensionButton code={code} />

      <div className="mt-2">
        <Button variant="ghost" size="lg" className="w-full" render={<Link href="/home" />}>
          Cancel
        </Button>
      </div>

      <p className="text-muted-foreground mt-5 text-center text-xs leading-5">
        Can view basic account info and manage this connection.
      </p>
    </section>
  );
}

function SignedOutState({code}: {code: string}) {
  return (
    <section className="w-full" aria-labelledby="connect-extension-title">
      <PageHeader
        title="Sign in to continue"
        description="Sign in to Tobira, then confirm this extension connection."
      />

      <PairingCode code={code} />

      <div className="mt-8">
        <Button size="lg" className="w-full rounded-lg" disabled aria-disabled="true">
          Sign in to continue
        </Button>
      </div>
    </section>
  );
}

function PairingCode({code}: {code: string}) {
  return (
    <div className="w-full text-center">
      <code
        aria-label={`Connection code ${code.replace("-", " ").split("").join(" ")}`}
        className="text-foreground block font-mono text-[1.75rem] leading-none font-medium tracking-[0.2em] tabular-nums sm:text-[1.875rem]">
        {code}
      </code>
    </div>
  );
}

function TerminalState({
  title,
  description,
  actionLabel = "Back to Tobira",
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <section className="w-full" aria-labelledby="connect-extension-title">
      <PageHeader title={title} description={description} />

      <Button size="lg" className="w-full rounded-lg" render={<Link href="/home" />}>
        {actionLabel}
      </Button>
    </section>
  );
}
