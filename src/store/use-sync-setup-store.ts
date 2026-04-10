import {create} from "zustand";

interface Provider {
  name: string;
  image: string;
  description: string;
  types: string[];
  color: string;
}

interface SyncSetupStore {
  isOpen: boolean;
  provider: Provider | null;
  open: (provider: Provider) => void;
  close: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useSyncSetupStore = create<SyncSetupStore>((set) => ({
  isOpen: false,
  provider: null,
  open: (provider) => set({isOpen: true, provider}),
  close: () => set({isOpen: false}),
  setIsOpen: (isOpen) => set({isOpen}),
}));
