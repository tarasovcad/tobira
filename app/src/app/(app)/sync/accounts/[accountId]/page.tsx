import {AccountHeader, type AccountHeaderData} from "./_components/AccountHeader";
import {SyncAccountClient} from "./_components/SyncAccountClient";
import type {TypeFilter} from "@/features/home/types";

const FAKE_ACCOUNTS: Record<string, AccountHeaderData> = {
  acc_1: {
    id: "acc_1",
    provider: "X",
    providerImage: "/socials/x.svg",
    invertOnDark: true,
    username: "@alex_design",
    status: "healthy",
    connectedSince: "March 12, 2025",
    lastSync: "12 minutes ago",
    itemsImported: 1247,
    itemLabel: "items",
  },
  acc_2: {
    id: "acc_2",
    provider: "YouTube",
    providerImage: "/socials/youtube.svg",
    username: "Tech & Manga Library",
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
    username: "u/curious_reader",
    status: "warning",
    connectedSince: "February 20, 2025",
    lastSync: "3 days ago",
    itemsImported: 92,
    itemLabel: "items",
  },
  acc_4: {
    id: "acc_4",
    provider: "Chrome",
    providerImage: "/socials/chrome.svg",
    username: "Work Profile (chrome@tobira.dev)",
    status: "healthy",
    connectedSince: "April 1, 2025",
    lastSync: "1 hour ago",
    itemsImported: 3412,
    itemLabel: "links",
  },
  acc_5: {
    id: "acc_5",
    provider: "Arc",
    providerImage: "/socials/arc.svg",
    username: "Personal Space",
    status: "healthy",
    connectedSince: "May 15, 2025",
    lastSync: "4 hours ago",
    itemsImported: 890,
    itemLabel: "links",
  },
  acc_6: {
    id: "acc_6",
    provider: "Dribbble",
    providerImage: "/socials/dribbble.svg",
    username: "sarah_illustrations",
    status: "healthy",
    connectedSince: "June 10, 2025",
    lastSync: "5 hours ago",
    itemsImported: 320,
    itemLabel: "shots",
  },
  acc_7: {
    id: "acc_7",
    provider: "Pinterest",
    providerImage: "/socials/pinterest.svg",
    username: "@ui_design_inspiration",
    status: "error",
    connectedSince: "July 2, 2025",
    lastSync: "5 days ago",
    itemsImported: 2105,
    itemLabel: "pins",
  },
  acc_8: {
    id: "acc_8",
    provider: "Firefox",
    providerImage: "/socials/firefox.svg",
    username: "firefox-main-sync",
    status: "healthy",
    connectedSince: "August 19, 2025",
    lastSync: "Yesterday",
    itemsImported: 1540,
    itemLabel: "links",
  },
  acc_9: {
    id: "acc_9",
    provider: "Dia",
    providerImage: "/socials/dia.png",
    username: "Research Flow",
    status: "healthy",
    connectedSince: "September 8, 2025",
    lastSync: "2 days ago",
    itemsImported: 145,
    itemLabel: "links",
  },
  acc_10: {
    id: "acc_10",
    provider: "Safari",
    providerImage: "/socials/safari.svg",
    username: "MacBook Air Safari",
    status: "warning",
    connectedSince: "October 14, 2025",
    lastSync: "6 days ago",
    itemsImported: 620,
    itemLabel: "links",
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
    <div className="flex h-full w-full flex-col overflow-auto">
      <AccountHeader account={account} />
      <SyncAccountClient typeFilter={typeFilter} />
    </div>
  );
}
