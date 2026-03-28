import {create} from "zustand";
import type {Collection} from "@/app/actions/collections";

interface CollectionDialogState {
  isOpen: boolean;
  collection: Collection | null;
  openDialog: (collection?: Collection | null) => void;
  closeDialog: () => void;
}

export const useCollectionDialogStore = create<CollectionDialogState>((set) => ({
  isOpen: false,
  collection: null,
  openDialog: (collection = null) => set({isOpen: true, collection}),
  closeDialog: () => set({isOpen: false}),
}));
