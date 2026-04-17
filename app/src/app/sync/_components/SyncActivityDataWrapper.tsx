import {db} from "@/db";
import {syncConnections, syncRuns} from "@/db/schema";
import {desc, eq} from "drizzle-orm";
import {PROVIDERS} from "@/app/sync/_lib/sync-providers";
import {
  SyncActivitySection,
  type SyncActivityItem,
  type SyncActivityStatus,
} from "./SyncActivitySection";

export const SyncActivitySkeleton = () => {
  return (
    <div className="divide-border divide-y">
      {Array.from({length: 6}).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-4">
          <div className="bg-muted size-5 animate-pulse rounded-full" />
          <div className="bg-muted size-5 animate-pulse rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="bg-muted h-4 w-48 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
};

export const SyncActivityDataWrapper = async ({userId}: {userId: string}) => {
  const runs = await db
    .select({
      id: syncRuns.id,
      status: syncRuns.status,
      startedAt: syncRuns.startedAt,
      finishedAt: syncRuns.finishedAt,
      createdAt: syncRuns.createdAt,
      itemsDiscovered: syncRuns.itemsDiscovered,
      itemsCreated: syncRuns.itemsCreated,
      itemsSkipped: syncRuns.itemsSkipped,
      duplicatesSkipped: syncRuns.duplicatesSkipped,
      itemsFailed: syncRuns.itemsFailed,
      errorMessage: syncRuns.errorMessage,
      provider: syncConnections.provider,
      externalUsername: syncConnections.externalUsername,
      externalDisplayName: syncConnections.externalDisplayName,
      label: syncConnections.label,
    })
    .from(syncRuns)
    .innerJoin(syncConnections, eq(syncRuns.connectionId, syncConnections.id))
    .where(eq(syncRuns.userId, userId))
    .orderBy(desc(syncRuns.startedAt))
    .limit(50);

  const activity: SyncActivityItem[] = runs.map((run) => {
    const meta = getProviderMeta(run.provider);
    return {
      id: run.id,
      provider: meta.name,
      account: run.externalUsername ?? run.externalDisplayName ?? run.label,
      status: mapRunStatus(run.status),
      time: run.startedAt ?? run.createdAt,
      duration: formatDuration(run.startedAt, run.finishedAt, run.status),
      items: formatItems(run),
      summary: formatSummary(run.status),
      details: formatDetails(run),
      color: meta.color,
    };
  });

  return <SyncActivitySection initialActivity={activity} />;
};

function getProviderMeta(provider: string): {name: string; color: string} {
  const match = PROVIDERS.find((p) => p.name.toLowerCase() === provider.toLowerCase());
  return {name: match?.name ?? provider, color: match?.color ?? "#888888"};
}

function mapRunStatus(status: string): SyncActivityStatus {
  if (status === "running" || status === "queued") return "running";
  if (status === "success") return "success";
  if (status === "partial_success") return "warning";
  return "error";
}

function formatDuration(
  startedAt: string | null,
  finishedAt: string | null,
  status: string,
): string {
  if (status === "running" || status === "queued" || !finishedAt) return "Live";
  if (!startedAt) return "—";
  const secs = Math.floor((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}m ${String(rem).padStart(2, "0")}s` : `${mins}m`;
}

function formatItems(run: {
  status: string;
  itemsDiscovered: number;
  itemsCreated: number;
  itemsSkipped: number;
  itemsFailed: number;
  duplicatesSkipped: number;
}): string {
  if (run.status === "running" || run.status === "queued") {
    return run.itemsDiscovered > 0
      ? `${run.itemsDiscovered.toLocaleString()} checked`
      : "Starting…";
  }
  if (run.itemsCreated > 0) return `${run.itemsCreated.toLocaleString()} imported`;
  if (run.itemsFailed > 0) return `${run.itemsFailed} failed`;
  if (run.itemsSkipped > 0) return `${run.itemsSkipped} skipped`;
  return "0 imported";
}

function formatSummary(status: string): string {
  switch (status) {
    case "queued":
      return "Sync queued";
    case "running":
      return "Sync in progress";
    case "success":
      return "Import completed";
    case "partial_success":
      return "Partial import";
    case "failed":
      return "Sync failed";
    case "cancelled":
      return "Sync cancelled";
    default:
      return "Unknown";
  }
}

function formatDetails(run: {
  status: string;
  itemsCreated: number;
  itemsSkipped: number;
  itemsFailed: number;
  duplicatesSkipped: number;
  errorMessage: string | null;
}): string {
  if (run.status === "running" || run.status === "queued") {
    return "Scanning and importing items. New items will appear as the run continues.";
  }
  if (run.status === "failed") {
    return run.errorMessage ?? "An error occurred during the sync. Please try reconnecting.";
  }
  if (run.status === "cancelled") {
    return "The sync run was cancelled before it completed.";
  }

  const parts: string[] = [];
  if (run.itemsCreated > 0) parts.push(`${run.itemsCreated.toLocaleString()} items imported`);
  if (run.duplicatesSkipped > 0) parts.push(`${run.duplicatesSkipped} duplicates skipped`);
  if (run.itemsSkipped > 0) parts.push(`${run.itemsSkipped} skipped`);
  if (run.itemsFailed > 0) parts.push(`${run.itemsFailed} failed`);
  return parts.length > 0 ? `${parts.join(", ")}.` : "No new items found.";
}
