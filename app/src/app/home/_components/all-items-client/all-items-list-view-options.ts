import type {TypeFilter} from "../../_types";
import type {BorderRadius, ColumnSize, GridGap, ViewMode} from "@/store/use-view-options";

export const ALL_ITEMS_SUPPORTED_VIEWS = [
  "list",
  "grid",
  "table",
  "compact",
] as const satisfies readonly ViewMode[];

export type AllItemsView = (typeof ALL_ITEMS_SUPPORTED_VIEWS)[number];

export function getAllItemsAllowedViews(typeFilter: TypeFilter): readonly AllItemsView[] {
  switch (typeFilter) {
    case "website":
      return ALL_ITEMS_SUPPORTED_VIEWS;
    case "media":
      return ["grid"];
    case "post":
      return ["list"];
  }
}

export function getDefaultAllItemsView(typeFilter: TypeFilter): AllItemsView {
  return getAllItemsAllowedViews(typeFilter)[0];
}

export function getCurrentAllItemsView(view: ViewMode, typeFilter: TypeFilter): AllItemsView {
  const allowedViews = getAllItemsAllowedViews(typeFilter);

  if (allowedViews.includes(view as AllItemsView)) {
    return view as AllItemsView;
  }

  return getDefaultAllItemsView(typeFilter);
}

export function isAllItemsViewSelectable(view: ViewMode, typeFilter: TypeFilter) {
  return getAllItemsAllowedViews(typeFilter).includes(view as AllItemsView);
}

export function getNextAllItemsView(view: ViewMode, typeFilter: TypeFilter): AllItemsView {
  const currentView = getCurrentAllItemsView(view, typeFilter);

  switch (typeFilter) {
    case "media":
      return "grid";
    case "post":
      return "list";
    case "website":
      switch (currentView) {
        case "list":
          return "grid";
        case "grid":
          return "table";
        case "table":
          return "compact";
        case "compact":
          return "list";
      }
  }
}

const BORDER_RADIUS_MAP = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
} satisfies Record<BorderRadius, string>;

const GAP_MAP = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
} satisfies Record<GridGap, string>;

const GRID_COLUMNS_MAP = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
} satisfies Record<ColumnSize, string>;

function getBorderRadiusClass(borderRadius: BorderRadius) {
  switch (borderRadius) {
    case "none":
      return BORDER_RADIUS_MAP.none;
    case "sm":
      return BORDER_RADIUS_MAP.sm;
    case "md":
      return BORDER_RADIUS_MAP.md;
    case "lg":
      return BORDER_RADIUS_MAP.lg;
  }
}

function getGapClass(gridGap: GridGap) {
  switch (gridGap) {
    case "none":
      return GAP_MAP.none;
    case "xs":
      return GAP_MAP.xs;
    case "sm":
      return GAP_MAP.sm;
    case "md":
      return GAP_MAP.md;
    case "lg":
      return GAP_MAP.lg;
  }
}

function getGridColumnsClass(columnSize: ColumnSize) {
  switch (columnSize) {
    case 1:
      return GRID_COLUMNS_MAP[1];
    case 2:
      return GRID_COLUMNS_MAP[2];
    case 3:
      return GRID_COLUMNS_MAP[3];
    case 4:
      return GRID_COLUMNS_MAP[4];
    case 5:
      return GRID_COLUMNS_MAP[5];
    case 6:
      return GRID_COLUMNS_MAP[6];
  }
}

export function getAllItemsListViewOptions({
  borderRadius,
  gridGap,
  columnSize,
}: {
  borderRadius: BorderRadius;
  gridGap: GridGap;
  columnSize: ColumnSize;
}) {
  return {
    borderRadiusClass: getBorderRadiusClass(borderRadius),
    gapClass: getGapClass(gridGap),
    gridColsClass: getGridColumnsClass(columnSize),
  };
}
