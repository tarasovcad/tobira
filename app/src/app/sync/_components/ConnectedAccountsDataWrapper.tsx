import {db} from "@/db";
import {syncConnections, syncItems} from "@/db/schema";
import {and, asc, count, eq, ne} from "drizzle-orm";
import {PROVIDERS} from "@/app/sync/_lib/sync-providers";
import {
  ConnectedAccountsSection,
  type ConnectedAccount,
  type ConnectionStatus,
} from "./ConnectedAccountsSection";

export const ConnectedAccountsSkeleton = () => {
  return (
    <div className="mb-16 space-y-4">
      <div className="bg-muted h-5 w-44 animate-pulse rounded" />
      <div className="divide-border divide-y">
        {Array.from({length: 4}).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="bg-muted size-[18px] animate-pulse rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="bg-muted h-4 w-32 animate-pulse rounded" />
            </div>
            <div className="bg-muted h-5 w-16 animate-pulse rounded-full" />
            <div className="bg-muted hidden h-4 w-20 animate-pulse rounded md:block" />
            <div className="bg-muted hidden h-4 w-20 animate-pulse rounded lg:block" />
            <div className="bg-muted h-7 w-20 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ConnectedAccountsDataWrapper = async ({userId}: {userId: string}) => {
  const rows = await db
    .select({
      id: syncConnections.id,
      provider: syncConnections.provider,
      externalUsername: syncConnections.externalUsername,
      externalDisplayName: syncConnections.externalDisplayName,
      label: syncConnections.label,
      status: syncConnections.status,
      lastSyncedAt: syncConnections.lastSyncedAt,
      itemCount: count(syncItems.id),
    })
    .from(syncConnections)
    .leftJoin(
      syncItems,
      and(eq(syncItems.connectionId, syncConnections.id), eq(syncItems.status, "active")),
    )
    .where(and(eq(syncConnections.userId, userId), ne(syncConnections.status, "disconnected")))
    .groupBy(syncConnections.id)
    .orderBy(asc(syncConnections.createdAt));

  const accounts: ConnectedAccount[] = rows.map((row) => {
    const meta = getProviderMeta(row.provider);
    return {
      id: row.id,
      provider: meta.name,
      account: row.externalUsername ?? row.externalDisplayName ?? row.label,
      status: mapConnectionStatus(row.status),
      lastSync: row.lastSyncedAt ? formatRelativeTime(row.lastSyncedAt) : "Never",
      itemsImported: formatItemCount(row.itemCount, row.provider),
    };
  });

  return <ConnectedAccountsSection initialAccounts={accounts} />;
};

function getProviderMeta(provider: string): {name: string} {
  const match = PROVIDERS.find((p) => p.name.toLowerCase() === provider.toLowerCase());
  return {name: match?.name ?? provider};
}

function mapConnectionStatus(status: string): ConnectionStatus {
  if (status === "healthy" || status === "syncing" || status === "warning" || status === "error") {
    return status;
  }
  if (status === "paused") return "warning";
  return "error";
}

function formatItemCount(n: number, provider: string): string {
  const count = n.toLocaleString();
  switch (provider.toLowerCase()) {
    case "youtube":
      return `${count} videos`;
    case "dribbble":
      return `${count} shots`;
    case "chrome":
    case "firefox":
    case "safari":
    case "arc":
    case "dia":
      return `${count} links`;
    default:
      return `${count} items`;
  }
}

function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "Just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}
