"use client";

import {useState} from "react";
import type {Bookmark} from "@/components/bookmark/types";
import {useDeleteBookmarkDialogStore} from "@/store/use-delete-bookmark-dialog-store";

interface UseHomeDialogsProps {
  allBookmarks: Bookmark[];
  selectedIds: Set<string>;
  onDeleted?: () => void;
}

export function useHomeDialogs({allBookmarks, selectedIds, onDeleted}: UseHomeDialogsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItemId, setMenuItemId] = useState<string | undefined>(undefined);
  const openDeleteBookmarkDialog = useDeleteBookmarkDialogStore((state) => state.openDialog);

  const menuItem = menuItemId
    ? allBookmarks.find((bookmark) => bookmark.id === menuItemId)
    : undefined;

  const openMenu = (item: Bookmark) => {
    setMenuItemId(item.id);
    setMenuOpen(true);
  };

  const openDeleteDialog = (item: Bookmark) => {
    openDeleteBookmarkDialog([item], () => {
      setMenuOpen(false);
      onDeleted?.();
    });
  };

  const handleDeleteSelected = () => {
    const selectedBookmarks = allBookmarks.filter((item) => selectedIds.has(item.id));
    if (selectedBookmarks.length === 0) return;

    openDeleteBookmarkDialog(selectedBookmarks, () => {
      setMenuOpen(false);
      onDeleted?.();
    });
  };

  return {
    menuOpen,
    setMenuOpen,
    menuItem,
    openMenu,
    openDeleteDialog,
    handleDeleteSelected,
  };
}
