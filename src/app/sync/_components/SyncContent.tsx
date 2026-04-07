"use client";

import React from "react";
import {ProviderRow} from "./ProviderRow";
import {MOCK_PROVIDERS, MOCK_SUMMARY} from "./mock-data";

function SummaryMetric({label, value}: {label: string; value: string | number}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-foreground text-sm font-medium tabular-nums">{value}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

export function SyncContent() {
  const summary = MOCK_SUMMARY;

  return (
    <div className="flex h-full w-full overflow-auto">
      <div className="min-h-0 flex-1 overflow-auto px-5 py-12">
        <div className="mx-auto max-w-[840px] space-y-8">
          {/* Page header */}
          <div className="space-y-0.5">
            <h1 className="text-foreground text-xl font-[550]">Sync</h1>
            <p className="text-muted-foreground text-sm">
              Connect external sources to automatically import bookmarks, articles, and content into
              your library.
            </p>
          </div>

          {/* Summary metrics */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 border-b pb-8">
            <SummaryMetric
              label="Connected providers"
              value={`${summary.connectedProviders} / ${summary.totalProviders}`}
            />
            <SummaryMetric
              label="Last sync"
              value={summary.lastSyncLabel}
            />
            <SummaryMetric
              label="Items imported"
              value={summary.totalItems.toLocaleString()}
            />
          </div>

          {/* Provider list */}
          <div className="rounded-md border">
            {MOCK_PROVIDERS.map((provider) => (
              <ProviderRow key={provider.id} provider={provider} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
