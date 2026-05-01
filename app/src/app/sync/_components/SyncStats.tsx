import {db} from "@/db";
import {syncConnections, syncEvents, syncItems} from "@/db/schema";
import {and, count, eq, isNull, max, ne} from "drizzle-orm";

export const SyncStatsSkeleton = () => {
  return (
    <div className="border-border mt-4 flex items-center gap-5.5 border-t pt-4">
      <StatSkeleton maxWidth={152.93} />
      <div className="bg-border h-7 w-px" aria-hidden />
      <StatSkeleton maxWidth={107.09} />
      <div className="bg-border h-7 w-px" aria-hidden />
      <StatSkeleton maxWidth={70.65} />
      <div className="bg-border h-7 w-px" aria-hidden />
      <StatSkeleton maxWidth={108.46} />
    </div>
  );
};

export const SyncStats = async ({userId}: {userId: string}) => {
  const [[{connectedAccounts}], [{importedItems}], [{lastSyncedAt}], [{needAttention}]] =
    await Promise.all([
      db
        .select({connectedAccounts: count()})
        .from(syncConnections)
        .where(and(eq(syncConnections.userId, userId), ne(syncConnections.status, "disconnected"))),
      db
        .select({importedItems: count()})
        .from(syncItems)
        .where(and(eq(syncItems.userId, userId), eq(syncItems.status, "active"))),
      db
        .select({lastSyncedAt: max(syncConnections.lastSyncedAt)})
        .from(syncConnections)
        .where(eq(syncConnections.userId, userId)),
      db
        .select({needAttention: count()})
        .from(syncEvents)
        .where(
          and(
            eq(syncEvents.userId, userId),
            eq(syncEvents.requiresAction, true),
            isNull(syncEvents.resolvedAt),
            isNull(syncEvents.dismissedAt),
          ),
        ),
    ]);

  return (
    <div className="border-border mt-4 flex items-center gap-5.5 border-t pt-4">
      <Stat label="Connected accounts" value={String(connectedAccounts)} />
      <div className="bg-border h-7 w-px" aria-hidden />
      <Stat label="Imported items" value={importedItems.toLocaleString()} />
      <div className="bg-border h-7 w-px" aria-hidden />
      <Stat label="Last sync" value={lastSyncedAt ? formatRelativeTime(lastSyncedAt) : "Never"} />
      <div className="bg-border h-7 w-px" aria-hidden />
      <Stat label="Need attention" value={String(needAttention)} />
    </div>
  );
};

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[12px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground font-mono text-sm font-medium">{value}</span>
    </div>
  );
}

function StatSkeleton({maxWidth = 120}: {maxWidth?: number}) {
  return (
    <div className="flex flex-col gap-1" style={{width: maxWidth}}>
      <div className="bg-muted h-4.5 w-full animate-pulse rounded" />
      <div className="bg-muted h-4.5 w-10 animate-pulse rounded" />
    </div>
  );
}

function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
