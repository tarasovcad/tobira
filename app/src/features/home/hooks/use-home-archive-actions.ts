"use client";

import {useCallback} from "react";
import type {Bookmark} from "@/components/bookmark/types";
import {toastManager} from "@/components/ui/coss/toast";

interface UseHomeArchiveActionsProps {
  selectedIds: Set<string>;
  archive: (ids: string | string[]) => void;
  onArchiveSingleDone: () => void;
  onArchiveSelectedDone: () => void;
}

export function useHomeArchiveActions({
  selectedIds,
  archive,
  onArchiveSingleDone,
  onArchiveSelectedDone,
}: UseHomeArchiveActionsProps) {
  const handleArchive = useCallback(
    (item: Bookmark) => {
      archive(item.id);
      onArchiveSingleDone();
      toastManager.add({
        title: "Bookmark archived",
        type: "success",
      });
    },
    [archive, onArchiveSingleDone],
  );

  const handleArchiveSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    archive(ids);
    toastManager.add({
      title: ids.length === 1 ? "Bookmark archived" : `${ids.length} bookmarks archived`,
      type: "success",
    });
    onArchiveSelectedDone();
  }, [archive, onArchiveSelectedDone, selectedIds]);

  return {
    handleArchive,
    handleArchiveSelected,
  };
}
