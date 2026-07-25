import {create} from "zustand";

interface BulkBookmarkState {
  pendingCount: number;
  createdIds: readonly string[];
  setPendingCount: (count: number) => void;
  setCreatedIds: (ids: string[]) => void;
  /** Atomically clears both pendingCount and createdIds in one render. */
  reset: () => void;
}

export const useBulkBookmarkState = create<BulkBookmarkState>((set) => ({
  pendingCount: 0,
  createdIds: [],
  setPendingCount: (count) => set({pendingCount: count}),
  setCreatedIds: (ids) => set({createdIds: ids}),
  reset: () => set({pendingCount: 0, createdIds: []}),
}));
