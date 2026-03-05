"use client";
import * as React from "react";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import {cn} from "@/lib/utils";
import {useEffect, useState} from "react";
import NumberFlow from "@number-flow/react";
import {Bookmark, GridCard, ItemRow} from "@/components/bookmark/Bookmark";
import {BookmarkMenu} from "@/components/bookmark/BookmarkMenu";
import {
  useInfiniteQuery,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {supabase} from "@/components/utils/supabase/client";
import Spinner from "@/components/shadcn/coss-ui";
import {AnimatedItem} from "@/components/bookmark/AnimatedItem";
import {toastManager} from "@/components/coss-ui/toast";
import {ViewToggle, TypeSelect, SortSelect} from "./AllItemsToolbar";
import type {ViewMode, TypeFilter, SortMode} from "./AllItemsToolbar";
import {NewBookmarkRow, NewBookmarkGridCard} from "./NewBookmarkPlaceholder";
import {DeleteBookmarkDialog} from "./DeleteBookmarkDialog";
import {SelectionActionBar} from "@/components/bookmark/SelectionActionBar";
import {archiveBookmarks} from "@/app/actions/bookmarks";
import {tagNamesFromJoin, type BookmarkTagJoinRow} from "@/lib/bookmark-tags";
import {useSearchParams, useRouter} from "next/navigation";
import type {Collection} from "@/app/actions/collections";
import {getCollections} from "@/app/actions/collections";
import {Button} from "@/components/coss-ui/button";
import {DeleteCollectionDialog} from "@/components/providers/DeleteCollectionDialog";
import {CollectionDialog} from "@/components/providers/CollectionDialog";
import {PAGE_SIZE} from "../_constants";

function normalizeTagParam(value: string | null | undefined) {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function normalizeTagName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function LoadingSpinner({className}: {className?: string}) {
  return (
    <div className={className}>
      <Spinner className="mx-auto size-4 animate-spin" />
    </div>
  );
}

export function AllItemsClient({
  userId,
  initialBookmarks,
  totalCount,
}: {
  userId: string | null;
  initialBookmarks: Bookmark[];
  totalCount: number;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagFilter = normalizeTagParam(searchParams.get("tag") ?? searchParams.get("tab"));
  const collectionFilter = searchParams.get("collection");

  // ── View & filter state ──
  const [view, setView] = useState<ViewMode>("list");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortMode>("recent");

  // ── UI-only selection state (no server writes yet) ──
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable)
        return;

      // Escape → exit selection mode
      if (e.key === "Escape" && selectionMode) {
        setSelectedIds(new Set());
        setSelectionMode(false);
        return;
      }

      // Shift+V → toggle list/grid view
      if (e.key === "V" && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setView((v) => (v === "list" ? "grid" : "list"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectionMode]);

  // ── Context menu state ──
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItemId, setMenuItemId] = useState<string | undefined>(undefined);

  // ── Delete dialog state ──
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<Bookmark[]>([]);
  const [deleteCollectionDialogOpen, setDeleteCollectionDialogOpen] = useState(false);
  const [editCollectionDialogOpen, setEditCollectionDialogOpen] = useState(false);

  // ── Refs for infinite scroll ──
  const scrollAreaRootRef = React.useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = React.useRef<HTMLDivElement | null>(null);

  // ── Add-bookmark mutation tracking ──
  // Watches the global "add-bookmark" mutation so we can show a skeleton
  // placeholder that crossfades into the real bookmark once it resolves.
  const addMutations = useMutationState({
    filters: {mutationKey: ["add-bookmark"]},
    select: (m) => ({
      status: m.state.status as string,
      inputUrl: (m.state.variables as {url: string; tags?: string[]} | undefined)?.url,
      inputTags: (m.state.variables as {url: string; tags?: string[]} | undefined)?.tags ?? [],
      resultUrl: (m.state.data as {url: string} | undefined)?.url,
    }),
  });

  const latestAdd = addMutations.at(-1);
  const isPending = latestAdd?.status === "pending";
  const isError = latestAdd?.status === "error";
  const inputUrl = latestAdd?.inputUrl;
  const resultUrl = latestAdd?.resultUrl;
  const latestAddAppliesToCurrentFilter =
    tagFilter === null ||
    (latestAdd?.inputTags ?? []).some((t) => normalizeTagName(t) === (tagFilter ?? ""));

  // ── Delete-bookmark mutation tracking ──
  // Collects IDs of bookmarks currently being deleted (pending/success)
  // so we can play an exit animation before removing them from the list.
  const deletingIds = useMutationState({
    filters: {mutationKey: ["delete-bookmark"]},
    select: (m) =>
      m.state.status === "pending" || m.state.status === "success"
        ? (m.state.variables as string | string[])
        : null,
  })
    .filter((v): v is string | string[] => !!v)
    .flat();

  const archivingIds = useMutationState({
    filters: {mutationKey: ["archive-bookmark"]},
    select: (m) =>
      m.state.status === "pending" || m.state.status === "success"
        ? (m.state.variables as string | string[])
        : null,
  })
    .filter((v): v is string | string[] => !!v)
    .flat();

  // ── Exit-animation lifecycle ──
  // Once the exit animation finishes, we add the ID to `animatedOutIds`
  // so it gets excluded from the visible list on the next render.
  const [animatedOutIds, setAnimatedOutIds] = React.useState<Set<string>>(new Set());

  const removingIds = React.useMemo(() => {
    const map = new Map<string, "delete" | "archive">();
    for (const id of deletingIds) {
      if (!animatedOutIds.has(id)) map.set(id, "delete");
    }
    for (const id of archivingIds) {
      if (!animatedOutIds.has(id) && !map.has(id)) map.set(id, "archive");
    }
    return map;
  }, [deletingIds, archivingIds, animatedOutIds]);

  const handleItemRemoved = React.useCallback((id: string) => {
    setAnimatedOutIds((prev) => new Set(prev).add(id));
  }, []);

  // ── New-bookmark animation URL ──
  // This is set during render (React-sanctioned pattern for deriving state
  // from mutation status without an effect). When a bookmark is being added
  // we show a skeleton placeholder; on error we clear it immediately.
  const [animatingUrl, setAnimatingUrl] = useState<string | null>(null);

  if (isPending && inputUrl && latestAddAppliesToCurrentFilter && animatingUrl !== inputUrl) {
    setAnimatingUrl(inputUrl);
  }
  if (isError && animatingUrl !== null) {
    setAnimatingUrl(null);
  }

  // ── Bookmarks query (paginated) ──
  const bookmarksQuery = useInfiniteQuery({
    queryKey: [
      "bookmarks",
      "all-items",
      userId,
      PAGE_SIZE,
      sort,
      tagFilter,
      collectionFilter,
      typeFilter,
    ],
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({pageParam}) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;

      if (!userId) {
        return {
          items: [] as Bookmark[],
          nextOffset: undefined as number | undefined,
          totalCount: 0,
        };
      }

      // When filtering by tag or collection we use an inner join so only matching bookmarks are returned.
      const getBookmarksSelect = () => {
        const hasTag = !!tagFilter;
        const hasCollection = !!collectionFilter;

        switch (true) {
          case hasTag && hasCollection:
            return "*, bookmark_tags!inner(tags!inner(name)), bookmark_collections!inner(collections(id, name))";
          case hasTag:
            return "*, bookmark_tags!inner(tags!inner(name)), bookmark_collections(collections(id, name))";
          case hasCollection:
            return "*, bookmark_tags(tags(name)), bookmark_collections!inner(collections(id, name))";
          default:
            return "*, bookmark_tags(tags(name)), bookmark_collections(collections(id, name))";
        }
      };

      const bookmarksSelect = getBookmarksSelect();

      let q =
        offset === 0
          ? supabase.from("bookmarks").select(bookmarksSelect as "*", {count: "exact"})
          : supabase.from("bookmarks").select(bookmarksSelect as "*");

      q = q.eq("user_id", userId).is("archived_at", null).is("deleted_at", null);

      if (tagFilter) {
        q = q.eq("bookmark_tags.tags.name", tagFilter);
      }

      if (collectionFilter) {
        q = q.eq("bookmark_collections.collection_id", collectionFilter);
      }

      if (typeFilter !== "all") {
        q = q.eq("kind", typeFilter);
      }

      // Apply sort order
      if (sort === "oldest") {
        q = q.order("created_at", {ascending: true});
      } else if (sort === "az") {
        q = q.order("title", {ascending: true}).order("id", {ascending: true});
      } else {
        q = q.order("created_at", {ascending: false});
      }

      const {data, count, error} = await q.range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;

      type BookmarkRowWithJoins = Bookmark & {
        bookmark_tags?: BookmarkTagJoinRow[] | null;
        bookmark_collections?: {collections: {id: string; name: string}}[] | null;
      };

      const items: Bookmark[] = ((data ?? []) as unknown as BookmarkRowWithJoins[]).map(
        ({bookmark_tags, bookmark_collections, ...bookmark}) => ({
          ...(bookmark as Bookmark),
          tags: tagNamesFromJoin(bookmark_tags),
          collections: bookmark_collections?.map((bc) => bc.collections) ?? [],
        }),
      );
      const nextOffset = items.length < PAGE_SIZE ? undefined : offset + PAGE_SIZE;
      return {items, nextOffset, totalCount: count ?? 0};
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    // Only seed initial data for the default sort and no filters to avoid stale mismatch
    initialData:
      sort === "recent" && !tagFilter && !collectionFilter && typeFilter === "all"
        ? {
            pageParams: [0],
            pages: [
              {
                items: initialBookmarks,
                nextOffset: initialBookmarks.length < PAGE_SIZE ? undefined : PAGE_SIZE,
                totalCount,
              },
            ],
          }
        : undefined,
  });

  // ── Derived data ──
  const allBookmarks = React.useMemo(() => {
    return bookmarksQuery.data?.pages.flatMap((p) => p.items) ?? [];
  }, [bookmarksQuery.data]);

  // Derive the live menu item from query data so it stays fresh after resets
  const menuItem = React.useMemo(() => {
    if (!menuItemId) return undefined;
    return allBookmarks.find((b) => b.id === menuItemId);
  }, [allBookmarks, menuItemId]);

  // Match the newly-added bookmark from the fetched list for the crossfade
  const resolvedBookmark =
    animatingUrl && resultUrl ? (allBookmarks.find((b) => b.url === resultUrl) ?? null) : null;

  React.useEffect(() => {
    if (!animatingUrl) return;
    // If the user is on a tag filter that doesn't include the new bookmark,
    // don't keep a skeleton placeholder around.
    if (!latestAddAppliesToCurrentFilter) {
      setAnimatingUrl(null);
      return;
    }
    // if the mutation succeeded but the bookmark never appears in this list
    if (latestAdd?.status === "success" && !resolvedBookmark) {
      const t = window.setTimeout(() => setAnimatingUrl(null), 5000);
      return () => window.clearTimeout(t);
    }
  }, [animatingUrl, latestAdd?.status, latestAddAppliesToCurrentFilter, resolvedBookmark]);

  const currentTotalCount = bookmarksQuery.data?.pages[0]?.totalCount ?? totalCount;

  const handleTransitionDone = React.useCallback(() => setAnimatingUrl(null), []);

  const {hasNextPage, isFetchingNextPage, fetchNextPage} = bookmarksQuery;

  // ── Infinite scroll via IntersectionObserver ──
  // Watches a sentinel div at the bottom of the list. When it enters the
  // viewport (with 200px margin) we fetch the next page automatically.
  React.useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    const root = scrollAreaRootRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as Element | null;

    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {root, rootMargin: "200px 0px"},
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // ── Visible items (filtered, excluding animating/deleted) ──
  const visibleItems = React.useMemo(() => {
    let items = allBookmarks;

    // Hide the bookmark currently crossfading in the placeholder slot
    if (resolvedBookmark) {
      items = items.filter((i) => i.id !== resolvedBookmark.id);
    }

    // Hide items whose exit animation already completed
    if (animatedOutIds.size > 0) {
      items = items.filter((i) => !animatedOutIds.has(i.id));
    }

    return items;
  }, [allBookmarks, resolvedBookmark, animatedOutIds]);

  const visibleIds = React.useMemo(() => visibleItems.map((i) => i.id), [visibleItems]);
  const {data: collections} = useQuery({
    queryKey: ["collections"],
    queryFn: async () => await getCollections(),
  });

  const activeCollection = React.useMemo(() => {
    if (!collectionFilter || !collections) return null;
    return (collections as Collection[]).find((c) => c.id === collectionFilter) ?? null;
  }, [collectionFilter, collections]);

  const selectedCount = selectedIds.size;

  React.useEffect(() => {
    if (!selectionMode) return;
    const visible = new Set(visibleIds);
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [selectionMode, visibleIds]);

  const setSelected = React.useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleSelected = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setSelectionEnabled = React.useCallback((enabled: boolean) => {
    setSelectionMode(enabled);
    if (!enabled) setSelectedIds(new Set());
  }, []);

  const isInitialLoad = bookmarksQuery.isLoading && visibleItems.length === 0;

  const handleClearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationKey: ["archive-bookmark"],
    mutationFn: async (ids: string | string[]) => {
      return archiveBookmarks(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
      queryClient.invalidateQueries({queryKey: ["tags"]});
    },
    onError: (error) => {
      console.error("Failed to archive bookmark:", error);
      toastManager.add({
        title: "Archive failed",
        description: error instanceof Error ? error.message : "Failed to archive bookmark",
        type: "error",
      });
    },
  });

  const handleArchive = React.useCallback(
    (item: Bookmark) => {
      archiveMutation.mutate(item.id);
      setMenuOpen(false);
      toastManager.add({
        title: "Bookmark archived",
        type: "success",
      });
    },
    [archiveMutation],
  );

  const handleArchiveSelected = React.useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    archiveMutation.mutate(ids);
    toastManager.add({
      title: ids.length === 1 ? "Bookmark archived" : `${ids.length} bookmarks archived`,
      type: "success",
    });
    handleClearSelection();
  }, [selectedIds, archiveMutation, handleClearSelection]);

  const allSelected = selectedIds.size > 0 && selectedIds.size === visibleItems.length;

  const handleSelectAll = React.useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleItems.map((i) => i.id)));
    }
  }, [allSelected, visibleItems]);

  const handleCopySelected = React.useCallback(() => {
    const selectedBookmarks = allBookmarks.filter((item) => selectedIds.has(item.id));
    const urls = selectedBookmarks.map((item) => item.url).join("\n\n");

    if (urls) {
      navigator.clipboard.writeText(urls);
      toastManager.add({
        title: "Copied to clipboard",
        description: `${selectedBookmarks.length} link${selectedBookmarks.length > 1 ? "s" : ""} copied to your clipboard.`,
        type: "success",
      });
      handleClearSelection();
    }
  }, [allBookmarks, selectedIds, handleClearSelection]);

  // ── Callbacks ──
  const openDeleteDialog = React.useCallback((item: Bookmark) => {
    setItemsToDelete([item]);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteSelected = React.useCallback(() => {
    const selectedBookmarks = allBookmarks.filter((item) => selectedIds.has(item.id));
    if (selectedBookmarks.length === 0) return;
    setItemsToDelete(selectedBookmarks);
    setDeleteDialogOpen(true);
  }, [allBookmarks, selectedIds]);

  const openMenu = React.useCallback((item: Bookmark) => {
    setMenuItemId(item.id);
    setMenuOpen(true);
  }, []);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Collection Header */}
      {activeCollection && (
        <div className="border-b px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">{activeCollection.name}</h1>
              {activeCollection.description && (
                <p className="text-muted-foreground text-lg">{activeCollection.description}</p>
              )}
              <div className="text-muted-foreground flex items-center gap-4 pt-2 text-sm">
                <span>
                  Items: <NumberFlow value={currentTotalCount} />
                </span>

                <span>
                  Last updated:{" "}
                  {new Date(activeCollection.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setEditCollectionDialogOpen(true)}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M9.69543 2.36216C10.7842 1.27338 12.5494 1.27338 13.6382 2.36216C14.727 3.45094 14.727 5.21619 13.6382 6.30497L5.66683 14.2764C5.41678 14.5264 5.07764 14.6669 4.72402 14.6669H2.00016C1.63198 14.6669 1.3335 14.3684 1.3335 14.0002V11.2764C1.3335 10.9227 1.47397 10.5836 1.72402 10.3335L8.0575 4.00012L12.0002 7.9428L12.943 7L9.0003 3.05731L9.69543 2.36216Z"
                    fill="currentColor"
                  />
                </svg>
                Edit
              </Button>
              <Button
                variant="destructive-outline"
                onClick={() => setDeleteCollectionDialogOpen(true)}>
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
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Toolbar */}
      <div
        className={cn(
          "bg-background/90 sticky top-0 z-10 px-6 py-3 backdrop-blur",
          activeCollection ? "" : "border-b",
        )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TypeSelect value={typeFilter} onChange={setTypeFilter} />
            <SortSelect value={sort} onChange={setSort} />
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "ring-border relative isolate flex h-8 gap-0.5 rounded-md bg-[rgba(255,255,255,0)] p-0.5",
                "shadow-[0_2px_4px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.06)] ring-1",
              )}>
              <button
                type="button"
                aria-pressed={selectionMode}
                onClick={() => setSelectionEnabled(!selectionMode)}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-md transition-colors duration-150 ease-out",
                  "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
                  selectionMode
                    ? "dark:text-foreground bg-[#F0F0F0] text-[#202020] dark:bg-[#181717]"
                    : "hover:bg-muted/40 bg-transparent text-[#BBBBBB] dark:text-[#606060]",
                )}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8.2476 10.8106L7.8498 11.2084C7.95533 11.3139 8.09843 11.3731 8.2476 11.3731C8.39678 11.3731 8.53987 11.3139 8.64532 11.2084L8.2476 10.8106ZM12.0203 7.83338C12.24 7.6137 12.24 7.25757 12.0203 7.0379C11.8006 6.81823 11.4445 6.81823 11.2248 7.0379L12.0203 7.83338ZM7.14533 8.91292C6.92566 8.69325 6.56951 8.69325 6.34984 8.91292C6.13016 9.1326 6.13016 9.4887 6.34984 9.70837L7.14533 8.91292ZM14.625 6.4125V11.5875H15.75V6.4125H14.625ZM11.5875 14.625H6.4125V15.75H11.5875V14.625ZM3.375 11.5875V6.4125H2.25V11.5875H3.375ZM6.4125 3.375H11.5875V2.25H6.4125V3.375ZM6.4125 14.625C5.77316 14.625 5.32748 14.6245 4.98051 14.5962C4.6401 14.5684 4.44453 14.5166 4.29639 14.4411L3.78566 15.4435C4.11881 15.6132 4.47892 15.684 4.8889 15.7175C5.29231 15.7505 5.79173 15.75 6.4125 15.75V14.625ZM2.25 11.5875C2.25 12.2083 2.24957 12.7077 2.28252 13.1111C2.31602 13.5211 2.38679 13.8811 2.55655 14.2144L3.55893 13.7036C3.48345 13.5555 3.4316 13.3599 3.40379 13.0195C3.37544 12.6725 3.375 12.2269 3.375 11.5875H2.25ZM4.29639 14.4411C3.97887 14.2793 3.72071 14.0211 3.55893 13.7036L2.55655 14.2144C2.82619 14.7436 3.25645 15.1738 3.78566 15.4435L4.29639 14.4411ZM14.625 11.5875C14.625 12.2269 14.6245 12.6725 14.5962 13.0195C14.5684 13.3599 14.5166 13.5555 14.4411 13.7036L15.4435 14.2144C15.6132 13.8811 15.684 13.5211 15.7175 13.1111C15.7505 12.7077 15.75 12.2083 15.75 11.5875H14.625ZM11.5875 15.75C12.2083 15.75 12.7077 15.7505 13.1111 15.7175C13.5211 15.684 13.8811 15.6132 14.2144 15.4435L13.7036 14.4411C13.5555 14.5166 13.3599 14.5684 13.0195 14.5962C12.6725 14.6245 12.2269 14.625 11.5875 14.625V15.75ZM14.4411 13.7036C14.2793 14.0211 14.0211 14.2793 13.7036 14.4411L14.2144 15.4435C14.7436 15.1738 15.1738 14.7436 15.4435 14.2144L14.4411 13.7036ZM15.75 6.4125C15.75 5.79173 15.7505 5.29231 15.7175 4.8889C15.684 4.47892 15.6132 4.11881 15.4435 3.78566L14.4411 4.29639C14.5166 4.44453 14.5684 4.6401 14.5962 4.98051C14.6245 5.32748 14.625 5.77316 14.625 6.4125H15.75ZM11.5875 3.375C12.2269 3.375 12.6725 3.37544 13.0195 3.40379C13.3599 3.4316 13.5555 3.48345 13.7036 3.55893L14.2144 2.55655C13.8811 2.38679 13.5211 2.31602 13.1111 2.28252C12.7077 2.24957 12.2083 2.25 11.5875 2.25V3.375ZM15.4435 3.78566C15.1738 3.25645 14.7436 2.82619 14.2144 2.55655L13.7036 3.55893C14.0211 3.72071 14.2793 3.97887 14.4411 4.29639L15.4435 3.78566ZM3.375 6.4125C3.375 5.77316 3.37544 5.32748 3.40379 4.98051C3.4316 4.6401 3.48345 4.44453 3.55893 4.29639L2.55655 3.78566C2.38679 4.11881 2.31602 4.47892 2.28252 4.8889C2.24957 5.29231 2.25 5.79173 2.25 6.4125H3.375ZM6.4125 2.25C5.79173 2.25 5.29231 2.24957 4.8889 2.28252C4.47892 2.31602 4.11881 2.38679 3.78566 2.55655L4.29639 3.55893C4.44453 3.48345 4.6401 3.4316 4.98051 3.40379C5.32748 3.37544 5.77316 3.375 6.4125 3.375V2.25ZM3.55893 4.29639C3.72071 3.97887 3.97887 3.72071 4.29639 3.55893L3.78566 2.55655C3.25645 2.82619 2.82619 3.25645 2.55655 3.78566L3.55893 4.29639ZM8.64532 11.2084L12.0203 7.83338L11.2248 7.0379L7.8498 10.4129L8.64532 11.2084ZM6.34984 9.70837L7.8498 11.2084L8.64532 10.4129L7.14533 8.91292L6.34984 9.70837Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>
      </div>
      {/* Portalled overlays */}
      <BookmarkMenu
        item={menuItem}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onDelete={openDeleteDialog}
        onArchive={handleArchive}
      />
      <DeleteBookmarkDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        items={itemsToDelete}
        onDeleted={handleClearSelection}
      />
      <DeleteCollectionDialog
        open={deleteCollectionDialogOpen}
        onOpenChange={setDeleteCollectionDialogOpen}
        collections={
          activeCollection ? [{id: activeCollection.id, name: activeCollection.name}] : []
        }
        onDeleted={() => {
          router.push("/all");
        }}
      />

      <CollectionDialog
        open={editCollectionDialogOpen}
        onOpenChange={setEditCollectionDialogOpen}
        collection={activeCollection}
      />
      {/* Item count */}
      {!activeCollection && (
        <div className="text-muted-foreground flex items-center gap-1 px-6 py-3 text-sm">
          <NumberFlow value={currentTotalCount} /> items
        </div>
      )}

      {/* Scrollable content area */}
      <div ref={scrollAreaRootRef} className="h-auto min-h-0 flex-1">
        <ScrollArea className="h-full" scrollbarGutter scrollFade>
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-6 px-6 pb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Skeleton placeholder for a newly-added bookmark */}
              {animatingUrl && (
                <NewBookmarkGridCard
                  url={animatingUrl}
                  bookmark={resolvedBookmark}
                  onDone={handleTransitionDone}
                />
              )}

              {isInitialLoad ? (
                <LoadingSpinner className="text-muted-foreground col-span-full py-8 text-center text-xs" />
              ) : (
                visibleItems.map((item, index) => (
                  <AnimatedItem
                    key={item.id}
                    id={item.id}
                    isRemoving={removingIds.has(item.id)}
                    onRemoved={handleItemRemoved}
                    variant="grid"
                    kind={removingIds.get(item.id) ?? "delete"}>
                    <div
                      className={cn(
                        "relative",
                        selectionMode &&
                          selectedIds.has(item.id) &&
                          "ring-primary rounded-md ring-2",
                      )}
                      onClickCapture={(e) => {
                        if (!selectionMode) return;
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelected(item.id);
                      }}>
                      <GridCard
                        item={item}
                        onOpenMenu={openMenu}
                        onDelete={openDeleteDialog}
                        selectionMode={selectionMode}
                        selectionIndex={index}
                        selectedIds={selectedIds}
                        setSelected={setSelected}
                      />
                    </div>
                  </AnimatedItem>
                ))
              )}

              {/* Pagination loader */}
              {isFetchingNextPage && (
                <LoadingSpinner className="text-muted-foreground col-span-full py-6 text-center text-xs" />
              )}

              {/* Intersection observer sentinel */}
              <div ref={bottomSentinelRef} aria-hidden className="col-span-full h-px" />
            </div>
          ) : (
            <div className="border-t">
              {/* Skeleton placeholder for a newly-added bookmark */}
              {animatingUrl && (
                <NewBookmarkRow
                  url={animatingUrl}
                  bookmark={resolvedBookmark}
                  onDone={handleTransitionDone}
                />
              )}

              {isInitialLoad ? (
                <LoadingSpinner className="text-muted-foreground px-6 py-8 text-center text-xs" />
              ) : (
                visibleItems.map((item, index) => (
                  <AnimatedItem
                    key={item.id}
                    id={item.id}
                    isRemoving={removingIds.has(item.id)}
                    onRemoved={handleItemRemoved}
                    variant="list"
                    kind={removingIds.get(item.id) ?? "delete"}>
                    <div
                      className={cn(
                        "relative",
                        selectionMode && selectedIds.has(item.id) && "bg-muted",
                      )}
                      onClickCapture={(e) => {
                        if (!selectionMode) return;
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelected(item.id);
                      }}>
                      <ItemRow
                        item={item}
                        onOpenMenu={openMenu}
                        onDelete={openDeleteDialog}
                        selectionMode={selectionMode}
                        selectionIndex={index}
                        selectedIds={selectedIds}
                        setSelected={setSelected}
                      />
                    </div>
                  </AnimatedItem>
                ))
              )}

              {/* Pagination loader */}
              {isFetchingNextPage && (
                <LoadingSpinner className="text-muted-foreground px-6 py-6 text-center text-xs" />
              )}

              {/* Intersection observer sentinel */}
              <div ref={bottomSentinelRef} aria-hidden className="h-px" />
            </div>
          )}
        </ScrollArea>
      </div>
      {/* ── Floating selection action bar ── */}
      <SelectionActionBar
        visible={selectionMode && selectedCount > 0}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onCopy={handleCopySelected}
        onArchive={handleArchiveSelected}
        onDelete={handleDeleteSelected}
      />
    </div>
  );
}
