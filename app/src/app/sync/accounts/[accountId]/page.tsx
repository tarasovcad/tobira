import AppShell from "@/components/app-shell/AppShell";
import {AccountHeader, type AccountHeaderData} from "./_components/AccountHeader";
import {SyncAccountClient} from "./_components/SyncAccountClient";
import type {TypeFilter} from "@/features/home/types";

const FAKE_ACCOUNTS: Record<string, AccountHeaderData> = {
  acc_1: {
    id: "acc_1",
    provider: "X",
    providerImage: "/socials/x.svg",
    invertOnDark: true,
    username: "@blable",
    status: "healthy",
    connectedSince: "March 12, 2025",
    lastSync: "2 hours ago",
    itemsImported: 1247,
    itemLabel: "items",
  },
  acc_2: {
    id: "acc_2",
    provider: "X",
    providerImage: "/socials/x.svg",
    username: "@mychannel",
    status: "syncing",
    connectedSince: "January 4, 2025",
    lastSync: "Just now",
    itemsImported: 384,
    itemLabel: "videos",
  },
  acc_3: {
    id: "acc_3",
    provider: "Reddit",
    providerImage: "/socials/reddit.svg",
    username: "u/blable",
    status: "warning",
    connectedSince: "February 20, 2025",
    lastSync: "3 days ago",
    itemsImported: 92,
    itemLabel: "items",
  },
};

type ProviderTypeInfo = {typeLabel: string; typeFilter: TypeFilter};

function getProviderTypeInfo(provider: string): ProviderTypeInfo {
  switch (provider.trim().toLowerCase()) {
    case "x":
    case "twitter":
      return {typeLabel: "Posts", typeFilter: "post"};
    case "youtube":
      return {typeLabel: "Videos", typeFilter: "media"};
    case "reddit":
      return {typeLabel: "Posts", typeFilter: "post"};
    default:
      return {typeLabel: "Items", typeFilter: "website"};
  }
}

const FALLBACK_ACCOUNT: AccountHeaderData = {
  id: "unknown",
  provider: "Unknown",
  providerImage: "/socials/x.svg",
  username: "@unknown",
  status: "error",
  connectedSince: "—",
  lastSync: "Never",
  itemsImported: 0,
  itemLabel: "items",
};

export default async function SyncAccountPage({params}: {params: Promise<{accountId: string}>}) {
  const {accountId} = await params;
  const account = Object.prototype.hasOwnProperty.call(FAKE_ACCOUNTS, accountId)
    ? FAKE_ACCOUNTS[accountId as keyof typeof FAKE_ACCOUNTS]
    : FALLBACK_ACCOUNT;
  const {typeFilter} = getProviderTypeInfo(account.provider);

  return (
    <AppShell session={null}>
      <div className="flex h-full w-full flex-col overflow-auto">
        <AccountHeader account={account} />
        <SyncAccountClient typeFilter={typeFilter} />
      </div>
    </AppShell>
  );
}
