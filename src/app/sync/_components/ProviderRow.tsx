"use client";

import React from "react";
import {cn} from "@/lib/utils/classnames";
import type {ImportType, SyncProvider} from "./types";
import {ProviderSetupSheet} from "./ProviderSetupSheet";
import {Button} from "@/components/coss-ui/button";

export const IMPORT_TYPE_LABELS: Record<ImportType, string> = {
  bookmarks: "Bookmarks",
  rss: "RSS",
  articles: "Articles",
  videos: "Videos",
  notes: "Notes",
  highlights: "Highlights",
};

function StatusDot({status}: {status: SyncProvider["status"]}) {
  return (
    <span
      className={cn(
        "mt-[3px] inline-block size-1.5 shrink-0 rounded-full",
        status === "connected" && "bg-foreground",
        status === "error" && "bg-foreground",
        status === "disconnected" && "bg-border",
        status === "coming_soon" && "bg-border",
      )}
    />
  );
}

function StatusLabel({status, lastSync}: {status: SyncProvider["status"]; lastSync?: string}) {
  if (status === "connected") {
    return (
      <span className="text-muted-foreground text-xs">
        {lastSync ? `Synced ${lastSync}` : "Connected"}
      </span>
    );
  }
  if (status === "error") {
    return <span className="text-muted-foreground text-xs">Needs reconnection</span>;
  }
  if (status === "coming_soon") {
    return <span className="text-muted-foreground text-xs">Coming soon</span>;
  }
  return <span className="text-muted-foreground text-xs">Not connected</span>;
}

interface ProviderRowProps {
  provider: SyncProvider;
}

export function ProviderRow({provider}: ProviderRowProps) {
  const isComingSoon = provider.status === "coming_soon";
  const isError = provider.status === "error";

  const actionLabel =
    provider.status === "connected"
      ? "Manage"
      : isError
        ? (provider.reconnectLabel ?? "Reconnect")
        : (provider.connectLabel ?? "Connect");

  const row = (
    <div
      className={cn(
        "flex items-start gap-4 border-b px-5 py-4 last:border-b-0",
        "transition-colors",
        isComingSoon ? "opacity-50" : "hover:bg-muted/40",
      )}>
      {/* Left: name + description + types */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-foreground text-sm font-medium leading-snug",
            isComingSoon && "text-muted-foreground",
          )}>
          {provider.name}
        </p>
        <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
          {provider.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {provider.importTypes.map((t) => (
            <span
              key={t}
              className="bg-muted text-muted-foreground rounded-sm px-1.5 py-px text-xs">
              {IMPORT_TYPE_LABELS[t]}
            </span>
          ))}
        </div>
      </div>

      {/* Right: status + routing hint + action */}
      <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
        <div className="flex items-start gap-1.5">
          <StatusDot status={provider.status} />
          <div className="flex flex-col items-end gap-0.5">
            <StatusLabel status={provider.status} lastSync={provider.lastSync} />
            {provider.routingHint && provider.status !== "coming_soon" && (
              <span className="text-muted-foreground text-xs opacity-70">
                {provider.routingHint}
              </span>
            )}
          </div>
        </div>

        {!isComingSoon && (
          <Button
            size="sm"
            variant={isError ? "outline" : provider.status === "connected" ? "outline" : "outline"}
            className={cn(
              "h-7 text-xs",
              isError && "border-foreground/20",
            )}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );

  if (isComingSoon) {
    return row;
  }

  return <ProviderSetupSheet provider={provider}>{row}</ProviderSetupSheet>;
}
