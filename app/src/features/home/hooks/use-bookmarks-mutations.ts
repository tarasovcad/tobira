import {useState, useEffect, useMemo, useCallback} from "react";
import {useMutation, useMutationState, useQueryClient} from "@tanstack/react-query";
import {archiveBookmarks} from "@/app/actions/bookmarks";
import type {Bookmark} from "@/components/bookmark/types";
import {toastManager} from "@/components/ui/coss/toast";
import {normalizeTagName} from "@/lib/bookmarks/tag-utils";
import type {MediaMediaItem} from "@/components/bookmark/types/metadata";

/**
 * Manages mutation tracking (add/delete/archive)
 */
export function useBookmarksMutations({
  tagFilter,
  activeTagName,
  allBookmarks,
}: {
  tagFilter: string | null;
  activeTagName: string | null;
  allBookmarks: Bookmark[];
}) {
  const queryClient = useQueryClient();

  // ── Add-bookmark mutation tracking ──
  const addMutations = useMutationState({
    filters: {mutationKey: ["add-bookmark"]},
    select: (m) => ({
      status: m.state.status as string,
      submittedAt: m.state.submittedAt,
      inputUrl: (m.state.variables as {url: string; tags?: string[]} | undefined)?.url,
      inputTags: (m.state.variables as {url: string; tags?: string[]} | undefined)?.tags ?? [],
      resultIds: (() => {
        const d = m.state.data as {id?: string; ids?: string[]} | undefined;
        if (d?.ids?.length) return d.ids;
        if (d?.id) return [d.id];
        return [] as string[];
      })(),
      kind: (m.state.variables as {kind: "website" | "media"} | undefined)?.kind,
      selectedMediaUrls: (m.state.variables as {selectedMediaUrls?: string[]} | undefined)
        ?.selectedMediaUrls,
      selectedMediaItems: (m.state.variables as {selectedMediaItems?: MediaMediaItem[]} | undefined)
        ?.selectedMediaItems,
      resultMediaItems: (m.state.data as {mediaItems?: MediaMediaItem[]} | undefined)?.mediaItems,
      hasMultipleMediaOptions:
        Array.isArray((m.state.data as {media?: string[]} | undefined)?.media) &&
        ((m.state.data as {media?: string[]} | undefined)?.media?.length ?? 0) > 1,
    }),
  });

  const latestAdd = addMutations.at(-1); // get the latest add mutation
  const isPending = latestAdd?.status === "pending";
  const isError = latestAdd?.status === "error";
  const inputUrl = latestAdd?.inputUrl;
  const latestAddAppliesToCurrentFilter =
    tagFilter === null ||
    (!!activeTagName &&
      (latestAdd?.inputTags ?? []).some(
        (t) => normalizeTagName(t) === normalizeTagName(activeTagName),
      ));

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

  const removingIds = useMemo(() => {
    const archives = archivingIds
      .filter((id) => !animatedOutIds.has(id))
      .map((id) => [id, "archive"] as const);
    const deletes = deletingIds
      .filter((id) => !animatedOutIds.has(id))
      .map((id) => [id, "delete"] as const);

    return new Map([...archives, ...deletes]);
  }, [animatedOutIds, archivingIds, deletingIds]);

  const handleItemRemoved = useCallback((id: string) => {
    setAnimatedOutIds((prev) => new Set(prev).add(id));
  }, []);

  // ── New-bookmark animation state ──
  const [animatingUrl, setAnimatingUrl] = useState<string | null>(null);
  const [handledAnimationSubmittedAt, setHandledAnimationSubmittedAt] = useState<number | null>(
    null,
  );

  // Sync state during render to avoid cascading renders in useEffect
  const wasMediaPhase1Aborted =
    latestAdd?.kind === "media" &&
    !latestAdd?.selectedMediaUrls &&
    latestAdd?.hasMultipleMediaOptions;
  const isMediaPhase1Pending =
    isPending && latestAdd?.kind === "media" && !latestAdd?.selectedMediaUrls;
  const isSingleMediaSuccess =
    latestAdd?.status === "success" &&
    latestAdd?.kind === "media" &&
    !latestAdd?.selectedMediaUrls &&
    !latestAdd?.hasMultipleMediaOptions;
  const shouldAnimateLatestAdd =
    latestAddAppliesToCurrentFilter && latestAdd?.submittedAt !== handledAnimationSubmittedAt;

  if (
    animatingUrl !== null &&
    (!latestAddAppliesToCurrentFilter || isError || wasMediaPhase1Aborted)
  ) {
    setAnimatingUrl(null);
  } else if (
    inputUrl &&
    shouldAnimateLatestAdd &&
    animatingUrl !== inputUrl &&
    ((isPending && !isMediaPhase1Pending) || isSingleMediaSuccess)
  ) {
    setAnimatingUrl(inputUrl);
  }

  const animatingItemCount =
    animatingUrl === inputUrl && latestAdd?.kind === "media"
      ? latestAdd?.selectedMediaUrls?.length || 1
      : 1;

  const resolvedBookmarks = useMemo(() => {
    const ids = latestAdd?.resultIds ?? [];
    if (!animatingUrl || !ids.length) return [];
    return allBookmarks.filter((b) => ids.includes(b.id)).slice(0, animatingItemCount);
  }, [animatingUrl, latestAdd?.resultIds, allBookmarks, animatingItemCount]);

  const pendingMediaItems =
    animatingUrl === inputUrl && latestAdd?.kind === "media"
      ? (latestAdd.selectedMediaItems ?? latestAdd.resultMediaItems ?? [])
      : [];

  useEffect(() => {
    if (!animatingUrl) return;

    if (latestAdd?.status === "success" && resolvedBookmarks.length === 0) {
      const t = window.setTimeout(() => setAnimatingUrl(null), 5000);
      return () => window.clearTimeout(t);
    }
  }, [animatingUrl, latestAdd?.status, resolvedBookmarks]);

  const submittedAt = latestAdd?.submittedAt;
  const handleTransitionDone = useCallback(() => {
    setAnimatingUrl(null);
    if (submittedAt != null) {
      setHandledAnimationSubmittedAt(submittedAt);
    }
  }, [submittedAt]);

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

  const animatingTags =
    animatingUrl && animatingUrl === inputUrl ? latestAdd?.inputTags : undefined;

  return {
    latestAdd,
    isPending,
    isError,
    inputUrl,
    latestAddAppliesToCurrentFilter,
    removingIds,
    animatedOutIds,
    handleItemRemoved,
    animatingUrl,
    animatingItemCount,
    animatingTags,
    pendingMediaItems,
    resolvedBookmarks,
    handleTransitionDone,
    archiveMutation,
  };
}
