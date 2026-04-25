"use client";

import {useMemo, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {MoreHorizontalIcon, RefreshCwIcon} from "lucide-react";
import {motion} from "motion/react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/coss/button";
import {Badge} from "@/components/ui/coss/badge";
import {Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator} from "@/components/ui/coss/menu";
import {Tabs, TabsList, TabsTab} from "@/components/ui/coss/tabs";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/coss/input-group";
import {PROVIDERS} from "@/app/sync/_lib/sync-providers";

export type ConnectionStatus = "healthy" | "syncing" | "warning" | "error";
type AccountStatusTag = "all" | ConnectionStatus;

export type ConnectedAccount = {
  id: string;
  provider: string;
  account: string;
  status: ConnectionStatus;
  lastSync: string;
  itemsImported: string;
};

function getProviderData(name: string) {
  return PROVIDERS.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()) ?? null;
}

function matchesAccountTag(account: ConnectedAccount, tag: AccountStatusTag) {
  if (tag === "all") return true;
  return account.status === tag;
}

function matchesAccountQuery(account: ConnectedAccount, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  return [account.provider, account.account, account.lastSync, account.itemsImported].some(
    (value) => value.toLowerCase().includes(query),
  );
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

export function ConnectedAccountsSection({initialAccounts}: {initialAccounts: ConnectedAccount[]}) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedTag, setSelectedTag] = useState<AccountStatusTag>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAccounts = useMemo(
    () =>
      initialAccounts.filter(
        (account) =>
          matchesAccountTag(account, selectedTag) && matchesAccountQuery(account, searchQuery),
      ),
    [initialAccounts, selectedTag, searchQuery],
  );

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
            ({initialAccounts.length})
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Tabs
              value={selectedTag}
              onValueChange={(value) => setSelectedTag(value as AccountStatusTag)}>
              <TabsList variant="underline" className="flex-wrap">
                <TabsTab value="all" className="hit-area-2">
                  All
                </TabsTab>
                <TabsTab value="healthy" className="hit-area-2">
                  Healthy
                </TabsTab>
                <TabsTab value="syncing" className="hit-area-2">
                  Syncing
                </TabsTab>
                <TabsTab value="warning" className="hit-area-2">
                  Warning
                </TabsTab>
                <TabsTab value="error" className="hit-area-2">
                  Error
                </TabsTab>
              </TabsList>
            </Tabs>

            <InputGroup className="w-full max-w-[320px]">
              <InputGroupInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search connected accounts"
                placeholder="Search accounts"
                type="search"
                autoComplete="off"
              />
              <InputGroupAddon>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M13.3333 13.3333L10.751 10.751M10.751 10.751C11.6257 9.87633 12.1667 8.668 12.1667 7.33333C12.1667 4.66396 10.0027 2.5 7.33333 2.5C4.66396 2.5 2.5 4.66396 2.5 7.33333C2.5 10.0027 4.66396 12.1667 7.33333 12.1667C8.668 12.1667 9.87633 11.6257 10.751 10.751Z"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </InputGroupAddon>
            </InputGroup>
          </div>

          {filteredAccounts.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {initialAccounts.length === 0
                ? "No connected accounts yet"
                : "No accounts match your filters."}
            </p>
          ) : (
            filteredAccounts.map((account) => (
              <ConnectedAccountRow key={account.id} account={account} />
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ConnectedAccountRow({account}: {account: ConnectedAccount}) {
  const providerData = getProviderData(account.provider);

  return (
    <div className="border-border/80 hover:bg-muted/25 relative flex items-center gap-3 border-b py-3 transition-colors last:border-b-0">
      <Link
        href={`/sync/accounts/${account.id}`}
        className="absolute inset-0"
        aria-label={`View ${account.provider} ${account.account}`}
      />
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

      <div className="relative z-10 flex shrink-0 items-center gap-1.5">
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
