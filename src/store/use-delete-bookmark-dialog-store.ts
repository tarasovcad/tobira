import {create} from "zustand";
import type {Bookmark} from "@/components/bookmark/types";

interface DeleteBookmarkDialogState {
  isOpen: boolean;
  items: Bookmark[];
  onDeleted?: () => void;
  openDialog: (items: Bookmark[], onDeleted?: () => void) => void;
  closeDialog: () => void;
}

export const useDeleteBookmarkDialogStore = create<DeleteBookmarkDialogState>((set) => ({
  isOpen: false,
  items: [],
  onDeleted: undefined,
  openDialog: (items, onDeleted) => set({isOpen: true, items, onDeleted}),
  closeDialog: () => set({isOpen: false}),
}));
