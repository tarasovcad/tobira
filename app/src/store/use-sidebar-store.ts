import {create} from "zustand";

interface SidebarState {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  setOpen: (isOpen) => set({isOpen}),
  toggleSidebar: () => set((state) => ({isOpen: !state.isOpen})),
}));
