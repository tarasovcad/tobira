import {create} from "zustand";

interface DeleteCollectionDialogState {
  isOpen: boolean;
  collections: {id: string; name: string}[];
  onDeleted?: () => void;
  openDialog: (collections: {id: string; name: string}[], onDeleted?: () => void) => void;
  closeDialog: () => void;
}

export const useDeleteCollectionDialogStore = create<DeleteCollectionDialogState>((set) => ({
  isOpen: false,
  collections: [],
  onDeleted: undefined,
  openDialog: (collections, onDeleted) => set({isOpen: true, collections, onDeleted}),
  closeDialog: () => set({isOpen: false}),
}));
