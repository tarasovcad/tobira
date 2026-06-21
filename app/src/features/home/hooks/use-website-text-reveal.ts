import {useEffect, useMemo, useRef, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import type {Bookmark} from "@/components/bookmark/types";
import {toastManager} from "@/components/ui/coss/toast";
import type {TypeFilter} from "@/features/home/types";

const REVEAL_TIMEOUT_MS = 20_000;
const POLL_MS = 1_500;

type LatestAdd =
  | {
      kind?: TypeFilter;
      status: string;
      submittedAt: number;
    }
  | undefined;

function getToastForStatus(textStatus: string | undefined, timedOut: boolean) {
  if (textStatus === "completed") return {title: "Bookmark added", type: "success" as const};
  if (textStatus === "failed") {
    return {
      title: "Bookmark saved",
      description: "Website details could not be fetched.",
      type: "info" as const,
    };
  }
  if (timedOut) {
    return {
      title: "Bookmark saved",
      description: "Website details are still processing.",
      type: "info" as const,
    };
  }
  return null;
}

export function useWebsiteTextReveal({
  latestAdd,
  appliesToCurrentFilter,
  resolvedBookmarks,
}: {
  latestAdd: LatestAdd;
  appliesToCurrentFilter: boolean;
  resolvedBookmarks: Bookmark[];
}) {
  const queryClient = useQueryClient();
  const [timedOutSubmittedAt, setTimedOutSubmittedAt] = useState<number | null>(null);
  const toastSubmittedAtRef = useRef<number | null>(null);

  const submittedAt = latestAdd?.submittedAt ?? null;
  const isWebsiteSuccess = latestAdd?.kind === "website" && latestAdd.status === "success";
  const website = isWebsiteSuccess
    ? resolvedBookmarks.find((bookmark) => bookmark.kind === "website")
    : undefined;
  const textStatus = website?.metadata?.textMetadataStatus;
  const timedOut = isWebsiteSuccess && submittedAt === timedOutSubmittedAt;
  const isWaiting =
    isWebsiteSuccess &&
    appliesToCurrentFilter &&
    !timedOut &&
    (resolvedBookmarks.length === 0 || textStatus === "processing");

  const pendingRevealIds = useMemo(() => {
    if (!isWaiting) return new Set<string>();
    return new Set(resolvedBookmarks.map((bookmark) => bookmark.id));
  }, [isWaiting, resolvedBookmarks]);

  useEffect(() => {
    if (!isWaiting || submittedAt == null) return;

    const timeout = window.setTimeout(() => {
      setTimedOutSubmittedAt(submittedAt);
    }, REVEAL_TIMEOUT_MS);
    const interval = window.setInterval(() => {
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
    }, POLL_MS);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [isWaiting, queryClient, submittedAt]);

  useEffect(() => {
    if (submittedAt == null || toastSubmittedAtRef.current === submittedAt) return;

    const toast = isWebsiteSuccess ? getToastForStatus(textStatus, timedOut) : null;
    if (!toast) return;

    toastManager.add(toast);
    toastSubmittedAtRef.current = submittedAt;
  }, [isWebsiteSuccess, submittedAt, textStatus, timedOut]);

  return {isWaiting, pendingRevealIds};
}
