import {create} from "zustand";

export type ViewMode = "list" | "grid" | "table" | "compact";
export type GridGap = "none" | "xs" | "sm" | "md" | "lg";
export type BorderRadius = "none" | "sm" | "md" | "lg";
export type ContentField = "description" | "tags" | "source" | "savedDate";

export interface ViewOptionsState {
  // Layout
  view: ViewMode;
  setView: (view: ViewMode) => void;

  // Appearance
  gridGap: GridGap;
  columnSize: number;
  borderRadius: BorderRadius;
  setGridGap: (gap: GridGap) => void;
  setColumnSize: (size: number) => void;
  setBorderRadius: (radius: BorderRadius) => void;

  // Content
  contentToggles: Record<ContentField, boolean>;
  setContentToggle: (field: ContentField, value: boolean) => void;
  setContentToggles: (toggles: Record<ContentField, boolean>) => void;

  // Reset
  resetViewOptions: (typeFilter?: "media" | "website") => void;
}

const DEFAULT_OPTIONS = {
  gridGap: "md" as GridGap,
  columnSize: 3,
  borderRadius: "md" as BorderRadius,
  contentToggles: {
    description: true,
    tags: true,
    source: true,
    savedDate: true,
    favorites: true,
  },
};

export const useViewOptionsStore = create<ViewOptionsState>((set) => ({
  // Layout
  ...DEFAULT_OPTIONS,
  view: "list",
  setView: (view) => set({view}),

  // Appearance
  gridGap: "md",
  columnSize: 3,
  borderRadius: "md",
  setGridGap: (gridGap) => set({gridGap}),
  setColumnSize: (columnSize) => set({columnSize}),
  setBorderRadius: (borderRadius) => set({borderRadius}),

  // Content
  contentToggles: {
    description: true,
    tags: true,
    source: true,
    savedDate: true,
  },
  setContentToggle: (field, value) =>
    set((state) => ({
      contentToggles: {
        ...state.contentToggles,
        [field]: value,
      },
    })),
  setContentToggles: (contentToggles) => set({contentToggles}),
  resetViewOptions: (typeFilter) =>
    set({
      ...DEFAULT_OPTIONS,
      view: typeFilter === "media" ? "grid" : "list",
    }),
}));
