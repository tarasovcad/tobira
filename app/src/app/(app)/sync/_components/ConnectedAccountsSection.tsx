"use client";

import {useMemo, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {DownloadIcon, MoreHorizontalIcon, RefreshCwIcon} from "lucide-react";
import {motion} from "motion/react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/coss/button";
import {Badge} from "@/components/ui/coss/badge";
import {Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator} from "@/components/ui/coss/menu";
import {Tabs, TabsList, TabsTab} from "@/components/ui/coss/tabs";
import {Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger} from "@/components/ui/coss/tooltip";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/coss/input-group";
import {PROVIDERS} from "../_lib/sync-providers";

export type ConnectionMode = "automatic" | "once";
type AccountModeFilter = "all" | "automatic" | "once";

export type ConnectedAccount = {
  id: string;
  provider: string;
  account: string;
  mode: ConnectionMode;
  lastSync: string;
  itemsImported: number;
};

function getProviderData(name: string) {
  return PROVIDERS.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()) ?? null;
}

function matchesAccountFilter(account: ConnectedAccount, filter: AccountModeFilter) {
  if (filter === "all") return true;
  return account.mode === filter;
}

function matchesAccountQuery(account: ConnectedAccount, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  return [
    account.provider,
    account.account,
    modeLabel(account.mode),
    account.lastSync,
    String(account.itemsImported),
    formatAccountItemCount(account.itemsImported),
  ].some((value) => value.toLowerCase().includes(query));
}

function modeLabel(mode: ConnectionMode): string {
  return mode === "automatic" ? "Auto-sync" : "Import";
}

function modeBadgeClass(mode: ConnectionMode): string {
  if (mode === "automatic") {
    return "border-indigo-200/50 bg-indigo-500/10 text-indigo-800/85 dark:border-indigo-800/40 dark:bg-indigo-400/10 dark:text-indigo-300/85";
  }
  return "border-teal-200/50 bg-teal-500/10 text-teal-800/85 dark:border-teal-800/40 dark:bg-teal-400/10 dark:text-teal-300/85";
}

function ModeTooltipContent({mode}: {mode: ConnectionMode}) {
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
        <span className="font-medium">{modeLabel(mode)}</span>
        <span className="text-muted-foreground leading-snug">
          {isAutoSync
            ? "This source stays connected in the background and updates when new items are found."
            : "This is a one-time import. If you add more items later, you need to import again."}
        </span>
      </span>
    </span>
  );
}

function formatAccountItemCount(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function ConnectedAccountsSection({initialAccounts}: {initialAccounts: ConnectedAccount[]}) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<AccountModeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAccounts = useMemo(
    () =>
      initialAccounts.filter(
        (account) =>
          matchesAccountFilter(account, selectedFilter) &&
          matchesAccountQuery(account, searchQuery),
      ),
    [initialAccounts, selectedFilter, searchQuery],
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
        className={cn(collapsed ? "pointer-events-none overflow-hidden" : "overflow-visible")}>
        <div className="pt-0.5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Tabs
              value={selectedFilter}
              onValueChange={(value) => setSelectedFilter(value as AccountModeFilter)}>
              <TabsList variant="underline" className="flex-wrap">
                <TabsTab value="all" className="hit-area-2">
                  All
                </TabsTab>
                <TabsTab value="automatic" className="hit-area-2">
                  Auto-sync
                </TabsTab>
                <TabsTab value="once" className="hit-area-2">
                  Import
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
            <TooltipProvider delay={150}>
              {filteredAccounts.map((account) => (
                <ConnectedAccountRow key={account.id} account={account} />
              ))}
            </TooltipProvider>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ConnectedAccountRow({account}: {account: ConnectedAccount}) {
  const providerData = getProviderData(account.provider);
  const isAutoSync = account.mode === "automatic";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="border-border/80 hover:bg-muted/80 group relative flex items-center gap-3 border-b px-5 py-2.5 pr-12 transition-none! last:border-b-0">
      <Link
        href={`/sync/accounts/${account.id}`}
        className="absolute inset-0 outline-none focus-visible:ring-0! focus-visible:outline-none"
        aria-label={`View ${account.provider} ${account.account}`}
      />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {providerData ? (
          <Image
            src={providerData.image}
            alt={account.provider}
            width={20}
            height={20}
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

      <div className="relative z-10 hidden shrink-0 items-center sm:flex">
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                variant="outline"
                size="md"
                className={cn(
                  "hit-area-2 hit-area-y-4 cursor-pointer font-normal",
                  modeBadgeClass(account.mode),
                )}
              />
            }>
            {modeLabel(account.mode)}
          </TooltipTrigger>
          <TooltipPopup
            sideOffset={6}
            size="md"
            className={cn(
              "shadow-none!",
              account.mode == "automatic" ? "max-w-[260px]" : "max-w-[230px]",
            )}>
            <ModeTooltipContent mode={account.mode} />
          </TooltipPopup>
        </Tooltip>
      </div>

      <div className="text-muted-foreground hidden min-w-[90px] shrink-0 text-right text-sm md:block">
        {account.itemsImported} {account.itemsImported > 1 ? "items" : "item"}
      </div>

      <div className="text-muted-foreground hidden min-w-[90px] shrink-0 text-right text-sm lg:block">
        {account.lastSync}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute top-1.5 right-2 z-10 flex items-center opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 has-[:focus-visible]:pointer-events-auto has-[:focus-visible]:opacity-100",
          menuOpen && "pointer-events-auto opacity-100",
        )}>
        <Menu open={menuOpen} onOpenChange={setMenuOpen}>
          <MenuTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="More options"
                className="size-7"
              />
            }>
            <MoreHorizontalIcon className="size-4" />
          </MenuTrigger>
          <MenuPopup align="end">
            <MenuItem>
              {isAutoSync ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4.69563 11.3333C5.54972 12.1573 6.72674 12.6667 8.00041 12.6667C10.5777 12.6667 12.6671 10.5773 12.6671 8.00001C12.6671 7.63181 12.9655 7.33334 13.3337 7.33334C13.7019 7.33334 14.0004 7.63181 14.0004 8.00001C14.0004 11.3137 11.3141 14 8.00041 14C6.48275 14 5.07228 13.4358 4.00033 12.5039V13.3333C4.00033 13.7015 3.70185 14 3.33366 14C2.96547 14 2.66699 13.7015 2.66699 13.3333V11.3333C2.66699 10.5969 3.26395 10 4.00033 10H5.83366C6.20185 10 6.50033 10.2985 6.50033 10.6667C6.50033 11.0349 6.20185 11.3333 5.83366 11.3333H4.69563Z"
                      fill="currentColor"
                    />
                    <path
                      d="M3.33333 8C3.33333 8.3682 3.03485 8.66667 2.66667 8.66667C2.29848 8.66667 2 8.3682 2 8C2 4.68629 4.68629 2 8 2C9.52133 2 10.9349 2.56691 12.0078 3.50286V2.66667C12.0078 2.29848 12.3063 2 12.6745 2C13.0427 2 13.3411 2.29848 13.3411 2.66667V4.66667C13.3411 5.40305 12.7442 6 12.0078 6H10.0078C9.6396 6 9.34113 5.70153 9.34113 5.33333C9.34113 4.96514 9.6396 4.66667 10.0078 4.66667H11.3048C10.4507 3.84276 9.27367 3.33333 8 3.33333C5.42267 3.33333 3.33333 5.42267 3.33333 8Z"
                      fill="currentColor"
                    />
                  </svg>
                  Sync now
                </>
              ) : (
                <>
                  {" "}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M8 0.666992C11.6817 0.666992 14.6668 3.65126 14.667 7.33301C14.667 11.0149 11.6818 14 8 14C4.31817 13.9999 1.33398 11.0148 1.33398 7.33301C1.33416 3.65131 4.31828 0.667079 8 0.666992ZM5.90039 9.43359C5.51379 9.43359 5.2002 9.74718 5.2002 10.1338C5.20044 10.5202 5.51394 10.833 5.90039 10.833H10.1006C10.4869 10.8328 10.7996 10.5201 10.7998 10.1338C10.7998 9.7473 10.487 9.4338 10.1006 9.43359H5.90039ZM8 3.83301C7.61351 3.8331 7.29988 4.14671 7.2998 4.5332V6.34375L7.09473 6.13867C6.82138 5.86535 6.37883 5.86531 6.10547 6.13867C5.83214 6.412 5.83217 6.85457 6.10547 7.12793L7.50488 8.52832C7.77823 8.80166 8.22177 8.80165 8.49512 8.52832L9.89551 7.12793C10.1683 6.85465 10.1684 6.41192 9.89551 6.13867C9.62215 5.86529 9.17862 5.86529 8.90527 6.13867L8.7002 6.34375V4.5332C8.70012 4.14665 8.38657 3.83301 8 3.83301Z"
                      fill="currentColor"
                    />
                  </svg>
                  Import again
                </>
              )}
            </MenuItem>
            <MenuItem>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <rect width="16" height="16" />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.00039 2.66667C10.4959 2.66669 12.9312 4.10717 14.6101 6.8632C15.0346 7.56 15.0346 8.44 14.6101 9.1368C12.9312 11.8929 10.4959 13.3333 8.00039 13.3333C5.50483 13.3333 3.06951 11.8928 1.39061 9.13673C0.966152 8.43993 0.966146 7.55993 1.39062 6.86313C3.06951 4.10709 5.50483 2.66665 8.00039 2.66667ZM5.5837 8C5.5837 6.66531 6.66568 5.58333 8.00039 5.58333C9.33506 5.58333 10.4171 6.66531 10.4171 8C10.4171 9.33467 9.33506 10.4167 8.00039 10.4167C6.66568 10.4167 5.5837 9.33467 5.5837 8Z"
                  fill="currentColor"
                />
              </svg>
              View activity
            </MenuItem>
            <MenuItem>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.62491 2.06909C6.93134 1.60944 7.44721 1.33334 7.99967 1.33334C8.55214 1.33334 9.06801 1.60944 9.37441 2.06909L9.63247 2.4562C9.89821 2.85472 10.3828 3.04717 10.8495 2.93947L11.1041 2.88072C11.6685 2.75046 12.2603 2.92017 12.6699 3.32979C13.0795 3.73941 13.2492 4.33114 13.1189 4.8956L13.0602 5.15016C12.9525 5.61686 13.1449 6.1015 13.5435 6.36718L13.9306 6.62525C14.3903 6.93168 14.6663 7.44754 14.6663 8.00001C14.6663 8.55248 14.3903 9.06834 13.9306 9.37474L13.5435 9.63281C13.1449 9.89854 12.9525 10.3831 13.0602 10.8499L13.1189 11.1044C13.2492 11.6689 13.0795 12.2606 12.6699 12.6702C12.2603 13.0799 11.6685 13.2495 11.1041 13.1193L10.8495 13.0605C10.3828 12.9529 9.89821 13.1453 9.63247 13.5438L9.37441 13.9309C9.06801 14.3906 8.55214 14.6667 7.99967 14.6667C7.44721 14.6667 6.93134 14.3906 6.62491 13.9309L6.36684 13.5438C6.10116 13.1453 5.61653 12.9529 5.14983 13.0605L4.89526 13.1193C4.33081 13.2495 3.73907 13.0799 3.32945 12.6702C2.91984 12.2606 2.75013 11.6689 2.88039 11.1044L2.93913 10.8499C3.04683 10.3831 2.85439 9.89854 2.45587 9.63281L2.06875 9.37474C1.6091 9.06834 1.33301 8.55248 1.33301 8.00001C1.33301 7.44754 1.6091 6.93168 2.06875 6.62525L2.45587 6.36718C2.85439 6.1015 3.04683 5.61686 2.93913 5.15016L2.88039 4.8956C2.75013 4.33115 2.91983 3.73941 3.32945 3.32979C3.73907 2.92017 4.33081 2.75046 4.89526 2.88072L5.14983 2.93947C5.61653 3.04717 6.10116 2.85472 6.36684 2.4562L6.62491 2.06909ZM5.91634 8.00001C5.91634 6.84941 6.84907 5.91668 7.99967 5.91668C9.15027 5.91668 10.083 6.84941 10.083 8.00001C10.083 9.15061 9.15027 10.0833 7.99967 10.0833C6.84907 10.0833 5.91634 9.15061 5.91634 8.00001Z"
                  fill="currentColor"
                />
              </svg>
              Settings
            </MenuItem>
            <MenuSeparator />
            {isAutoSync ? (
              <>
                <MenuItem>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 4.83333C3 3.82081 3.89543 3 5 3C6.10457 3 7 3.82081 7 4.83333V12.1667C7 13.1792 6.10457 14 5 14C3.89543 14 3 13.1792 3 12.1667V4.83333Z"
                      fill="currentColor"
                    />
                    <path
                      d="M9 4.83333C9 3.82081 9.8954 3 11 3C12.1046 3 13 3.82081 13 4.83333V12.1667C13 13.1792 12.1046 14 11 14C9.8954 14 9 13.1792 9 12.1667V4.83333Z"
                      fill="currentColor"
                    />
                  </svg>
                  Pause sync
                </MenuItem>
                <MenuItem variant="destructive">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_544_2368)">
                      <path
                        d="M12.667 3.33334L14.667 1.33334"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M1.33301 14.6667L3.33301 12.6667"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4.20002 13.5333C4.34867 13.6825 4.5253 13.8008 4.71978 13.8816C4.91426 13.9624 5.12277 14.0039 5.33336 14.0039C5.54394 14.0039 5.75245 13.9624 5.94693 13.8816C6.14141 13.8008 6.31804 13.6825 6.46669 13.5333L8.00002 12L4.00002 8L2.46669 9.53333C2.31753 9.68198 2.19917 9.85861 2.11842 10.0531C2.03766 10.2476 1.99609 10.4561 1.99609 10.6667C1.99609 10.8772 2.03766 11.0858 2.11842 11.2802C2.19917 11.4747 2.31753 11.6514 2.46669 11.8L4.20002 13.5333Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 9.00001L6.66667 7.33334"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 11L8.66667 9.33334"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 3.99999L12 7.99999L13.5333 6.46666C13.6825 6.31801 13.8008 6.14138 13.8816 5.9469C13.9624 5.75242 14.0039 5.54391 14.0039 5.33333C14.0039 5.12274 13.9624 4.91423 13.8816 4.71975C13.8008 4.52527 13.6825 4.34864 13.5333 4.19999L11.8 2.46666C11.6514 2.3175 11.4747 2.19914 11.2802 2.11839C11.0858 2.03763 10.8772 1.99606 10.6667 1.99606C10.4561 1.99606 10.2476 2.03763 10.0531 2.11839C9.85861 2.19914 9.68198 2.3175 9.53333 2.46666L8 3.99999Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_544_2368">
                        <rect width="16" height="16" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  Disconnect
                </MenuItem>
              </>
            ) : (
              <MenuItem variant="destructive">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.24601 3.33334H2.16699C1.89085 3.33334 1.66699 3.5572 1.66699 3.83334C1.66699 4.10948 1.89085 4.33334 2.16699 4.33334H2.66697C2.66699 4.34494 2.6674 4.35662 2.66822 4.36836L3.2281 12.3418C3.32005 13.6513 4.4092 14.6667 5.72196 14.6667H10.2787C11.5915 14.6667 12.6806 13.6513 12.7725 12.3418L13.3325 4.36836C13.3333 4.35662 13.3337 4.34494 13.3337 4.33334H13.8337C14.1098 4.33334 14.3337 4.10948 14.3337 3.83334C14.3337 3.5572 14.1098 3.33334 13.8337 3.33334H10.7547C10.4547 2.09005 9.33573 1.16667 8.00039 1.16667C6.66504 1.16667 5.54599 2.09005 5.24601 3.33334ZM6.29188 3.33334H9.70886C9.44219 2.65056 8.77752 2.16667 8.00039 2.16667C7.22319 2.16667 6.55853 2.65056 6.29188 3.33334ZM6.66699 6.50001C6.94313 6.50001 7.16699 6.72387 7.16699 7.00001V10.8333C7.16699 11.1095 6.94313 11.3333 6.66699 11.3333C6.39085 11.3333 6.16699 11.1095 6.16699 10.8333V7.00001C6.16699 6.72387 6.39085 6.50001 6.66699 6.50001ZM9.33366 6.50001C9.60979 6.50001 9.83366 6.72387 9.83366 7.00001V10.8333C9.83366 11.1095 9.60979 11.3333 9.33366 11.3333C9.05753 11.3333 8.83366 11.1095 8.83366 10.8333V7.00001C8.83366 6.72387 9.05753 6.50001 9.33366 6.50001Z"
                    fill="currentColor"
                  />
                </svg>
                Delete import
              </MenuItem>
            )}
          </MenuPopup>
        </Menu>
      </div>
    </div>
  );
}
