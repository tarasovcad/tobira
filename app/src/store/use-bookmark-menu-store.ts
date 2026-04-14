import {create} from "zustand";
import type {Bookmark} from "@/components/bookmark/types";

interface BookmarkMenuCallbacks {
  onArchive?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
}

interface BookmarkMenuState extends BookmarkMenuCallbacks {
  isOpen: boolean;
  item?: Bookmark;
  openMenu: (item: Bookmark, options?: BookmarkMenuCallbacks) => void;
  closeMenu: () => void;
  setMenuOpen: (isOpen: boolean) => void;
  setItem: (item?: Bookmark) => void;
}

export const useBookmarkMenuStore = create<BookmarkMenuState>((set) => ({
  isOpen: false,
  item: undefined,
  onArchive: undefined,
  onDelete: undefined,
  openMenu: (item, options) =>
    set({
      isOpen: true,
      item,
      onArchive: options?.onArchive,
      onDelete: options?.onDelete,
    }),
  closeMenu: () => set({isOpen: false}),
  setMenuOpen: (isOpen) => set({isOpen}),
  setItem: (item) => set({item}),
}));
