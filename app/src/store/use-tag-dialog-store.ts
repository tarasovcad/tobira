import {create} from "zustand";
import type {TagWithCount} from "@/features/home/types";

interface TagDialogState {
  isOpen: boolean;
  tag: TagWithCount | null;
  openDialog: (tag: TagWithCount) => void;
  closeDialog: () => void;
}

export const useTagDialogStore = create<TagDialogState>((set) => ({
  isOpen: false,
  tag: null,
  openDialog: (tag) => set({isOpen: true, tag}),
  closeDialog: () => set({isOpen: false}),
}));
