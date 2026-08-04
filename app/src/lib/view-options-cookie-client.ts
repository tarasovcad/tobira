"use client";

import {
  cloneLayoutOptions,
  COLUMN_SIZES,
  createDefaultLayoutOptions,
  type BorderRadius,
  type BookmarkWidth,
  type ColumnSize,
  type CompactPreviewPosition,
  type CompactPreviewSize,
  type GridGap,
  type ViewLayoutOptions,
  type ViewMode,
  type ViewOptionsState,
} from "@/store/use-view-options";
import {
  VIEW_OPTIONS_COOKIE,
  VIEW_OPTIONS_COOKIE_MAX_AGE,
  type ViewOptionsCookie,
} from "@/lib/view-options-cookie";

const VIEW_MODES = ["list", "grid", "compact", "table"] as const;
const GRID_GAPS = ["none", "xs", "sm", "md", "lg"] as const;
const BORDER_RADII = ["none", "sm", "md", "lg"] as const;
const BOOKMARK_WIDTHS = ["full", "lg", "md", "sm", "xs"] as const;
const COMPACT_PREVIEW_SIZES = ["sm", "md", "lg"] as const;
const COMPACT_PREVIEW_POSITIONS = ["left", "right", "auto"] as const;

type CompactLayoutOverrides = {
  g?: number;
  c?: number;
  r?: number;
  w?: number;
  h?: number;
  x?: number;
  p?: number;
  i?: number;
};

type CompactViewOptionsCookie = {
  v: 2;
  m: number;
  o?: {
    l?: CompactLayoutOverrides;
    g?: CompactLayoutOverrides;
    c?: CompactLayoutOverrides;
    t?: CompactLayoutOverrides;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isViewMode(value: unknown): value is ViewMode {
  return VIEW_MODES.includes(value as ViewMode);
}

function isGridGap(value: unknown): value is GridGap {
  return GRID_GAPS.includes(value as GridGap);
}

function isBorderRadius(value: unknown): value is BorderRadius {
  return BORDER_RADII.includes(value as BorderRadius);
}

function isColumnSize(value: unknown): value is ColumnSize {
  return COLUMN_SIZES.includes(value as ColumnSize);
}

function isBookmarkWidth(value: unknown): value is BookmarkWidth {
  return BOOKMARK_WIDTHS.includes(value as BookmarkWidth);
}

function isCompactPreviewSize(value: unknown): value is CompactPreviewSize {
  return COMPACT_PREVIEW_SIZES.includes(value as CompactPreviewSize);
}

function isCompactPreviewPosition(value: unknown): value is CompactPreviewPosition {
  return COMPACT_PREVIEW_POSITIONS.includes(value as CompactPreviewPosition);
}

function isViewLayoutOptions(value: unknown): value is ViewLayoutOptions {
  if (!isRecord(value)) {
    return false;
  }

  const bookmarkWidthByType = value.bookmarkWidthByType;
  const contentToggles = value.contentToggles;
  const postContentToggles = value.postContentToggles;
  const compactInteractions = value.compactInteractions;

  return (
    isGridGap(value.gridGap) &&
    isColumnSize(value.columnSize) &&
    isBorderRadius(value.borderRadius) &&
    isRecord(bookmarkWidthByType) &&
    isBookmarkWidth(bookmarkWidthByType.website) &&
    isBookmarkWidth(bookmarkWidthByType.media) &&
    isBookmarkWidth(bookmarkWidthByType.post) &&
    (typeof value.showTitle === "boolean" || typeof value.showTitle === "undefined") &&
    isRecord(contentToggles) &&
    typeof contentToggles.description === "boolean" &&
    typeof contentToggles.tags === "boolean" &&
    typeof contentToggles.source === "boolean" &&
    typeof contentToggles.savedDate === "boolean" &&
    typeof contentToggles.avatar === "boolean" &&
    isRecord(postContentToggles) &&
    typeof postContentToggles.author === "boolean" &&
    typeof postContentToggles.media === "boolean" &&
    typeof postContentToggles.quotedPost === "boolean" &&
    typeof postContentToggles.timestamp === "boolean" &&
    typeof postContentToggles.tags === "boolean" &&
    isRecord(compactInteractions) &&
    typeof compactInteractions.hoverPreview === "boolean" &&
    isCompactPreviewSize(compactInteractions.previewSize) &&
    typeof compactInteractions.previewAnimation === "boolean" &&
    isCompactPreviewPosition(compactInteractions.previewPosition)
  );
}

function createDefaultViewOptionsCookie(): ViewOptionsCookie {
  return {
    v: 2,
    view: "list",
    layouts: createDefaultLayoutOptions(),
  };
}

function normalizeLegacyLayoutOptions(value: unknown, fallback: ViewLayoutOptions) {
  if (!isViewLayoutOptions(value)) {
    return cloneLayoutOptions(fallback);
  }

  return {
    gridGap: value.gridGap,
    columnSize: value.columnSize,
    borderRadius: value.borderRadius,
    bookmarkWidthByType: {
      website: value.bookmarkWidthByType.website,
      media: value.bookmarkWidthByType.media,
      post: value.bookmarkWidthByType.post,
    },
    showTitle: typeof value.showTitle === "boolean" ? value.showTitle : fallback.showTitle,
    contentToggles: {
      description: value.contentToggles.description,
      tags: value.contentToggles.tags,
      source: value.contentToggles.source,
      savedDate: value.contentToggles.savedDate,
      avatar: value.contentToggles.avatar,
    },
    postContentToggles: {
      author: value.postContentToggles.author,
      media: value.postContentToggles.media,
      quotedPost: value.postContentToggles.quotedPost,
      timestamp: value.postContentToggles.timestamp,
      tags: value.postContentToggles.tags,
    },
    compactInteractions: {
      hoverPreview: value.compactInteractions.hoverPreview,
      previewSize: value.compactInteractions.previewSize,
      previewAnimation: value.compactInteractions.previewAnimation,
      previewPosition: value.compactInteractions.previewPosition,
    },
  };
}

function normalizeFullViewOptionsCookie(value: unknown): ViewOptionsCookie {
  const defaults = createDefaultViewOptionsCookie();

  if (!isRecord(value)) {
    return defaults;
  }

  const layouts = isRecord(value.layouts) ? value.layouts : {};

  return {
    v: 2,
    view: isViewMode(value.view) ? value.view : defaults.view,
    layouts: {
      list: normalizeLegacyLayoutOptions(layouts.list, defaults.layouts.list),
      grid: normalizeLegacyLayoutOptions(layouts.grid, defaults.layouts.grid),
      compact: normalizeLegacyLayoutOptions(layouts.compact, defaults.layouts.compact),
      table: normalizeLegacyLayoutOptions(layouts.table, defaults.layouts.table),
    },
  };
}

function decodeIndexedValue<T>(values: readonly T[], value: unknown, fallback: T) {
  return Number.isInteger(value) && typeof value === "number"
    ? (values.at(value) ?? fallback)
    : fallback;
}

function encodeBookmarkWidths(value: ViewLayoutOptions["bookmarkWidthByType"]) {
  return (
    BOOKMARK_WIDTHS.indexOf(value.website) +
    BOOKMARK_WIDTHS.indexOf(value.media) * BOOKMARK_WIDTHS.length +
    BOOKMARK_WIDTHS.indexOf(value.post) * BOOKMARK_WIDTHS.length ** 2
  );
}

function decodeBookmarkWidths(value: unknown, fallback: ViewLayoutOptions["bookmarkWidthByType"]) {
  if (!Number.isInteger(value) || typeof value !== "number" || value < 0 || value >= 125) {
    return {...fallback};
  }

  return {
    website: BOOKMARK_WIDTHS[value % BOOKMARK_WIDTHS.length],
    media: BOOKMARK_WIDTHS[Math.floor(value / BOOKMARK_WIDTHS.length) % BOOKMARK_WIDTHS.length],
    post: BOOKMARK_WIDTHS[Math.floor(value / BOOKMARK_WIDTHS.length ** 2) % BOOKMARK_WIDTHS.length],
  };
}

function encodeContentToggles(value: ViewLayoutOptions["contentToggles"]) {
  return (
    Number(value.description) |
    (Number(value.tags) << 1) |
    (Number(value.source) << 2) |
    (Number(value.savedDate) << 3) |
    (Number(value.avatar) << 4)
  );
}

function decodeContentToggles(value: unknown, fallback: ViewLayoutOptions["contentToggles"]) {
  if (!Number.isInteger(value) || typeof value !== "number" || value < 0 || value >= 32) {
    return {...fallback};
  }

  return {
    description: Boolean(value & 1),
    tags: Boolean(value & 2),
    source: Boolean(value & 4),
    savedDate: Boolean(value & 8),
    avatar: Boolean(value & 16),
  };
}

function encodePostContentToggles(value: ViewLayoutOptions["postContentToggles"]) {
  return (
    Number(value.author) |
    (Number(value.media) << 1) |
    (Number(value.quotedPost) << 2) |
    (Number(value.timestamp) << 3) |
    (Number(value.tags) << 4)
  );
}

function decodePostContentToggles(
  value: unknown,
  fallback: ViewLayoutOptions["postContentToggles"],
) {
  if (!Number.isInteger(value) || typeof value !== "number" || value < 0 || value >= 32) {
    return {...fallback};
  }

  return {
    author: Boolean(value & 1),
    media: Boolean(value & 2),
    quotedPost: Boolean(value & 4),
    timestamp: Boolean(value & 8),
    tags: Boolean(value & 16),
  };
}

function encodeCompactInteractions(value: ViewLayoutOptions["compactInteractions"]) {
  return (
    Number(value.hoverPreview) +
    COMPACT_PREVIEW_SIZES.indexOf(value.previewSize) * 2 +
    Number(value.previewAnimation) * 6 +
    COMPACT_PREVIEW_POSITIONS.indexOf(value.previewPosition) * 12
  );
}

function decodeCompactInteractions(
  value: unknown,
  fallback: ViewLayoutOptions["compactInteractions"],
) {
  if (!Number.isInteger(value) || typeof value !== "number" || value < 0 || value >= 36) {
    return {...fallback};
  }

  return {
    hoverPreview: Boolean(value % 2),
    previewSize: COMPACT_PREVIEW_SIZES[Math.floor(value / 2) % COMPACT_PREVIEW_SIZES.length],
    previewAnimation: Boolean(Math.floor(value / 6) % 2),
    previewPosition:
      COMPACT_PREVIEW_POSITIONS[Math.floor(value / 12) % COMPACT_PREVIEW_POSITIONS.length],
  };
}

function applyCompactLayoutOverrides(value: unknown, fallback: ViewLayoutOptions) {
  if (!isRecord(value)) {
    return cloneLayoutOptions(fallback);
  }

  return {
    gridGap: decodeIndexedValue(GRID_GAPS, value.g, fallback.gridGap),
    columnSize: isColumnSize(value.c) ? value.c : fallback.columnSize,
    borderRadius: decodeIndexedValue(BORDER_RADII, value.r, fallback.borderRadius),
    bookmarkWidthByType: decodeBookmarkWidths(value.w, fallback.bookmarkWidthByType),
    showTitle: value.h === 0 ? false : value.h === 1 ? true : fallback.showTitle,
    contentToggles: decodeContentToggles(value.x, fallback.contentToggles),
    postContentToggles: decodePostContentToggles(value.p, fallback.postContentToggles),
    compactInteractions: decodeCompactInteractions(value.i, fallback.compactInteractions),
  };
}

function parseCompactViewOptionsCookie(value: Record<string, unknown>): ViewOptionsCookie {
  const defaults = createDefaultViewOptionsCookie();
  const overrides = isRecord(value.o) ? value.o : {};

  return {
    v: 2,
    view: decodeIndexedValue(VIEW_MODES, value.m, defaults.view),
    layouts: {
      list: applyCompactLayoutOverrides(overrides.l, defaults.layouts.list),
      grid: applyCompactLayoutOverrides(overrides.g, defaults.layouts.grid),
      compact: applyCompactLayoutOverrides(overrides.c, defaults.layouts.compact),
      table: applyCompactLayoutOverrides(overrides.t, defaults.layouts.table),
    },
  };
}

function createCompactLayoutOverrides(
  value: ViewLayoutOptions,
  defaults: ViewLayoutOptions,
): CompactLayoutOverrides | undefined {
  const overrides: CompactLayoutOverrides = {};

  if (value.gridGap !== defaults.gridGap) overrides.g = GRID_GAPS.indexOf(value.gridGap);
  if (value.columnSize !== defaults.columnSize) overrides.c = value.columnSize;
  if (value.borderRadius !== defaults.borderRadius) {
    overrides.r = BORDER_RADII.indexOf(value.borderRadius);
  }
  if (value.showTitle !== defaults.showTitle) overrides.h = Number(value.showTitle);

  const widths = encodeBookmarkWidths(value.bookmarkWidthByType);
  if (widths !== encodeBookmarkWidths(defaults.bookmarkWidthByType)) overrides.w = widths;

  const content = encodeContentToggles(value.contentToggles);
  if (content !== encodeContentToggles(defaults.contentToggles)) overrides.x = content;

  const postContent = encodePostContentToggles(value.postContentToggles);
  if (postContent !== encodePostContentToggles(defaults.postContentToggles)) {
    overrides.p = postContent;
  }

  const interactions = encodeCompactInteractions(value.compactInteractions);
  if (interactions !== encodeCompactInteractions(defaults.compactInteractions)) {
    overrides.i = interactions;
  }

  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

function createCompactViewOptionsCookie(options: ViewOptionsCookie): CompactViewOptionsCookie {
  const normalized = normalizeFullViewOptionsCookie(options);
  const defaults = createDefaultViewOptionsCookie();
  const list = createCompactLayoutOverrides(normalized.layouts.list, defaults.layouts.list);
  const grid = createCompactLayoutOverrides(normalized.layouts.grid, defaults.layouts.grid);
  const compact = createCompactLayoutOverrides(
    normalized.layouts.compact,
    defaults.layouts.compact,
  );
  const table = createCompactLayoutOverrides(normalized.layouts.table, defaults.layouts.table);
  const overrides: NonNullable<CompactViewOptionsCookie["o"]> = {};

  if (list) overrides.l = list;
  if (grid) overrides.g = grid;
  if (compact) overrides.c = compact;
  if (table) overrides.t = table;

  return {
    v: 2,
    m: VIEW_MODES.indexOf(normalized.view),
    ...(Object.keys(overrides).length > 0 ? {o: overrides} : {}),
  };
}

function parseDecodedViewOptionsCookie(value: unknown) {
  if (!isRecord(value)) {
    return createDefaultViewOptionsCookie();
  }

  if (value.v === 2) {
    return isRecord(value.layouts)
      ? normalizeFullViewOptionsCookie(value)
      : parseCompactViewOptionsCookie(value);
  }

  return value.v === 1 ? normalizeFullViewOptionsCookie(value) : createDefaultViewOptionsCookie();
}

export function parseViewOptionsCookie(value?: string | null): ViewOptionsCookie {
  if (!value) {
    return createDefaultViewOptionsCookie();
  }

  try {
    return parseDecodedViewOptionsCookie(JSON.parse(decodeURIComponent(value)));
  } catch {
    try {
      return parseDecodedViewOptionsCookie(JSON.parse(value));
    } catch {
      return createDefaultViewOptionsCookie();
    }
  }
}

export function serializeViewOptionsCookie(options: ViewOptionsCookie) {
  return encodeURIComponent(JSON.stringify(createCompactViewOptionsCookie(options)));
}

export function writeViewOptionsCookie(options: ViewOptionsCookie) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const compactOptions = createCompactViewOptionsCookie(options);

  if (compactOptions.m === 0 && !compactOptions.o) {
    document.cookie = `${VIEW_OPTIONS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    return;
  }

  document.cookie = `${VIEW_OPTIONS_COOKIE}=${serializeViewOptionsCookie(
    options,
  )}; Path=/; Max-Age=${VIEW_OPTIONS_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

export function getViewOptionsCookie(state: ViewOptionsState): ViewOptionsCookie {
  return {
    v: 2,
    view: state.view,
    layouts: state.viewOptionsByLayout,
  };
}
