"use client";

import {useCallback} from "react";
import type {Bookmark} from "@/components/bookmark/types";
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";
import {useDeleteBookmarkDialogStore} from "@/store/use-delete-bookmark-dialog-store";

interface UseHomeDialogsProps {
  allBookmarks: Bookmark[];
  selectedIds: Set<string>;
  onDeleted?: () => void;
}

export function useHomeDialogs({allBookmarks, selectedIds, onDeleted}: UseHomeDialogsProps) {
  const openDeleteBookmarkDialog = useDeleteBookmarkDialogStore((state) => state.openDialog);
  const closeMenu = useBookmarkMenuStore((state) => state.closeMenu);

  const openDeleteDialog = useCallback(
    (item: Bookmark) => {
      openDeleteBookmarkDialog([item], () => {
        closeMenu();
        onDeleted?.();
      });
    },
    [closeMenu, onDeleted, openDeleteBookmarkDialog],
  );

  const handleDeleteSelected = useCallback(() => {
    const selectedBookmarks = allBookmarks.filter((item) => selectedIds.has(item.id));
    if (selectedBookmarks.length === 0) return;

    openDeleteBookmarkDialog(selectedBookmarks, () => {
      closeMenu();
      onDeleted?.();
    });
  }, [allBookmarks, closeMenu, onDeleted, openDeleteBookmarkDialog, selectedIds]);

  return {
    openDeleteDialog,
    handleDeleteSelected,
  };
}
