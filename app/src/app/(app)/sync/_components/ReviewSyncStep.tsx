"use client";

import {Separator} from "@/components/ui/legacy-shadcn/separator";
import {cn} from "@/lib/utils";
import {useExtensionConnectionStore} from "@/store/use-extension-connection-store";
import {useSyncSetupStore} from "@/store/use-sync-setup-store";

interface ReviewRowProps {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}

function ReviewRow({label, value, last}: ReviewRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-3.5 py-2.5",
        !last && "border-border border-b",
      )}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right font-medium">{value}</span>
    </div>
  );
}

export default function ReviewSyncStep() {
  const {provider} = useSyncSetupStore();
  const extensionUser = useExtensionConnectionStore((state) => state.user);

  return (
    <div className="flex flex-col text-[14px]">
      <div className="px-6 pb-6">
        <p className="text-muted-foreground leading-relaxed">
          Review your setup before starting the sync. Everything below reflects the choices you made
          in the previous steps.
        </p>
      </div>

      <Separator />

      {/* Connection */}
      <div className="px-6 py-5">
        <div className="text-foreground mb-3 text-[15px] font-[550]">Connection</div>

        <div className="border-border divide-border divide-y overflow-hidden rounded-[10px] border">
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <span className="text-muted-foreground">Method</span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-foreground text-sm font-medium">
                {provider?.name ?? "X"} - Extension
              </span>
            </div>
          </div>

          {extensionUser ? (
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="text-muted-foreground shrink-0">Account</span>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <p className="text-foreground text-sm leading-tight font-[550]">
                    {extensionUser.name}
                  </p>
                  <p className="text-muted-foreground text-xs leading-tight">/</p>
                  <p className="text-muted-foreground text-xs leading-tight">
                    @{extensionUser.screenName}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
              <span className="text-muted-foreground">Account</span>
              <span className="text-muted-foreground text-sm italic">Not connected</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Preferences */}
      <div className="px-6 py-5">
        <div className="text-foreground mb-3 text-[15px] font-[550]">Preferences</div>

        <div className="border-border overflow-hidden rounded-[10px] border">
          <ReviewRow label="Sync mode" value="Keep synced automatically" />
          <ReviewRow label="Skip duplicates" value="On" />
          <ReviewRow label="Default collection" value="None" last />
        </div>
      </div>
    </div>
  );
}
