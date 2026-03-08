import {create} from "zustand";

export type GapSize = "none" | "small" | "medium" | "large";
export type ColumnSize = "s" | "m" | "l" | "xl";
export type BorderRadius = "sharp" | "rounded" | "pill";

interface MediaLayoutState {
  gapSize: GapSize;
  columnSize: ColumnSize;
  borderRadius: BorderRadius;
  setGapSize: (size: GapSize) => void;
  setColumnSize: (size: ColumnSize) => void;
  setBorderRadius: (radius: BorderRadius) => void;
}

export const useMediaLayoutStore = create<MediaLayoutState>((set) => ({
  gapSize: "medium",
  columnSize: "m",
  borderRadius: "rounded",
  setGapSize: (size) => set({gapSize: size}),
  setColumnSize: (size) => set({columnSize: size}),
  setBorderRadius: (radius) => set({borderRadius: radius}),
}));
