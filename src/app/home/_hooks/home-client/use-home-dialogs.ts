"use client";

import {useState} from "react";
import type {Bookmark} from "@/components/bookmark/types";

interface UseHomeDialogsProps {
  allBookmarks: Bookmark[];
  selectedIds: Set<string>;
}

export function useHomeDialogs({allBookmarks, selectedIds}: UseHomeDialogsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItemId, setMenuItemId] = useState<string | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<Bookmark[]>([]);

  const menuItem = menuItemId
    ? allBookmarks.find((bookmark) => bookmark.id === menuItemId)
    : undefined;

  const openMenu = (item: Bookmark) => {
    setMenuItemId(item.id);
    setMenuOpen(true);
  };

  const openDeleteDialog = (item: Bookmark) => {
    setItemsToDelete([item]);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSelected = () => {
    const selectedBookmarks = allBookmarks.filter((item) => selectedIds.has(item.id));
    if (selectedBookmarks.length === 0) return;

    setItemsToDelete(selectedBookmarks);
    setDeleteDialogOpen(true);
  };

  return {
    menuOpen,
    setMenuOpen,
    menuItem,
    deleteDialogOpen,
    setDeleteDialogOpen,
    itemsToDelete,
    openMenu,
    openDeleteDialog,
    handleDeleteSelected,
  };
}
