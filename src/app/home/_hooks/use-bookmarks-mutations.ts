import {useState, useEffect} from "react";
import {useMutation, useMutationState, useQueryClient} from "@tanstack/react-query";
import {archiveBookmarks} from "@/app/actions/bookmarks";
import {toastManager} from "@/components/coss-ui/toast";
import {normalizeTagName} from "@/lib/utils";
import type {Bookmark} from "@/components/bookmark/Bookmark";

/**
 * Manages mutation tracking (add/delete/archive)
 */
export function useBookmarksMutations({
  tagFilter,
  allBookmarks,
}: {
  tagFilter: string | null;
  allBookmarks: Bookmark[];
}) {
  const queryClient = useQueryClient();

  // ── Add-bookmark mutation tracking ──
  const addMutations = useMutationState({
    filters: {mutationKey: ["add-bookmark"]},
    select: (m) => ({
      status: m.state.status as string,
      inputUrl: (m.state.variables as {url: string; tags?: string[]} | undefined)?.url,
      inputTags: (m.state.variables as {url: string; tags?: string[]} | undefined)?.tags ?? [],
      resultUrl: (m.state.data as {url: string} | undefined)?.url,
    }),
  });

  const latestAdd = addMutations.at(-1); // get the latest add mutation
  const isPending = latestAdd?.status === "pending";
  const isError = latestAdd?.status === "error";
  const inputUrl = latestAdd?.inputUrl;
  const resultUrl = latestAdd?.resultUrl;
  const latestAddAppliesToCurrentFilter =
    tagFilter === null ||
    (latestAdd?.inputTags ?? []).some((t) => normalizeTagName(t) === (tagFilter ?? ""));

  // ── Delete/Archive mutation tracking ──
  const deletingIds = useMutationState({
    filters: {mutationKey: ["delete-bookmark"]},
    select: (m) =>
      m.state.status === "pending" || m.state.status === "success" ? m.state.variables : null,
  })
    .filter((v): v is string => !!v)
    .flat();

  const archivingIds = useMutationState({
    filters: {mutationKey: ["archive-bookmark"]},
    select: (m) =>
      m.state.status === "pending" || m.state.status === "success" ? m.state.variables : null,
  })
    .filter((v): v is string | string[] => !!v)
    .flat();

  // ── Exit-animation state ──
  const [animatedOutIds, setAnimatedOutIds] = useState<Set<string>>(new Set());

  const archives = archivingIds
    .filter((id) => !animatedOutIds.has(id))
    .map((id) => [id, "archive"] as const);
  const deletes = deletingIds
    .filter((id) => !animatedOutIds.has(id))
    .map((id) => [id, "delete"] as const);

  const removingIds = new Map([...archives, ...deletes]);

  const handleItemRemoved = (id: string) => {
    setAnimatedOutIds((prev) => new Set(prev).add(id));
  };

  // ── New-bookmark animation state ──
  const [animatingUrl, setAnimatingUrl] = useState<string | null>(null);

  // Sync state during render to avoid cascading renders in useEffect
  if (animatingUrl !== null && (!latestAddAppliesToCurrentFilter || isError)) {
    setAnimatingUrl(null);
  } else if (
    isPending &&
    inputUrl &&
    latestAddAppliesToCurrentFilter &&
    animatingUrl !== inputUrl
  ) {
    setAnimatingUrl(inputUrl);
  }

  const resolvedBookmark =
    animatingUrl && resultUrl ? (allBookmarks.find((b) => b.url === resultUrl) ?? null) : null;

  useEffect(() => {
    if (!animatingUrl) return;

    if (latestAdd?.status === "success" && !resolvedBookmark) {
      const t = window.setTimeout(() => setAnimatingUrl(null), 5000);
      return () => window.clearTimeout(t);
    }
  }, [animatingUrl, latestAdd?.status, resolvedBookmark]);

  const handleTransitionDone = () => {
    setAnimatingUrl(null);
  };

  // ── Archive Mutation ──
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

  return {
    latestAdd,
    isPending,
    isError,
    inputUrl,
    resultUrl,
    latestAddAppliesToCurrentFilter,
    removingIds,
    animatedOutIds,
    handleItemRemoved,
    animatingUrl,
    resolvedBookmark,
    handleTransitionDone,
    archiveMutation,
  };
}
