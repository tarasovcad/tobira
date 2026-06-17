import {create} from "zustand";

export type SidebarMode = "main" | "settings";

interface SidebarState {
  isOpen: boolean;
  requestedMode: SidebarMode | null;
  setOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  requestMode: (mode: SidebarMode) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  requestedMode: null,
  setOpen: (isOpen) => set({isOpen}),
  toggleSidebar: () => set((state) => ({isOpen: !state.isOpen})),
  requestMode: (mode) => set({requestedMode: mode}),
}));
