"use client";

import {useState} from "react";
import {cn} from "@/lib/utils";
import {X_SYNC_METHODS, type XSyncMethod} from "./_options/x-sync-method-types";
import {XExtensionOption} from "./_options/XExtensionOption";
import {XOAuthOption} from "./_options/XOAuthOption";
import {XCookiesOption} from "./_options/XCookiesOption";
import {XExportOption} from "./_options/XExportOption";
import {XHarOption} from "./_options/XHarOption";
import {useXExtensionConnectionStore} from "./use-x-extension-connection-store";

type ConnectionStatus = "idle" | "checking" | "connected" | "error";

export const XConnectStep = () => {
  const [selectedMethod, setSelectedMethod] = useState<XSyncMethod>("extension");
  const [verificationStatus, setVerificationStatus] = useState<ConnectionStatus>("idle");

  // extension connection store
  const extensionUser = useXExtensionConnectionStore((state) => state.user);
  const loadExtensionUser = useXExtensionConnectionStore((state) => state.loadUser);
  const connectionStatus: ConnectionStatus = extensionUser ? "connected" : verificationStatus;

  const handleVerifyConnection = async () => {
    setVerificationStatus("checking");
    const user = await loadExtensionUser();
    setVerificationStatus(user ? "idle" : "error");
  };

  return (
    <div className="flex flex-col gap-4 px-6 pb-2">
      {/* Method selector */}
      <div className="border-border divide-border divide-y overflow-hidden rounded-[10px] border">
        {X_SYNC_METHODS.map((m) => {
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
          <XExtensionOption
            connectionStatus={connectionStatus}
            onVerify={handleVerifyConnection}
            onReVerify={handleVerifyConnection}
          />
        )}

        {selectedMethod === "oauth" && <XOAuthOption />}

        {selectedMethod === "cookies" && <XCookiesOption />}

        {selectedMethod === "export" && <XExportOption />}

        {selectedMethod === "har" && <XHarOption />}
      </div>
    </div>
  );
};
