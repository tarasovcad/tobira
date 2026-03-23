"use client";

import type {Bookmark} from "@/components/bookmark/types";
import {toastManager} from "@/components/coss-ui/toast";

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
  const handleArchive = (item: Bookmark) => {
    archive(item.id);
    onArchiveSingleDone();
    toastManager.add({
      title: "Bookmark archived",
      type: "success",
    });
  };

  const handleArchiveSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    archive(ids);
    toastManager.add({
      title: ids.length === 1 ? "Bookmark archived" : `${ids.length} bookmarks archived`,
      type: "success",
    });
    onArchiveSelectedDone();
  };

  return {
    handleArchive,
    handleArchiveSelected,
  };
}
