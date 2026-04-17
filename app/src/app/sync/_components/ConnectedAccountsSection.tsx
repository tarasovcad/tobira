"use client";

import {useState} from "react";
import Image from "next/image";
import {MoreHorizontalIcon, RefreshCwIcon} from "lucide-react";
import {motion} from "motion/react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/coss-ui/button";
import {Badge} from "@/components/coss-ui/badge";
import {Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator} from "@/components/coss-ui/menu";
import {PROVIDERS} from "@/app/sync/_lib/sync-providers";

type ConnectionStatus = "healthy" | "syncing" | "warning" | "error";

type ConnectedAccount = {
  id: string;
  provider: string;
  account: string;
  status: ConnectionStatus;
  lastSync: string;
  itemsImported: string;
};

const CONNECTED_ACCOUNTS: ConnectedAccount[] = [
  {
    id: "x-taras",
    provider: "X",
    account: "@taras",
    status: "syncing",
    lastSync: "2 min ago",
    itemsImported: "342 items",
  },
  {
    id: "reddit-taras",
    provider: "Reddit",
    account: "u/taras",
    status: "warning",
    lastSync: "1 hour ago",
    itemsImported: "312 items",
  },
  {
    id: "chrome-personal",
    provider: "Chrome",
    account: "Personal profile",
    status: "healthy",
    lastSync: "Yesterday",
    itemsImported: "96 links",
  },
  {
    id: "chrome-work",
    provider: "Chrome",
    account: "Work profile",
    status: "syncing",
    lastSync: "4 min ago",
    itemsImported: "140 links",
  },
  {
    id: "safari-icloud",
    provider: "Safari",
    account: "iCloud",
    status: "error",
    lastSync: "2 days ago",
    itemsImported: "47 items",
  },
  {
    id: "pinterest-taras",
    provider: "Pinterest",
    account: "@taras",
    status: "error",
    lastSync: "Yesterday",
    itemsImported: "178 pins",
  },
  {
    id: "youtube-taras",
    provider: "YouTube",
    account: "@taras",
    status: "healthy",
    lastSync: "3 hours ago",
    itemsImported: "178 videos",
  },
  {
    id: "dribbble-taras",
    provider: "Dribbble",
    account: "@taras",
    status: "healthy",
    lastSync: "6 hours ago",
    itemsImported: "156 shots",
  },
  {
    id: "firefox-work",
    provider: "Firefox",
    account: "Work profile",
    status: "healthy",
    lastSync: "2 days ago",
    itemsImported: "212 links",
  },
  {
    id: "dia-taras",
    provider: "Dia",
    account: "@taras",
    status: "syncing",
    lastSync: "12 min ago",
    itemsImported: "145 items",
  },
];

function getProviderData(name: string) {
  return PROVIDERS.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()) ?? null;
}

function StatusDot({status}: {status: ConnectionStatus}) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        status === "healthy" && "bg-success",
        status === "syncing" && "bg-info animate-pulse",
        status === "warning" && "bg-warning",
        status === "error" && "bg-destructive",
      )}
      aria-hidden
    />
  );
}

function statusLabel(status: ConnectionStatus): string {
  if (status === "healthy") return "Healthy";
  if (status === "syncing") return "Syncing";
  if (status === "warning") return "Warning";
  return "Error";
}

function statusBadgeVariant(status: ConnectionStatus) {
  if (status === "healthy") return "success" as const;
  if (status === "syncing") return "info" as const;
  if (status === "warning") return "warning" as const;
  return "error" as const;
}

export function ConnectedAccountsSection() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn("space-y-4", !collapsed ? "mb-16" : "mb-6")}>
      <h4 className="text-base font-[550]">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          className="text-foreground/95 group hit-area-5 [&>svg]:text-muted-foreground relative inline-flex cursor-pointer items-center">
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "absolute top-1/2 left-[-21px] -translate-y-1/2 opacity-0 transition-opacity duration-150 ease-out will-change-transform group-hover:opacity-100",
              collapsed && "opacity-100",
            )}
            style={{transformOrigin: "50% 50%"}}
            initial={false}
            animate={{rotate: collapsed ? 90 : 0}}
            transition={{duration: 0.22, ease: [0.22, 1, 0.36, 1]}}
            aria-hidden>
            <path
              d="M6.80473 3.52859C6.5444 3.26824 6.1224 3.26824 5.862 3.52859C5.60167 3.78894 5.60167 4.21095 5.862 4.4713L9.39067 7.99993L5.862 11.5286C5.60167 11.7889 5.60167 12.2109 5.862 12.4713C6.1224 12.7317 6.5444 12.7317 6.80473 12.4713L10.8047 8.47133C11.0651 8.21093 11.0651 7.78893 10.8047 7.5286L6.80473 3.52859Z"
              fill="currentColor"
            />
          </motion.svg>
          Connected accounts
          <span className="text-muted-foreground/90 ml-1 font-medium tracking-wide">
            ({CONNECTED_ACCOUNTS.length})
          </span>
        </button>
      </h4>

      <motion.div
        initial={false}
        animate={collapsed ? "collapsed" : "expanded"}
        variants={{
          expanded: {height: "auto", opacity: 1},
          collapsed: {height: 0, opacity: 0},
        }}
        transition={{
          height: {duration: 0.2, ease: [0.22, 1, 0.36, 1]},
          opacity: {duration: 0.12, ease: [0.22, 1, 0.36, 1]},
        }}
        className={cn("overflow-hidden", collapsed && "pointer-events-none")}>
        <div className="pt-0.5">
          {CONNECTED_ACCOUNTS.map((account) => (
            <ConnectedAccountRow key={account.id} account={account} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ConnectedAccountRow({account}: {account: ConnectedAccount}) {
  const providerData = getProviderData(account.provider);

  return (
    <div className="border-border/80 hover:bg-muted/25 relative flex items-center gap-3 border-b py-3 transition-colors last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {providerData ? (
          <Image
            src={providerData.image}
            alt={account.provider}
            width={18}
            height={18}
            className={cn("shrink-0", providerData.invertOnDark && "dark:invert")}
          />
        ) : (
          <div className="size-[18px] shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="text-foreground text-sm font-medium">{account.provider}</span>
            <span className="text-muted-foreground text-sm">{account.account}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:mt-0">
        <StatusDot status={account.status} />
        <Badge variant={statusBadgeVariant(account.status)} size="md" className="font-normal">
          {statusLabel(account.status)}
        </Badge>
      </div>

      <div className="text-muted-foreground hidden min-w-[90px] shrink-0 text-right text-sm md:block">
        {account.itemsImported}
      </div>

      <div className="text-muted-foreground hidden min-w-[90px] shrink-0 text-right text-sm lg:block">
        {account.lastSync}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCwIcon className="size-3.5" />
          <span className="hidden sm:inline">Sync now</span>
        </Button>
        <Menu>
          <MenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="More options" className="size-7" />
            }>
            <MoreHorizontalIcon className="size-4" />
          </MenuTrigger>
          <MenuPopup align="end">
            <MenuItem>View activity</MenuItem>
            <MenuItem>Settings</MenuItem>
            <MenuItem>Reconnect</MenuItem>
            <MenuSeparator />
            <MenuItem variant="destructive">Disconnect</MenuItem>
          </MenuPopup>
        </Menu>
      </div>
    </div>
  );
}
