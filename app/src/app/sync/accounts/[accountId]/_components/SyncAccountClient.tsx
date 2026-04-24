"use client";

import {useCallback, useMemo, useRef, useState} from "react";
import {SyncToolbar} from "./SyncToolbar";
import {SyncItemsList} from "./SyncItemsList";
import {SyncSelectionActionBar} from "./SyncSelectionActionBar";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {SortMode, TypeFilter} from "@/app/home/_types";
import type {SyncItem, SyncStatusFilter} from "../_types";
import type {PostBookmarkMetadata} from "@/app/home/_types/bookmark-metadata";

interface SyncAccountClientProps {
  typeFilter: TypeFilter;
}

// ---------------------------------------------------------------------------
// Fake data
// ---------------------------------------------------------------------------

function makePost(
  id: string,
  sync_account_id: string,
  userName: string,
  screenName: string,
  avatarUrl: string,
  text: string,
  date: string,
  likes: number,
  retweets: number,
  replies: number,
  url: string,
): SyncItem {
  const meta: PostBookmarkMetadata = {
    platform: "x",
    tweetId: id,
    text,
    date,
    date_epoch: new Date(date).getTime(),
    user_name: userName,
    user_screen_name: screenName,
    user_profile_image_url: avatarUrl,
    likes,
    retweets,
    replies,
    lang: "en",
    hashtags: [],
    hasMedia: false,
    media_extended: [],
    qrt: null,
  };

  return {
    id,
    kind: "post",
    title: text.slice(0, 80),
    description: text,
    created_at: date,
    url,
    user_id: "fake-user",
    updated_at: date,
    archived_at: "",
    deleted_at: "",
    notes: "",
    metadata: meta,
    sync_account_id,
    synced_at: date,
  };
}

const FAKE_AVATAR = "https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg";

const FAKE_SYNC_ITEMS: SyncItem[] = [
  makePost(
    "s1",
    "acc_3",
    "Andrej Karpathy",
    "karpathy",
    FAKE_AVATAR,
    "The hottest new programming language is English. Not joking — increasingly, the way you write software is by describing what you want in natural language and having an LLM generate the code.",
    "2025-03-15T10:22:00Z",
    14200,
    3100,
    892,
    "https://x.com/karpathy/status/1",
  ),
  makePost(
    "s2",
    "acc_3",
    "Sam Altman",
    "sama",
    FAKE_AVATAR,
    "o3 is now available in ChatGPT for Plus and Team users. It's the smartest model we've ever deployed.",
    "2025-03-14T18:05:00Z",
    31000,
    7200,
    1540,
    "https://x.com/sama/status/2",
  ),
  makePost(
    "s3",
    "acc_3",
    "Yann LeCun",
    "ylecun",
    FAKE_AVATAR,
    "Reminder: LLMs do not reason. They produce text that looks like reasoning. There is a huge difference between symbol manipulation and actual understanding of the world.",
    "2025-03-14T09:11:00Z",
    8900,
    2400,
    1120,
    "https://x.com/ylecun/status/3",
  ),
  makePost(
    "s4",
    "acc_3",
    "Pieter Levels",
    "levelsio",
    FAKE_AVATAR,
    "I'm now making $3.2M ARR from solo projects, all bootstrapped. The model: build fast, iterate on user feedback, keep costs minimal. No investors, no employees, just leverage.",
    "2025-03-13T14:33:00Z",
    22000,
    4800,
    970,
    "https://x.com/levelsio/status/4",
  ),
  makePost(
    "s5",
    "acc_3",
    "Paul Graham",
    "paulg",
    FAKE_AVATAR,
    "The most underrated skill in startups is the ability to tell a story that makes people feel something. Logic convinces minds. Stories move people to act.",
    "2025-03-12T20:44:00Z",
    18700,
    5100,
    703,
    "https://x.com/paulg/status/5",
  ),
  makePost(
    "s6",
    "acc_3",
    "Nat Friedman",
    "natfriedman",
    FAKE_AVATAR,
    "AlphaFold changed biology. Sora is changing media. The next thing that changes an entire industry in one model release is coming sooner than you think.",
    "2025-03-12T11:15:00Z",
    9600,
    2100,
    445,
    "https://x.com/natfriedman/status/6",
  ),
  makePost(
    "s7",
    "acc_3",
    "Dan Abramov",
    "dan_abramov",
    FAKE_AVATAR,
    "React Server Components fundamentally shift where you put your async logic. The mental model isn't 'client vs server' — it's 'component is a function that can be async or not'.",
    "2025-03-11T16:28:00Z",
    6200,
    1700,
    390,
    "https://x.com/dan_abramov/status/7",
  ),
  makePost(
    "s8",
    "acc_3",
    "Guillermo Rauch",
    "rauchg",
    FAKE_AVATAR,
    "The fastest website is one that doesn't have to load. The second fastest is one that's already in the cache. Everything else is optimization.",
    "2025-03-10T08:52:00Z",
    11300,
    2900,
    528,
    "https://x.com/rauchg/status/8",
  ),
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SyncAccountClient({typeFilter}: SyncAccountClientProps) {
  const view = useViewOptionsStore((state) => state.view);

  const [sort, setSort] = useState<SortMode>("recent");
  const [statusFilter, setStatusFilter] = useState<SyncStatusFilter>("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [removingIds] = useState<Map<string, "delete" | "archive">>(new Map());

  const scrollAreaRootRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = useMemo(() => {
    const items = [...FAKE_SYNC_ITEMS].filter((item) => !removingIds.has(item.id));
    if (sort === "oldest") return items.reverse();
    return items;
  }, [sort, removingIds]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const setSelected = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleItemRemoved = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleMenuExclude = useCallback((item: SyncItem) => {
    console.log("dismiss sync item", item.id);
  }, []);

  const handleItemSave = useCallback((item: SyncItem) => {
    console.log("save to bookmarks", item.id);
  }, []);

  const handleItemDismiss = useCallback((item: SyncItem) => {
    console.log("dismiss item", item.id);
  }, []);

  const handleSelectionEnabledChange = useCallback((enabled: boolean) => {
    setSelectionMode(enabled);
    if (!enabled) setSelectedIds(new Set());
  }, []);

  const selectedCount = selectedIds.size;
  const allSelected = selectedCount > 0 && selectedCount === visibleItems.length;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleItems.map((item) => item.id)));
    }
  }, [allSelected, visibleItems]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleCopyLinks = useCallback(() => {
    const urls = visibleItems
      .filter((item) => selectedIds.has(item.id))
      .map((item) => item.url)
      .join("\n");
    void navigator.clipboard.writeText(urls);
  }, [visibleItems, selectedIds]);

  const handleDismissSelected = useCallback(() => {
    console.log("dismiss selected", [...selectedIds]);
  }, [selectedIds]);

  const handleSaveSelected = useCallback(() => {
    console.log("save selected to bookmarks", [...selectedIds]);
  }, [selectedIds]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <SyncToolbar
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sort={sort}
        onSortChange={setSort}
        selectionMode={selectionMode}
        onSelectionEnabledChange={handleSelectionEnabledChange}
      />
      <SyncItemsList
        view={view}
        typeFilter={typeFilter}
        visibleItems={visibleItems}
        isInitialLoad={false}
        isFetchingNextPage={false}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        removingIds={removingIds}
        scrollAreaRootRef={scrollAreaRootRef}
        bottomSentinelRef={bottomSentinelRef}
        onItemRemoved={handleItemRemoved}
        toggleSelected={toggleSelected}
        setSelected={setSelected}
        onMenuExclude={handleMenuExclude}
        onItemSave={handleItemSave}
        onItemDismiss={handleItemDismiss}
      />
      <SyncSelectionActionBar
        visible={selectionMode && selectedCount > 0}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onCopyLinks={handleCopyLinks}
        onSave={handleSaveSelected}
        onDismiss={handleDismissSelected}
      />
    </div>
  );
}
