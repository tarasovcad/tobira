"use client";

import {useState} from "react";
import {cn} from "@/lib/utils";
import {useExtensionConnectionStore} from "@/store/use-extension-connection-store";
import {useSyncSetupStore} from "@/store/use-sync-setup-store";
import {SYNC_METHODS, type SyncMethod} from "./_options/sync-method-types";
import {ExtensionOption} from "./_options/ExtensionOption";
import {OAuthOption} from "./_options/OAuthOption";
import {CookiesOption} from "./_options/CookiesOption";
import {ExportOption} from "./_options/ExportOption";
import {HarOption} from "./_options/HarOption";

type ConnectionStatus = "idle" | "checking" | "connected" | "error";

export const ConnectSyncStep = () => {
  const {provider} = useSyncSetupStore();
  const [selectedMethod, setSelectedMethod] = useState<SyncMethod>("extension");
  const [verificationStatus, setVerificationStatus] = useState<ConnectionStatus>("idle");

  // extension connection store
  const extensionUser = useExtensionConnectionStore((state) => state.user);
  const loadExtensionUser = useExtensionConnectionStore((state) => state.loadUser);
  const connectionStatus: ConnectionStatus = extensionUser ? "connected" : verificationStatus;

  const handleVerifyConnection = async () => {
    setVerificationStatus("checking");
    const user = await loadExtensionUser();
    setVerificationStatus(user ? "idle" : "error");
  };

  if (!provider) return null;

  return (
    <div className="flex flex-col gap-4 px-6 pb-2">
      {/* Method selector */}
      <div className="border-border divide-border divide-y overflow-hidden rounded-[10px] border">
        {SYNC_METHODS.map((m) => {
          const active = selectedMethod === m.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={m.disabled}
              onClick={() => !m.disabled && setSelectedMethod(m.id)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left",
                active ? "bg-muted-strong text-foreground" : "text-secondary bg-transparent",
                m.disabled
                  ? "cursor-not-allowed opacity-70 select-none"
                  : !active && "hover:bg-muted hover:text-foreground",
              )}>
              <div
                className={cn(
                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
                  active ? "border-highlight bg-highlight" : "border-muted-foreground/35",
                )}>
                {active && <div className="h-1 w-1 rounded-full bg-white" />}
              </div>

              <div className="flex w-full items-center gap-2">
                <m.icon className="shrink-0 opacity-70" />
                <span className="flex-1 text-sm font-medium">{m.label}</span>
              </div>

              {m.badge && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-[550] tracking-wide uppercase",
                    m.badgeVariant === "recommended"
                      ? "bg-highlight/12 text-blue-400"
                      : "bg-muted text-muted-foreground/70",
                  )}>
                  {m.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="py-4.5">
        {selectedMethod === "extension" && (
          <ExtensionOption
            connectionStatus={connectionStatus}
            onVerify={handleVerifyConnection}
            onReVerify={handleVerifyConnection}
          />
        )}

        {selectedMethod === "oauth" && (
          <OAuthOption providerName={provider.name} providerImage={provider.image} />
        )}

        {selectedMethod === "cookies" && <CookiesOption />}

        {selectedMethod === "export" && <ExportOption />}

        {selectedMethod === "har" && <HarOption />}
      </div>
    </div>
  );
};
