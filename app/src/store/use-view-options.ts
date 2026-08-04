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
export type CompactPreviewPosition = "left" | "right" | "auto";

export type CompactInteractions = {
  hoverPreview: boolean;
  previewSize: CompactPreviewSize;
  previewAnimation: boolean;
  previewPosition: CompactPreviewPosition;
};

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
  previewAnimation: true,
  previewPosition: "auto",
};

export interface ViewLayoutOptions {
  gridGap: GridGap;
  columnSize: ColumnSize;
  borderRadius: BorderRadius;
  bookmarkWidthByType: Record<KindFilter, BookmarkWidth>;
  contentToggles: Record<ContentField, boolean>;
  postContentToggles: Record<PostContentField, boolean>;
  compactInteractions: CompactInteractions;
}

export interface ViewOptionsState extends ViewLayoutOptions {
  // Layout
  view: ViewMode;
  viewOptionsByLayout: Record<ViewMode, ViewLayoutOptions>;
  setView: (view: ViewMode) => void;

  // Appearance
  setBookmarkWidthForType: (type: KindFilter, width: BookmarkWidth) => void;
  setGridGap: (gap: GridGap) => void;
  setColumnSize: (size: ColumnSize) => void;
  setBorderRadius: (radius: BorderRadius) => void;

  // Content (websites / media)
  setContentToggle: (field: ContentField, value: boolean) => void;
  setContentToggles: (toggles: Record<ContentField, boolean>) => void;

  // Content (posts)
  setPostContentToggle: (field: PostContentField, value: boolean) => void;

  // Interactions (compact view)
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

const DEFAULT_CONTENT_TOGGLES: Record<ContentField, boolean> = {
  description: true,
  tags: false,
  source: true,
  savedDate: true,
  avatar: true,
};

const DEFAULT_POST_CONTENT_TOGGLES: Record<PostContentField, boolean> = {
  author: true,
  media: true,
  quotedPost: true,
  tags: false,
  timestamp: true,
};

const BASE_LAYOUT_OPTIONS: ViewLayoutOptions = {
  gridGap: "md",
  columnSize: 3,
  borderRadius: "md",
  bookmarkWidthByType: {...DEFAULT_BOOKMARK_WIDTHS_BY_TYPE},
  contentToggles: {...DEFAULT_CONTENT_TOGGLES},
  postContentToggles: {...DEFAULT_POST_CONTENT_TOGGLES},
  compactInteractions: {...DEFAULT_COMPACT_INTERACTIONS},
};

const DEFAULT_LAYOUT_OPTIONS: Record<ViewMode, ViewLayoutOptions> = {
  list: BASE_LAYOUT_OPTIONS,
  grid: {
    ...BASE_LAYOUT_OPTIONS,
    columnSize: 4,
    contentToggles: {
      ...DEFAULT_CONTENT_TOGGLES,
      description: false,
    },
  },
  compact: {
    ...BASE_LAYOUT_OPTIONS,
    gridGap: "none",
    borderRadius: "none",
    bookmarkWidthByType: {
      ...DEFAULT_BOOKMARK_WIDTHS_BY_TYPE,
      website: "sm",
    },
    contentToggles: {
      ...DEFAULT_CONTENT_TOGGLES,
      description: false,
      savedDate: false,
    },
  },
  table: {
    ...BASE_LAYOUT_OPTIONS,
    gridGap: "none",
    columnSize: 1,
    borderRadius: "none",
    contentToggles: {
      ...DEFAULT_CONTENT_TOGGLES,
      description: false,
    },
  },
};

function cloneLayoutOptions(options: ViewLayoutOptions): ViewLayoutOptions {
  return {
    ...options,
    bookmarkWidthByType: {...options.bookmarkWidthByType},
    contentToggles: {...options.contentToggles},
    postContentToggles: {...options.postContentToggles},
    compactInteractions: {...options.compactInteractions},
  };
}

function getLayoutOptions(optionsByLayout: Record<ViewMode, ViewLayoutOptions>, view: ViewMode) {
  switch (view) {
    case "list":
      return optionsByLayout.list;
    case "grid":
      return optionsByLayout.grid;
    case "compact":
      return optionsByLayout.compact;
    case "table":
      return optionsByLayout.table;
  }
}

function areLayoutOptionsEqual(left: ViewLayoutOptions, right: ViewLayoutOptions) {
  return (
    left.gridGap === right.gridGap &&
    left.columnSize === right.columnSize &&
    left.borderRadius === right.borderRadius &&
    left.bookmarkWidthByType.website === right.bookmarkWidthByType.website &&
    left.bookmarkWidthByType.media === right.bookmarkWidthByType.media &&
    left.bookmarkWidthByType.post === right.bookmarkWidthByType.post &&
    left.contentToggles.description === right.contentToggles.description &&
    left.contentToggles.tags === right.contentToggles.tags &&
    left.contentToggles.source === right.contentToggles.source &&
    left.contentToggles.savedDate === right.contentToggles.savedDate &&
    left.contentToggles.avatar === right.contentToggles.avatar &&
    left.postContentToggles.author === right.postContentToggles.author &&
    left.postContentToggles.media === right.postContentToggles.media &&
    left.postContentToggles.quotedPost === right.postContentToggles.quotedPost &&
    left.postContentToggles.timestamp === right.postContentToggles.timestamp &&
    left.postContentToggles.tags === right.postContentToggles.tags &&
    left.compactInteractions.hoverPreview === right.compactInteractions.hoverPreview &&
    left.compactInteractions.previewSize === right.compactInteractions.previewSize &&
    left.compactInteractions.previewAnimation === right.compactInteractions.previewAnimation &&
    left.compactInteractions.previewPosition === right.compactInteractions.previewPosition
  );
}

function getDefaultLayoutOptions(view: ViewMode) {
  return cloneLayoutOptions(getLayoutOptions(DEFAULT_LAYOUT_OPTIONS, view));
}

export function hasLayoutOptionsChanges(
  optionsByLayout: Record<ViewMode, ViewLayoutOptions>,
  view: ViewMode,
) {
  return !areLayoutOptionsEqual(
    getLayoutOptions(optionsByLayout, view),
    getDefaultLayoutOptions(view),
  );
}

function createDefaultLayoutOptions() {
  return {
    list: getDefaultLayoutOptions("list"),
    grid: getDefaultLayoutOptions("grid"),
    compact: getDefaultLayoutOptions("compact"),
    table: getDefaultLayoutOptions("table"),
  } satisfies Record<ViewMode, ViewLayoutOptions>;
}

function updateActiveLayoutOptions(state: ViewOptionsState, updates: Partial<ViewLayoutOptions>) {
  const nextLayoutOptions = {
    ...getLayoutOptions(state.viewOptionsByLayout, state.view),
    ...updates,
  };

  return {
    ...nextLayoutOptions,
    viewOptionsByLayout: {
      ...state.viewOptionsByLayout,
      [state.view]: nextLayoutOptions,
    },
  };
}

export const useViewOptionsStore = create<ViewOptionsState>((set) => {
  const viewOptionsByLayout = createDefaultLayoutOptions();

  return {
    // Layout
    ...viewOptionsByLayout.list,
    view: "list",
    viewOptionsByLayout,
    setView: (view) =>
      set((state) => ({
        view,
        ...getLayoutOptions(state.viewOptionsByLayout, view),
      })),

    // Appearance
    setBookmarkWidthForType: (type, width) =>
      set((state) =>
        updateActiveLayoutOptions(state, {
          bookmarkWidthByType: {
            ...getLayoutOptions(state.viewOptionsByLayout, state.view).bookmarkWidthByType,
            [type]: width,
          },
        }),
      ),
    setGridGap: (gridGap) => set((state) => updateActiveLayoutOptions(state, {gridGap})),
    setColumnSize: (columnSize) => set((state) => updateActiveLayoutOptions(state, {columnSize})),
    setBorderRadius: (borderRadius) =>
      set((state) => updateActiveLayoutOptions(state, {borderRadius})),

    // Content (websites / media)
    setContentToggle: (field, value) =>
      set((state) =>
        updateActiveLayoutOptions(state, {
          contentToggles: {
            ...getLayoutOptions(state.viewOptionsByLayout, state.view).contentToggles,
            [field]: value,
          },
        }),
      ),
    setContentToggles: (contentToggles) =>
      set((state) => updateActiveLayoutOptions(state, {contentToggles})),

    // Content (posts)
    setPostContentToggle: (field, value) =>
      set((state) =>
        updateActiveLayoutOptions(state, {
          postContentToggles: {
            ...getLayoutOptions(state.viewOptionsByLayout, state.view).postContentToggles,
            [field]: value,
          },
        }),
      ),

    // Interactions (compact view)
    setCompactInteraction: (key, value) =>
      set((state) =>
        updateActiveLayoutOptions(state, {
          compactInteractions: {
            ...getLayoutOptions(state.viewOptionsByLayout, state.view).compactInteractions,
            [key]: value,
          },
        }),
      ),
    setCompactInteractions: (compactInteractions) =>
      set((state) => updateActiveLayoutOptions(state, {compactInteractions})),

    // Reset
    resetViewOptions: (view) =>
      set((state) => {
        const nextView = view ?? "list";
        const nextViewOptions = getDefaultLayoutOptions(nextView);
        const nextViewOptionsByLayout = view
          ? {
              ...state.viewOptionsByLayout,
              [nextView]: nextViewOptions,
            }
          : createDefaultLayoutOptions();

        return {
          ...nextViewOptions,
          view: nextView,
          viewOptionsByLayout: nextViewOptionsByLayout,
        };
      }),
  };
});
