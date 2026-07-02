import {create} from "zustand";

export type ViewMode = "list" | "grid" | "table" | "compact";
export type GridGap = "none" | "xs" | "sm" | "md" | "lg";
export type BorderRadius = "none" | "sm" | "md" | "lg";
export type BookmarkWidth = "full" | "lg" | "md" | "sm" | "xs";
export const COLUMN_SIZES = [1, 2, 3, 4, 5, 6] as const;
export type ColumnSize = (typeof COLUMN_SIZES)[number];
export type ContentField = "description" | "tags" | "source" | "savedDate" | "avatar";
export type PostContentField = "media" | "quotedPost" | "timestamp" | "author" | "tags";
export type KindFilter = "website" | "media" | "post";
export type CompactPreviewSize = "sm" | "md" | "lg";
export type CompactPreviewDelay = "instant" | "short" | "long";
export type CompactPreviewPosition = "left" | "right" | "auto";

export type CompactInteractions = {
  hoverPreview: boolean;
  previewSize: CompactPreviewSize;
  previewDelay: CompactPreviewDelay;
  previewPosition: CompactPreviewPosition;
};

export const COMPACT_PREVIEW_DELAY_MS = {
  instant: 0,
  short: 150,
  long: 300,
} as const satisfies Record<CompactPreviewDelay, number>;

export function getCompactPreviewWidthClass(size: CompactPreviewSize) {
  switch (size) {
    case "sm":
      return "w-32";
    case "md":
      return "w-44";
    case "lg":
      return "w-56";
  }
}

export function getCompactPreviewWidthPx(size: CompactPreviewSize) {
  switch (size) {
    case "sm":
      return 128;
    case "md":
      return 176;
    case "lg":
      return 224;
  }
}

export const DEFAULT_COMPACT_INTERACTIONS: CompactInteractions = {
  hoverPreview: true,
  previewSize: "md",
  previewDelay: "short",
  previewPosition: "auto",
};

export interface ViewOptionsState {
  // Layout
  view: ViewMode;
  setView: (view: ViewMode) => void;

  // Appearance
  gridGap: GridGap;
  columnSize: ColumnSize;
  borderRadius: BorderRadius;
  bookmarkWidthByType: Record<KindFilter, BookmarkWidth>;
  setBookmarkWidthForType: (type: KindFilter, width: BookmarkWidth) => void;
  setGridGap: (gap: GridGap) => void;
  setColumnSize: (size: ColumnSize) => void;
  setBorderRadius: (radius: BorderRadius) => void;

  // Content (websites / media)
  contentToggles: Record<ContentField, boolean>;
  setContentToggle: (field: ContentField, value: boolean) => void;
  setContentToggles: (toggles: Record<ContentField, boolean>) => void;

  // Content (posts)
  postContentToggles: Record<PostContentField, boolean>;
  setPostContentToggle: (field: PostContentField, value: boolean) => void;

  // Interactions (compact view)
  compactInteractions: CompactInteractions;
  setCompactInteraction: <K extends keyof CompactInteractions>(
    key: K,
    value: CompactInteractions[K],
  ) => void;
  setCompactInteractions: (interactions: CompactInteractions) => void;

  // Reset
  resetViewOptions: (view?: ViewMode) => void;
}

const DEFAULT_BOOKMARK_WIDTHS_BY_TYPE: Record<KindFilter, BookmarkWidth> = {
  website: "full",
  media: "full",
  post: "sm",
};

const DEFAULT_POST_CONTENT_TOGGLES: Record<PostContentField, boolean> = {
  author: true,
  media: true,
  quotedPost: true,
  tags: false,
  timestamp: true,
};

const DEFAULT_OPTIONS = {
  gridGap: "md" as GridGap,
  columnSize: 3 as ColumnSize,
  borderRadius: "md" as BorderRadius,
  bookmarkWidthByType: DEFAULT_BOOKMARK_WIDTHS_BY_TYPE,
  contentToggles: {
    description: true,
    tags: false,
    source: true,
    savedDate: true,
    favorites: true,
    avatar: true,
  },
  postContentToggles: DEFAULT_POST_CONTENT_TOGGLES,
  compactInteractions: DEFAULT_COMPACT_INTERACTIONS,
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
  bookmarkWidthByType: DEFAULT_BOOKMARK_WIDTHS_BY_TYPE,
  setBookmarkWidthForType: (type, width) =>
    set((state) => ({
      bookmarkWidthByType: {
        ...state.bookmarkWidthByType,
        [type]: width,
      },
    })),
  setGridGap: (gridGap) => set({gridGap}),
  setColumnSize: (columnSize) => set({columnSize}),
  setBorderRadius: (borderRadius) => set({borderRadius}),

  // Content (websites / media)
  contentToggles: {
    description: true,
    tags: false,
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

  // Content (posts)
  postContentToggles: DEFAULT_POST_CONTENT_TOGGLES,
  setPostContentToggle: (field, value) =>
    set((state) => ({
      postContentToggles: {
        ...state.postContentToggles,
        [field]: value,
      },
    })),

  // Interactions (compact view)
  compactInteractions: DEFAULT_COMPACT_INTERACTIONS,
  setCompactInteraction: (key, value) =>
    set((state) => ({
      compactInteractions: {
        ...state.compactInteractions,
        [key]: value,
      },
    })),
  setCompactInteractions: (compactInteractions) => set({compactInteractions}),

  resetViewOptions: (view) =>
    set({
      ...DEFAULT_OPTIONS,
      view: view ?? "list",
    }),
}));
