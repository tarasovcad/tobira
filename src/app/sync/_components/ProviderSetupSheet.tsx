"use client";

import React, {useState} from "react";
import {
  Sheet,
  SheetTrigger,
  SheetPopup,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetPanel,
  SheetFooter,
  SheetClose,
} from "@/components/coss-ui/sheet";
import {Button} from "@/components/coss-ui/button";
import type {SyncProvider} from "./types";
import {IMPORT_TYPE_LABELS} from "./ProviderRow";

interface ProviderSetupSheetProps {
  provider: SyncProvider;
  children: React.ReactNode;
}

export function ProviderSetupSheet({provider, children}: ProviderSetupSheetProps) {
  const [step, setStep] = useState<"idle" | "connecting" | "done">("idle");

  function handleConnect() {
    setStep("connecting");
    setTimeout(() => setStep("done"), 1500);
  }

  const isConnected = provider.status === "connected";
  const isError = provider.status === "error";

  return (
    <Sheet>
      <SheetTrigger render={<span />}>{children}</SheetTrigger>
      <SheetPopup side="right">
        <SheetHeader>
          <SheetTitle>{provider.name}</SheetTitle>
          <SheetDescription>{provider.description}</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <div className="space-y-6">
            {/* Import types */}
            <div className="space-y-2">
              <p className="text-foreground text-sm font-medium">Imports</p>
              <div className="flex flex-wrap gap-1.5">
                {provider.importTypes.map((t) => (
                  <span
                    key={t}
                    className="bg-muted text-muted-foreground rounded-sm px-2 py-0.5 text-xs">
                    {IMPORT_TYPE_LABELS[t]}
                  </span>
                ))}
              </div>
            </div>

            {/* Routing hint */}
            {provider.routingHint && (
              <div className="space-y-1">
                <p className="text-foreground text-sm font-medium">Destination</p>
                <p className="text-muted-foreground text-sm">{provider.routingHint}</p>
              </div>
            )}

            {/* Status info */}
            {isConnected && provider.lastSync && (
              <div className="space-y-1">
                <p className="text-foreground text-sm font-medium">Last sync</p>
                <p className="text-muted-foreground text-sm">{provider.lastSync}</p>
              </div>
            )}

            {isError && (
              <div className="bg-muted rounded-md border p-3">
                <p className="text-foreground text-sm font-medium">Authentication required</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Your connection has expired. Reconnect to resume syncing.
                </p>
              </div>
            )}

            {step === "done" && (
              <div className="bg-muted rounded-md border p-3">
                <p className="text-foreground text-sm font-medium">Connected</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {provider.name} has been connected. Your first sync will begin shortly.
                </p>
              </div>
            )}

            {/* Mock OAuth prompt */}
            {!isConnected && step === "idle" && (
              <div className="space-y-1">
                <p className="text-foreground text-sm font-medium">Authorization</p>
                <p className="text-muted-foreground text-sm">
                  You will be redirected to {provider.name} to authorize read access to your
                  library. No write permissions are requested.
                </p>
              </div>
            )}
          </div>
        </SheetPanel>

        <SheetFooter variant="bare">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          {step === "done" ? (
            <SheetClose render={<Button />}>Done</SheetClose>
          ) : (
            <Button onClick={handleConnect} disabled={step === "connecting"}>
              {step === "connecting"
                ? "Connecting…"
                : isError
                  ? (provider.reconnectLabel ?? "Reconnect")
                  : isConnected
                    ? "Manage"
                    : (provider.connectLabel ?? "Connect")}
            </Button>
          )}
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
