import {DownloadIcon, RefreshCwIcon} from "lucide-react";

import {cn} from "@/lib/utils";

export type SyncMode = "automatic" | "once";

export function syncModeLabel(mode: SyncMode): string {
  return mode === "automatic" ? "Auto-sync" : "Import";
}

export function SyncModeTooltipContent({mode}: {mode: SyncMode}) {
  const isAutoSync = mode === "automatic";

  return (
    <span className="flex items-start gap-2 py-0.5">
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px]",
          isAutoSync
            ? "bg-indigo-500/10 dark:bg-indigo-400/15"
            : "bg-teal-500/10 dark:bg-teal-400/15",
        )}>
        {isAutoSync ? (
          <RefreshCwIcon className="size-3 text-indigo-600/90 dark:text-indigo-300/90" />
        ) : (
          <DownloadIcon className="size-3 text-teal-600/90 dark:text-teal-300/90" />
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium">{syncModeLabel(mode)}</span>
        <span className="text-muted-foreground leading-snug">
          {isAutoSync
            ? "This source stays connected in the background and updates when new items are found."
            : "This is a one-time import. If you add more items later, you need to import again."}
        </span>
      </span>
    </span>
  );
}
