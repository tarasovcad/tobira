import Spinner from "@/components/ui/app/spinner";
import {ConnectExtensionLogo, ConnectExtensionShell} from "./_components/ConnectExtensionView";

export default function ConnectExtensionLoading() {
  return (
    <ConnectExtensionShell>
      <ConnectExtensionLogo />

      <div role="status" aria-live="polite" className="flex flex-col items-center text-center">
        <Spinner className="text-muted-foreground mb-3 size-4" />
        <p className="text-muted-foreground text-sm">Checking connection...</p>
      </div>
    </ConnectExtensionShell>
  );
}
