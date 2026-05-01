import {create} from "zustand";

interface DeleteTagDialogState {
  isOpen: boolean;
  tags: {id: string; name: string}[];
  onDeleted?: () => void;
  openDialog: (tags: {id: string; name: string}[], onDeleted?: () => void) => void;
  closeDialog: () => void;
}

export const useDeleteTagDialogStore = create<DeleteTagDialogState>((set) => ({
  isOpen: false,
  tags: [],
  onDeleted: undefined,
  openDialog: (tags, onDeleted) => set({isOpen: true, tags, onDeleted}),
  closeDialog: () => set({isOpen: false}),
}));
