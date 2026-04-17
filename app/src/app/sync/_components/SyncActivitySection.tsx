"use client";

import {useMemo, useState} from "react";
import {cn} from "@/lib/utils";
import Image from "next/image";
import {formatTimeRelativeUtc} from "@/lib/utils/dates";
import {motion} from "motion/react";
import {Alert, AlertTitle} from "@/components/coss-ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/coss-ui/accordion";
import {Button} from "@/components/coss-ui/button";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/coss-ui/input-group";
import {Tabs, TabsList, TabsTab} from "@/components/coss-ui/tabs";
import {PROVIDERS} from "@/app/sync/_lib/sync-providers";

type SyncActivityStatus = "success" | "running" | "warning" | "error";
type SyncActivityTag = "all" | "success" | "error" | "warning" | "info";

function SuccessCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.0003 1.66666C14.6027 1.66666 18.3337 5.39761 18.3337 9.99999C18.3337 14.6023 14.6027 18.3333 10.0003 18.3333C5.39795 18.3333 1.66699 14.6023 1.66699 9.99999C1.66699 5.39761 5.39795 1.66666 10.0003 1.66666ZM12.9658 6.80907C12.5841 6.55216 12.0665 6.65295 11.8094 7.0345L8.72758 11.6113L7.25618 10.14C6.93075 9.81449 6.40323 9.81449 6.0778 10.14C5.75236 10.4654 5.75236 10.9929 6.0778 11.3183L8.2653 13.5058C8.44141 13.6819 8.68724 13.7699 8.93508 13.7459C9.18266 13.7218 9.40641 13.5885 9.54541 13.3822L13.1912 7.96548C13.4482 7.58378 13.3474 7.06613 12.9658 6.80907Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RotatingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <path
        d="M5.86881 14.1667C6.93642 15.1966 8.40769 15.8333 9.99977 15.8333C13.2214 15.8333 15.8331 13.2217 15.8331 9.99999C15.8331 9.53974 16.2062 9.16666 16.6664 9.16666C17.1267 9.16666 17.4998 9.53974 17.4998 9.99999C17.4998 14.1422 14.1419 17.5 9.99977 17.5C8.1027 17.5 6.33962 16.7947 4.99967 15.6298V16.6667C4.99967 17.1269 4.62657 17.5 4.16634 17.5C3.7061 17.5 3.33301 17.1269 3.33301 16.6667V14.1667C3.33301 13.2462 4.0792 12.5 4.99967 12.5H7.29134C7.75157 12.5 8.12467 12.8731 8.12467 13.3333C8.12467 13.7936 7.75157 14.1667 7.29134 14.1667H5.86881Z"
        fill="currentColor"
      />
      <path
        d="M4.16667 10C4.16667 10.4602 3.79357 10.8333 3.33333 10.8333C2.8731 10.8333 2.5 10.4602 2.5 10C2.5 5.85787 5.85787 2.5 10 2.5C11.9017 2.5 13.6687 3.20863 15.0097 4.37858V3.33333C15.0097 2.8731 15.3828 2.5 15.8431 2.5C16.3033 2.5 16.6764 2.8731 16.6764 3.33333V5.83333C16.6764 6.75381 15.9302 7.5 15.0097 7.5H12.5097C12.0495 7.5 11.6764 7.12691 11.6764 6.66667C11.6764 6.20642 12.0495 5.83333 12.5097 5.83333H14.131C13.0633 4.80345 11.5921 4.16667 10 4.16667C6.77834 4.16667 4.16667 6.77834 4.16667 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TriangleAlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.16851 3.3924C8.47276 1.29433 11.5262 1.29433 12.8304 3.3924L17.916 11.5737C19.2963 13.7941 17.6996 16.6667 15.0851 16.6667H4.91383C2.29936 16.6667 0.702612 13.7941 2.08288 11.5737L7.16851 3.3924ZM9.99967 6.66666C10.4599 6.66666 10.833 7.03976 10.833 7.5V10C10.833 10.4602 10.4599 10.8333 9.99967 10.8333C9.53942 10.8333 9.16634 10.4602 9.16634 10V7.5C9.16634 7.03976 9.53942 6.66666 9.99967 6.66666ZM8.95801 12.5C8.95801 11.9247 9.42434 11.4583 9.99967 11.4583C10.575 11.4583 11.0413 11.9247 11.0413 12.5C11.0413 13.0753 10.575 13.5417 9.99967 13.5417C9.42434 13.5417 8.95801 13.0753 8.95801 12.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CircleXIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 1.66666C5.39762 1.66666 1.66667 5.39761 1.66667 9.99999C1.66667 14.6023 5.39762 18.3333 10 18.3333C14.6024 18.3333 18.3333 14.6023 18.3333 9.99999C18.3333 5.39761 14.6024 1.66666 10 1.66666ZM13.0892 6.91074C13.4147 7.23618 13.4147 7.76382 13.0892 8.08926L11.1785 10L13.0892 11.9107C13.4147 12.2362 13.4147 12.7638 13.0892 13.0893C12.7638 13.4147 12.2362 13.4147 11.9107 13.0893L10 11.1785L8.08926 13.0893C7.76382 13.4147 7.23618 13.4147 6.91074 13.0893C6.5853 12.7638 6.5853 12.2362 6.91074 11.9107L8.82149 10L6.91074 8.08926C6.5853 7.76382 6.5853 7.23618 6.91074 6.91074C7.23618 6.5853 7.76382 6.5853 8.08926 6.91074L10 8.82149L11.9107 6.91074C12.2362 6.5853 12.7638 6.5853 13.0892 6.91074Z"
        fill="currentColor"
      />
    </svg>
  );
}

type SyncActivityItem = {
  id: string;
  provider: string;
  account: string;
  /** Short one-line label shown when the row is collapsed */
  summary: string;
  details: string;
  status: SyncActivityStatus;
  time: string;
  duration: string;
  items: string;
  color: string;
};

const SYNC_ACTIVITY = [
  {
    id: "x-1",
    provider: "X",
    account: "@taras",
    summary: "Import completed",
    details: "32 posts imported, 4 duplicates skipped, collection rules applied automatically.",
    status: "success",
    time: "2026-04-16 03:41:28.392184+00",
    duration: "18s",
    items: "32 items",
    color: "#000000",
  },
  {
    id: "reddit-1",
    provider: "Reddit",
    account: "u/taras",
    summary: "Sync started",
    details: "Scanning saved posts and media threads. New items will appear as the run continues.",
    status: "running",
    time: "2026-04-12 22:09:51.830447+00",
    duration: "Live",
    items: "148 checked",
    color: "#FF4500",
  },
  {
    id: "chrome-1",
    provider: "Chrome",
    account: "Personal profile",
    summary: "Folders imported",
    details:
      "Reading list, design references, and work folders were merged into existing collections.",
    status: "success",
    time: "2026-04-08 15:27:06.114905+00",
    duration: "41s",
    items: "96 links",
    color: "#4285F4",
  },
  {
    id: "arc-1",
    provider: "Dia",
    account: "@taras",
    summary: "File parse error",
    details: "7 archived articles need manual review because source pages were unavailable.",
    status: "warning",
    time: "2026-03-31 07:58:44.550103+00",
    duration: "24s",
    items: "61 articles",
    color: "#EF4056",
  },
  {
    id: "youtube-1",
    provider: "YouTube",
    account: "@taras",
    summary: "Playlist synced",
    details:
      "Watch Later and reference playlists were imported into Media and Research collections.",
    status: "success",
    time: "2026-04-14 11:33:19.009771+00",
    duration: "29s",
    items: "54 videos",
    color: "#FF0000",
  },
  {
    id: "firefox-1",
    provider: "Firefox",
    account: "Work profile",
    summary: "Bookmarks imported",
    details:
      "Imported bookmarks bar and mobile sync folders. Duplicates were de-duplicated by URL.",
    status: "success",
    time: "2026-04-03 18:04:37.441992+00",
    duration: "33s",
    items: "212 links",
    color: "#FF7139",
  },
  {
    id: "safari-1",
    provider: "Safari",
    account: "iCloud",
    summary: "Import queued",
    details:
      "Waiting for iCloud export to finish. We’ll start syncing as soon as the file is ready.",
    status: "running",
    time: "2026-04-06 00:52:14.704338+00",
    duration: "Live",
    items: "0 imported",
    color: "#0FB5EE",
  },
  {
    id: "pinterest-1",
    provider: "Pinterest",
    account: "@taras",
    summary: "Board sync completed",
    details:
      "Imported boards into Visual Inspiration collections. Rich preview metadata was fetched.",
    status: "success",
    time: "2026-04-10 09:45:02.221668+00",
    duration: "52s",
    items: "178 pins",
    color: "#E60023",
  },
  {
    id: "dribbble-1",
    provider: "Dribbble",
    account: "@taras",
    summary: "Rate limit hit",
    details: "Paused after hitting the API rate limit. We’ll automatically resume in ~15 minutes.",
    status: "warning",
    time: "2026-03-29 14:26:59.670311+00",
    duration: "12s",
    items: "60 checked",
    color: "#EA4C89",
  },
  {
    id: "safari-err-1",
    provider: "Safari",
    account: "iCloud",
    summary: "iCloud auth failed",
    details:
      "Couldn’t verify your iCloud export session. Reconnect Safari and try again (this usually happens after a password change).",
    status: "error",
    time: "2026-04-15 05:17:43.998120+00",
    duration: "2s",
    items: "0 imported",
    color: "#0FB5EE",
  },
  {
    id: "dia-2",
    provider: "Dia",
    account: "@taras",
    summary: "Import completed",
    details: "Imported saved tabs and archived pages. Broken sources were flagged for review.",
    status: "success",
    time: "2026-04-01 21:16:08.073401+00",
    duration: "27s",
    items: "84 items",
    color: "#EF4056",
  },
  {
    id: "chrome-2",
    provider: "Chrome",
    account: "Work profile",
    summary: "Sync started",
    details:
      "Scanning bookmark folders and reading list. This may take a few minutes for large profiles.",
    status: "running",
    time: "2026-04-11 02:12:51.281004+00",
    duration: "Live",
    items: "1,020 checked",
    color: "#4285F4",
  },
  {
    id: "reddit-2",
    provider: "Reddit",
    account: "u/taras",
    summary: "Some items skipped",
    details:
      "Skipped private/removed posts. You can retry later or export from a different account.",
    status: "warning",
    time: "2026-04-07 12:40:35.502990+00",
    duration: "38s",
    items: "19 skipped",
    color: "#FF4500",
  },
  {
    id: "x-err-1",
    provider: "X",
    account: "@taras",
    summary: "Token expired",
    details:
      "Your X connection expired mid-run. Reconnect to continue importing from where we stopped.",
    status: "error",
    time: "2026-03-30 19:03:22.160509+00",
    duration: "4s",
    items: "0 imported",
    color: "#000000",
  },
  {
    id: "x-2",
    provider: "X",
    account: "@taras",
    summary: "Sync started",
    details: "Fetching bookmarks and media. Older items may take longer due to pagination.",
    status: "running",
    time: "2026-04-13 16:55:49.777004+00",
    duration: "Live",
    items: "320 checked",
    color: "#000000",
  },
  {
    id: "youtube-2",
    provider: "YouTube",
    account: "@taras",
    summary: "New uploads imported",
    details:
      "New videos from subscribed channels were added to your Media feed and tagged by topic.",
    status: "success",
    time: "2026-04-09 04:21:18.090236+00",
    duration: "21s",
    items: "23 videos",
    color: "#FF0000",
  },
  {
    id: "safari-2",
    provider: "Safari",
    account: "iCloud",
    summary: "Duplicates removed",
    details:
      "Merged duplicate favorites and removed dead links using cached titles and canonical URLs.",
    status: "success",
    time: "2026-03-28 10:12:39.284119+00",
    duration: "19s",
    items: "47 merged",
    color: "#0FB5EE",
  },
  {
    id: "firefox-2",
    provider: "Firefox",
    account: "Personal profile",
    summary: "Corrupt export file",
    details: "The export JSON couldn’t be parsed. Re-export bookmarks and try again.",
    status: "warning",
    time: "2026-04-05 23:49:03.617550+00",
    duration: "3s",
    items: "0 imported",
    color: "#FF7139",
  },
  {
    id: "pinterest-err-1",
    provider: "Pinterest",
    account: "@taras",
    summary: "API key revoked",
    details:
      "Pinterest rejected the request because the connection was revoked. Reconnect Pinterest to resume syncing boards.",
    status: "error",
    time: "2026-04-15 18:30:44.904711+00",
    duration: "1s",
    items: "0 imported",
    color: "#E60023",
  },
  {
    id: "pinterest-2",
    provider: "Pinterest",
    account: "@taras",
    summary: "Sync started",
    details:
      "Importing pins from selected boards. Image previews will be fetched in the background.",
    status: "running",
    time: "2026-04-02 08:36:29.745018+00",
    duration: "Live",
    items: "402 checked",
    color: "#E60023",
  },
  {
    id: "dribbble-2",
    provider: "Dribbble",
    account: "@taras",
    summary: "Likes imported",
    details:
      "Imported liked shots and added them to your Design collection with author attribution.",
    status: "success",
    time: "2026-04-16 12:08:57.018432+00",
    duration: "44s",
    items: "96 shots",
    color: "#EA4C89",
  },
  {
    id: "chrome-3",
    provider: "Chrome",
    account: "Personal profile",
    summary: "Extensions skipped",
    details:
      "Extension-specific lists aren’t supported yet. Bookmarks and reading list were imported.",
    status: "warning",
    time: "2026-04-04 06:41:10.883905+00",
    duration: "25s",
    items: "140 imported",
    color: "#4285F4",
  },
  {
    id: "dia-3",
    provider: "Dia",
    account: "@taras",
    summary: "Sync started",
    details: "Indexing saved sessions and extracting titles for faster search and dedupe.",
    status: "running",
    time: "2026-04-10 21:28:33.519803+00",
    duration: "Live",
    items: "74 indexed",
    color: "#EF4056",
  },
  {
    id: "reddit-3",
    provider: "Reddit",
    account: "u/taras",
    summary: "Import completed",
    details: "Imported saved posts and comments. Media links were normalized and tagged.",
    status: "success",
    time: "2026-04-06 19:15:04.202110+00",
    duration: "1m 02s",
    items: "312 items",
    color: "#FF4500",
  },
  {
    id: "x-3",
    provider: "X",
    account: "@taras",
    summary: "Some media failed",
    details: "A few media URLs returned 404. The posts were saved, but media previews are missing.",
    status: "warning",
    time: "2026-04-08 02:03:41.700451+00",
    duration: "36s",
    items: "8 failed",
    color: "#000000",
  },
  {
    id: "youtube-3",
    provider: "YouTube",
    account: "@taras",
    summary: "History sync completed",
    details: "Imported recent watch history. Private videos were excluded automatically.",
    status: "success",
    time: "2026-04-14 00:27:58.046292+00",
    duration: "48s",
    items: "155 entries",
    color: "#FF0000",
  },
  {
    id: "pinterest-3",
    provider: "Pinterest",
    account: "@taras",
    summary: "Missing permissions",
    details:
      "Couldn’t access one or more secret boards. Reconnect with updated permissions to include them.",
    status: "warning",
    time: "2026-04-01 03:09:26.667520+00",
    duration: "6s",
    items: "2 boards",
    color: "#E60023",
  },
  {
    id: "firefox-3",
    provider: "Firefox",
    account: "Work profile",
    summary: "Cleanup completed",
    details:
      "Removed empty folders and normalized titles. Your collections were updated without duplicates.",
    status: "success",
    time: "2026-03-29 23:57:12.309015+00",
    duration: "14s",
    items: "68 updated",
    color: "#FF7139",
  },
] satisfies SyncActivityItem[];

function getSyncActivityTimestamp(time: string) {
  const normalized = time.replace(" ", "T").replace(/\+00$/, "Z");
  const parsed = Date.parse(normalized);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function getSyncActivityDayLabel(time: string) {
  const timestamp = getSyncActivityTimestamp(time);
  if (!timestamp) return "Unknown date";

  const now = new Date();
  const activityDate = new Date(timestamp);
  const msPerDay = 1000 * 60 * 60 * 24;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfActivityDay = new Date(
    activityDate.getFullYear(),
    activityDate.getMonth(),
    activityDate.getDate(),
  );

  const diffInDays = Math.floor((startOfToday.getTime() - startOfActivityDay.getTime()) / msPerDay);

  if (diffInDays <= 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  return "Earlier";
}

const SORTED_SYNC_ACTIVITY = [...SYNC_ACTIVITY].sort(
  (a, b) => getSyncActivityTimestamp(b.time) - getSyncActivityTimestamp(a.time),
);

function getProviderIcon(provider: string): {src: string; invertOnDark?: boolean} | null {
  const p = provider.trim().toLowerCase();

  const match = PROVIDERS.find((x) => x.name.trim().toLowerCase() === p);
  if (!match) return null;

  return {src: match.image, invertOnDark: match.invertOnDark};
}

function matchesSyncTag(item: SyncActivityItem, tag: SyncActivityTag) {
  if (tag === "all") return true;
  if (tag === "info") return item.status === "running";
  return item.status === tag;
}

function matchesSyncQuery(item: SyncActivityItem, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  return [
    item.provider,
    item.account,
    item.summary,
    item.details,
    item.items,
    item.duration,
    formatTimeRelativeUtc(item.time),
  ].some((value) => value.toLowerCase().includes(query));
}

function getSyncedItemCount(itemsLabel: string) {
  const match = itemsLabel.match(/[\d,]+/);
  if (!match) return null;

  const parsed = Number.parseInt(match[0].replaceAll(",", ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function SyncActivitySection() {
  const initialCount = 5;
  const step = 10;

  const [activityCollapsed, setActivityCollapsed] = useState(false);
  const [selectedTag, setSelectedTag] = useState<SyncActivityTag>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const filteredActivity = useMemo(
    () =>
      SORTED_SYNC_ACTIVITY.filter(
        (item) => matchesSyncTag(item, selectedTag) && matchesSyncQuery(item, searchQuery),
      ),
    [searchQuery, selectedTag],
  );
  const totalCount = filteredActivity.length;
  const clampedVisibleCount = Math.min(visibleCount, totalCount);
  const visibleActivity = filteredActivity.slice(0, clampedVisibleCount);
  const canShowMore = clampedVisibleCount < totalCount;
  const showToggle = totalCount > initialCount;

  return (
    <div className="space-y-4">
      <h4 className="text-base font-[550]">
        <button
          type="button"
          onClick={() => setActivityCollapsed((v) => !v)}
          aria-expanded={!activityCollapsed}
          className="text-foreground/95 group hit-area-5 [&>svg]:text-muted-foreground relative inline-flex cursor-pointer items-center">
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "absolute top-1/2 left-[-21px] -translate-y-1/2 opacity-0 transition-opacity duration-150 ease-out will-change-transform group-hover:opacity-100",
              activityCollapsed && "opacity-100",
            )}
            style={{transformOrigin: "50% 50%"}}
            initial={false}
            animate={{rotate: activityCollapsed ? 90 : 0}}
            transition={{duration: 0.22, ease: [0.22, 1, 0.36, 1]}}
            aria-hidden>
            <path
              d="M6.80473 3.52859C6.5444 3.26824 6.1224 3.26824 5.862 3.52859C5.60167 3.78894 5.60167 4.21095 5.862 4.4713L9.39067 7.99993L5.862 11.5286C5.60167 11.7889 5.60167 12.2109 5.862 12.4713C6.1224 12.7317 6.5444 12.7317 6.80473 12.4713L10.8047 8.47133C11.0651 8.21093 11.0651 7.78893 10.8047 7.5286L6.80473 3.52859Z"
              fill="currentColor"
            />
          </motion.svg>
          Sync activity
        </button>
      </h4>

      <div className="">
        <motion.div
          initial={false}
          animate={activityCollapsed ? "collapsed" : "expanded"}
          variants={{
            expanded: {height: "auto", opacity: 1},
            collapsed: {height: 0, opacity: 0},
          }}
          transition={{
            height: {duration: 0.2, ease: [0.22, 1, 0.36, 1]},
            opacity: {duration: 0.12, ease: [0.22, 1, 0.36, 1]},
          }}
          className={cn("overflow-hidden", activityCollapsed && "pointer-events-none")}>
          <div className="pt-0.5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <Tabs
                value={selectedTag}
                onValueChange={(value) => {
                  setSelectedTag(value as SyncActivityTag);
                  setVisibleCount(initialCount);
                }}>
                <TabsList variant="underline" className="flex-wrap">
                  <TabsTab value="all" className="hit-area-2">
                    All
                  </TabsTab>
                  <TabsTab value="success" className="hit-area-2">
                    Success
                  </TabsTab>
                  <TabsTab value="error" className="hit-area-2">
                    Errors
                  </TabsTab>
                  <TabsTab value="warning" className="hit-area-2">
                    Warnings
                  </TabsTab>
                  <TabsTab value="info" className="hit-area-2">
                    Info
                  </TabsTab>
                </TabsList>
              </Tabs>

              <InputGroup className="w-full max-w-[320px]">
                <InputGroupInput
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(initialCount);
                  }}
                  aria-label="Search sync activity"
                  placeholder="Search sync activity"
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

            {totalCount === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No sync activity matches your filters.
              </p>
            ) : null}

            <Accordion>
              {visibleActivity.map((item, index) => {
                const currentDayLabel = getSyncActivityDayLabel(item.time);
                const previousDayLabel =
                  index > 0
                    ? getSyncActivityDayLabel(visibleActivity[index - 1]?.time ?? "")
                    : null;
                const showDayLabel = index === 0 || currentDayLabel !== previousDayLabel;

                return (
                  <SyncActivityRow
                    key={item.id}
                    item={item}
                    dayLabel={showDayLabel ? currentDayLabel : null}
                  />
                );
              })}
            </Accordion>

            {showToggle ? (
              <div className="mx-auto flex w-full justify-center pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVisibleCount((v) => {
                      if (v < totalCount) return Math.min(v + step, totalCount);
                      return initialCount;
                    });
                  }}>
                  {canShowMore ? "Show 10 more" : "Show less"}
                </Button>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SyncActivityRow({item, dayLabel}: {item: SyncActivityItem; dayLabel: string | null}) {
  const providerIcon = getProviderIcon(item.provider);
  const syncedCount = item.status === "success" ? getSyncedItemCount(item.items) : null;

  return (
    <AccordionItem value={item.id} className="border-border/80">
      <div className="hover:bg-muted/25 relative px-0 transition-colors">
        <div className="absolute top-0 bottom-0 left-0 w-px" />
        {dayLabel ? <div className="text-muted-foreground pt-3 text-sm">{dayLabel}</div> : null}

        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex w-full items-start gap-3 md:items-center">
            {providerIcon ? (
              <Image
                src={providerIcon.src}
                alt={item.provider}
                width={20}
                height={20}
                className={cn(providerIcon.invertOnDark && "dark:invert")}
              />
            ) : (
              <div className="size-5 shrink-0" aria-hidden />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <ActivityStatusIcon status={item.status} />
                <p className="text-foreground text-sm font-medium">{item.provider}</p>
                <span className="text-muted-foreground text-sm font-medium">-</span>
                <p className="text-muted-foreground text-sm font-medium">{item.summary}</p>
                {syncedCount !== null ? (
                  <span className="text-foreground rounded-sm border px-1 text-xs">
                    +{syncedCount.toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-center md:gap-3">
              <span className="text-muted-foreground text-[13px]">
                {formatTimeRelativeUtc(item.time)}
              </span>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pb-3">
          <Alert
            variant={
              item.status === "success"
                ? "success"
                : item.status === "running"
                  ? "info"
                  : item.status === "error"
                    ? "error"
                    : "warning"
            }
            className="rounded-lg py-1.5">
            <AlertTitle className="text-foreground/85">{item.details}</AlertTitle>
          </Alert>
        </AccordionContent>
      </div>
    </AccordionItem>
  );
}

function ActivityStatusIcon({status}: {status: SyncActivityStatus}) {
  if (status === "success") {
    return <SuccessCheckIcon className="text-success size-5 shrink-0" aria-hidden />;
  }

  if (status === "running") {
    return <RotatingIcon className="text-info size-5 shrink-0 animate-spin" />;
  }

  if (status === "warning") {
    return <TriangleAlertIcon className="text-warning size-5 shrink-0" aria-hidden />;
  }

  return <CircleXIcon className="text-destructive size-5 shrink-0" aria-hidden />;
}
