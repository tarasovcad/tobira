import {create} from "zustand";

interface AddItemDialogState {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  setDialogOpen: (isOpen: boolean) => void;
}

export const useAddItemDialogStore = create<AddItemDialogState>((set) => ({
  isOpen: false,
  openDialog: () => set({isOpen: true}),
  closeDialog: () => set({isOpen: false}),
  setDialogOpen: (isOpen) => set({isOpen}),
}));
