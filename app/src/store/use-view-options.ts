"use client";

import {createContext, useContext} from "react";
import {useStore} from "zustand";
import {createStore, type StoreApi} from "zustand/vanilla";
import type {ViewOptionsCookie} from "@/lib/view-options-cookie";

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
  showTitle: boolean;
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
  setBookmarkWidthForType: (layout: ViewMode, type: KindFilter, width: BookmarkWidth) => void;
  setGridGap: (layout: ViewMode, gap: GridGap) => void;
  setColumnSize: (layout: ViewMode, size: ColumnSize) => void;
  setBorderRadius: (layout: ViewMode, radius: BorderRadius) => void;

  // Content (websites / media)
  setShowTitle: (layout: ViewMode, value: boolean) => void;
  setContentToggle: (layout: ViewMode, field: ContentField, value: boolean) => void;
  setContentToggles: (layout: ViewMode, toggles: Record<ContentField, boolean>) => void;

  // Content (posts)
  setPostContentToggle: (layout: ViewMode, field: PostContentField, value: boolean) => void;

  // Interactions (compact view)
  setCompactInteraction: <K extends keyof CompactInteractions>(
    layout: ViewMode,
    key: K,
    value: CompactInteractions[K],
  ) => void;
  setCompactInteractions: (layout: ViewMode, interactions: CompactInteractions) => void;

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
  showTitle: true,
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

export function cloneLayoutOptions(options: ViewLayoutOptions): ViewLayoutOptions {
  return {
    ...options,
    bookmarkWidthByType: {...options.bookmarkWidthByType},
    contentToggles: {...options.contentToggles},
    postContentToggles: {...options.postContentToggles},
    compactInteractions: {...options.compactInteractions},
  };
}

export function getLayoutOptions(
  optionsByLayout: Record<ViewMode, ViewLayoutOptions>,
  view: ViewMode,
) {
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

function getDefaultLayoutOptions(view: ViewMode) {
  return cloneLayoutOptions(getLayoutOptions(DEFAULT_LAYOUT_OPTIONS, view));
}

function areLayoutOptionsEqual(left: ViewLayoutOptions, right: ViewLayoutOptions) {
  return (
    left.gridGap === right.gridGap &&
    left.columnSize === right.columnSize &&
    left.borderRadius === right.borderRadius &&
    left.bookmarkWidthByType.website === right.bookmarkWidthByType.website &&
    left.bookmarkWidthByType.media === right.bookmarkWidthByType.media &&
    left.bookmarkWidthByType.post === right.bookmarkWidthByType.post &&
    left.showTitle === right.showTitle &&
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

export function hasLayoutOptionsChanges(
  optionsByLayout: Record<ViewMode, ViewLayoutOptions>,
  view: ViewMode,
) {
  return !areLayoutOptionsEqual(
    getLayoutOptions(optionsByLayout, view),
    getDefaultLayoutOptions(view),
  );
}

export function createDefaultLayoutOptions() {
  return {
    list: getDefaultLayoutOptions("list"),
    grid: getDefaultLayoutOptions("grid"),
    compact: getDefaultLayoutOptions("compact"),
    table: getDefaultLayoutOptions("table"),
  } satisfies Record<ViewMode, ViewLayoutOptions>;
}

function areLayoutOptionValuesEqual(left: unknown, right: unknown) {
  if (Object.is(left, right)) {
    return true;
  }

  if (
    typeof left !== "object" ||
    left === null ||
    typeof right !== "object" ||
    right === null ||
    Array.isArray(left) ||
    Array.isArray(right)
  ) {
    return false;
  }

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftEntries = Object.entries(leftRecord);
  const rightEntries = Object.entries(rightRecord);

  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(([leftKey, leftValue]) =>
      rightEntries.some(
        ([rightKey, rightValue]) => rightKey === leftKey && Object.is(rightValue, leftValue),
      ),
    )
  );
}

function updateLayoutOptions(
  state: ViewOptionsState,
  layout: ViewMode,
  updates: Partial<ViewLayoutOptions>,
) {
  const currentLayoutOptions = getLayoutOptions(state.viewOptionsByLayout, layout);
  const currentEntries = Object.entries(currentLayoutOptions);
  const hasChanges = Object.entries(updates).some(([key, nextValue]) => {
    const currentEntry = currentEntries.find(([currentKey]) => currentKey === key);
    return currentEntry === undefined || !areLayoutOptionValuesEqual(currentEntry[1], nextValue);
  });

  if (!hasChanges) {
    return state;
  }

  const nextLayoutOptions = {
    ...currentLayoutOptions,
    ...updates,
  };

  return {
    ...(layout === state.view ? nextLayoutOptions : {}),
    viewOptionsByLayout: {
      ...state.viewOptionsByLayout,
      [layout]: nextLayoutOptions,
    },
  };
}

export function createViewOptionsStore(initialCookie?: ViewOptionsCookie) {
  const view = initialCookie?.view ?? "list";
  const viewOptionsByLayout = initialCookie
    ? {
        list: cloneLayoutOptions(initialCookie.layouts.list),
        grid: cloneLayoutOptions(initialCookie.layouts.grid),
        compact: cloneLayoutOptions(initialCookie.layouts.compact),
        table: cloneLayoutOptions(initialCookie.layouts.table),
      }
    : createDefaultLayoutOptions();
  const activeLayoutOptions = getLayoutOptions(viewOptionsByLayout, view);

  return createStore<ViewOptionsState>((set) => ({
    // Layout
    ...activeLayoutOptions,
    view,
    viewOptionsByLayout,
    setView: (nextView) =>
      set((state) => {
        if (state.view === nextView) {
          return state;
        }

        return {
          view: nextView,
          ...getLayoutOptions(state.viewOptionsByLayout, nextView),
        };
      }),

    // Appearance
    setBookmarkWidthForType: (layout, type, width) =>
      set((state) =>
        updateLayoutOptions(state, layout, {
          bookmarkWidthByType: {
            ...getLayoutOptions(state.viewOptionsByLayout, layout).bookmarkWidthByType,
            [type]: width,
          },
        }),
      ),
    setGridGap: (layout, gridGap) => set((state) => updateLayoutOptions(state, layout, {gridGap})),
    setColumnSize: (layout, columnSize) =>
      set((state) => updateLayoutOptions(state, layout, {columnSize})),
    setBorderRadius: (layout, borderRadius) =>
      set((state) => updateLayoutOptions(state, layout, {borderRadius})),

    // Content (websites / media)
    setShowTitle: (layout, showTitle) =>
      set((state) => updateLayoutOptions(state, layout, {showTitle})),
    setContentToggle: (layout, field, value) =>
      set((state) =>
        updateLayoutOptions(state, layout, {
          contentToggles: {
            ...getLayoutOptions(state.viewOptionsByLayout, layout).contentToggles,
            [field]: value,
          },
        }),
      ),
    setContentToggles: (layout, contentToggles) =>
      set((state) => updateLayoutOptions(state, layout, {contentToggles})),

    // Content (posts)
    setPostContentToggle: (layout, field, value) =>
      set((state) =>
        updateLayoutOptions(state, layout, {
          postContentToggles: {
            ...getLayoutOptions(state.viewOptionsByLayout, layout).postContentToggles,
            [field]: value,
          },
        }),
      ),

    // Interactions (compact view)
    setCompactInteraction: (layout, key, value) =>
      set((state) =>
        updateLayoutOptions(state, layout, {
          compactInteractions: {
            ...getLayoutOptions(state.viewOptionsByLayout, layout).compactInteractions,
            [key]: value,
          },
        }),
      ),
    setCompactInteractions: (layout, compactInteractions) =>
      set((state) => updateLayoutOptions(state, layout, {compactInteractions})),

    // Reset
    resetViewOptions: (layout) =>
      set((state) => {
        if (!layout) {
          const viewOptionsByLayout = createDefaultLayoutOptions();

          return {
            ...viewOptionsByLayout.list,
            view: "list" as const,
            viewOptionsByLayout,
          };
        }

        const nextLayoutOptions = getDefaultLayoutOptions(layout);

        return {
          ...(layout === state.view ? nextLayoutOptions : {}),
          viewOptionsByLayout: {
            ...state.viewOptionsByLayout,
            [layout]: nextLayoutOptions,
          },
        };
      }),
  }));
}

export const ViewOptionsStoreContext = createContext<StoreApi<ViewOptionsState> | null>(null);
const fallbackViewOptionsStore = createViewOptionsStore();
const identitySelector = (state: ViewOptionsState) => state;

export function useViewOptionsStore<T = ViewOptionsState>(
  selector: (state: ViewOptionsState) => T = identitySelector as (state: ViewOptionsState) => T,
) {
  const store = useContext(ViewOptionsStoreContext) ?? fallbackViewOptionsStore;
  return useStore(store, selector);
}
