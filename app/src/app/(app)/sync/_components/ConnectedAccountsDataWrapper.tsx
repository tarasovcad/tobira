import {db} from "@/db";
import {syncConnections, syncItems} from "@/db/schema";
import {and, asc, count, eq, ne} from "drizzle-orm";
import {PROVIDERS} from "../_lib/sync-providers";
import {
  ConnectedAccountsSection,
  type ConnectedAccount,
  type ConnectionMode,
} from "./ConnectedAccountsSection";

export const ConnectedAccountsSkeleton = () => {
  return (
    <div className="mb-16 space-y-4">
      <div className="divide-border divide-y">
        {Array.from({length: 4}).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="bg-muted size-[18px] animate-pulse rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="bg-muted h-4 w-32 animate-pulse rounded" />
            </div>
            <div className="bg-muted hidden h-5 w-20 animate-pulse rounded-full sm:block" />
            <div className="bg-muted hidden h-4 w-20 animate-pulse rounded md:block" />
            <div className="bg-muted hidden h-4 w-20 animate-pulse rounded lg:block" />
            <div className="bg-muted h-7 w-20 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const FAKE_CONNECTED_ACCOUNTS: ConnectedAccount[] = [
  {
    id: "acc_1",
    provider: "X",
    account: "@alex_design",
    mode: "automatic",
    lastSync: "12m ago",
    itemsImported: 1247,
  },
  {
    id: "acc_2",
    provider: "YouTube",
    account: "Tech & Manga Library",
    mode: "automatic",
    lastSync: "Just now",
    itemsImported: 384,
  },
  {
    id: "acc_3",
    provider: "Reddit",
    account: "u/curious_reader",
    mode: "automatic",
    lastSync: "3d ago",
    itemsImported: 92,
  },
  {
    id: "acc_4",
    provider: "Chrome",
    account: "Work Profile (chrome@tobira.dev)",
    mode: "automatic",
    lastSync: "1h ago",
    itemsImported: 3412,
  },
  {
    id: "acc_5",
    provider: "Arc",
    account: "Personal Space",
    mode: "once",
    lastSync: "4h ago",
    itemsImported: 890,
  },
  {
    id: "acc_6",
    provider: "Dribbble",
    account: "sarah_illustrations",
    mode: "once",
    lastSync: "5h ago",
    itemsImported: 320,
  },
  {
    id: "acc_7",
    provider: "Pinterest",
    account: "@ui_design_inspiration",
    mode: "automatic",
    lastSync: "5d ago",
    itemsImported: 2105,
  },
  {
    id: "acc_8",
    provider: "Firefox",
    account: "firefox-main-sync",
    mode: "automatic",
    lastSync: "Yesterday",
    itemsImported: 1540,
  },
  {
    id: "acc_9",
    provider: "Dia",
    account: "Research Flow",
    mode: "once",
    lastSync: "2d ago",
    itemsImported: 145,
  },
  {
    id: "acc_10",
    provider: "Safari",
    account: "MacBook Air Safari",
    mode: "automatic",
    lastSync: "6d ago",
    itemsImported: 620,
  },
];

export const ConnectedAccountsDataWrapper = async ({userId}: {userId: string}) => {
  const rows = await db
    .select({
      id: syncConnections.id,
      provider: syncConnections.provider,
      externalUsername: syncConnections.externalUsername,
      externalDisplayName: syncConnections.externalDisplayName,
      label: syncConnections.label,
      syncMode: syncConnections.syncMode,
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

  const dbAccounts: ConnectedAccount[] = rows.map((row) => {
    const meta = getProviderMeta(row.provider);
    return {
      id: row.id,
      provider: meta.name,
      account: row.externalUsername ?? row.externalDisplayName ?? row.label,
      mode: mapConnectionMode(row.syncMode),
      lastSync: row.lastSyncedAt ? formatRelativeTime(row.lastSyncedAt) : "Never",
      itemsImported: row.itemCount,
    };
  });

  const displayAccounts =
    dbAccounts.length > 0
      ? [
          ...dbAccounts,
          ...FAKE_CONNECTED_ACCOUNTS.filter((f) => !dbAccounts.some((a) => a.id === f.id)),
        ]
      : FAKE_CONNECTED_ACCOUNTS;

  return <ConnectedAccountsSection initialAccounts={displayAccounts} />;
};

function getProviderMeta(provider: string): {name: string} {
  const match = PROVIDERS.find((p) => p.name.toLowerCase() === provider.toLowerCase());
  return {name: match?.name ?? provider};
}

function mapConnectionMode(mode: string): ConnectionMode {
  return mode === "once" ? "once" : "automatic";
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
