import {create} from "zustand";

export type ViewMode = "list" | "grid" | "table" | "compact";
export type GridGap = "none" | "xs" | "sm" | "md" | "lg";
export type BorderRadius = "none" | "sm" | "md" | "lg";
export type BookmarkWidth = "full" | "lg" | "md" | "sm" | "xs";
export const COLUMN_SIZES = [1, 2, 3, 4, 5, 6] as const;
export type ColumnSize = (typeof COLUMN_SIZES)[number];
export type ContentField = "description" | "tags" | "source" | "savedDate" | "avatar";

export interface ViewOptionsState {
  // Layout
  view: ViewMode;
  setView: (view: ViewMode) => void;

  // Appearance
  gridGap: GridGap;
  columnSize: ColumnSize;
  borderRadius: BorderRadius;
  bookmarkWidth: BookmarkWidth;
  setGridGap: (gap: GridGap) => void;
  setColumnSize: (size: ColumnSize) => void;
  setBorderRadius: (radius: BorderRadius) => void;
  setBookmarkWidth: (width: BookmarkWidth) => void;

  // Content
  contentToggles: Record<ContentField, boolean>;
  setContentToggle: (field: ContentField, value: boolean) => void;
  setContentToggles: (toggles: Record<ContentField, boolean>) => void;

  // Reset
  resetViewOptions: (view?: ViewMode) => void;
}

const DEFAULT_OPTIONS = {
  gridGap: "md" as GridGap,
  columnSize: 3 as ColumnSize,
  borderRadius: "md" as BorderRadius,
  bookmarkWidth: "full" as BookmarkWidth,
  contentToggles: {
    description: true,
    tags: true,
    source: true,
    savedDate: true,
    favorites: true,
    avatar: true,
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
  bookmarkWidth: "full",
  setGridGap: (gridGap) => set({gridGap}),
  setColumnSize: (columnSize) => set({columnSize}),
  setBorderRadius: (borderRadius) => set({borderRadius}),
  setBookmarkWidth: (bookmarkWidth) => set({bookmarkWidth}),

  // Content
  contentToggles: {
    description: true,
    tags: true,
    source: true,
    savedDate: true,
    avatar: true,
  },
  setContentToggle: (field, value) =>
    set((state) => ({
      contentToggles: {
        ...state.contentToggles,
        [field]: value,
      },
    })),
  setContentToggles: (contentToggles) => set({contentToggles}),
  resetViewOptions: (view) =>
    set({
      ...DEFAULT_OPTIONS,
      view: view ?? "list",
    }),
}));
