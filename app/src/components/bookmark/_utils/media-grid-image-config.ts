import type {ColumnSize} from "@/store/use-view-options";

export type BookmarkMediaPreviewSize = "small" | "medium" | "large";

export function getBookmarkMediaPreviewSizeForColumnSize(
  columnSize: ColumnSize,
): BookmarkMediaPreviewSize {
  if (columnSize >= 4) return "small";
  if (columnSize >= 2) return "medium";
  return "large";
}

export function getBookmarkMediaSizesForColumnSize(columnSize: ColumnSize): string {
  switch (columnSize) {
    case 1:
      return "100vw";
    case 2:
      return "(max-width: 640px) 100vw, 50vw";
    case 3:
      return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
    case 4:
      return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw";
    case 5:
      return "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw";
    case 6:
      return "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 16.67vw";
  }
}

export function getBookmarkMediaQualityForColumnSize(columnSize: ColumnSize): 50 | 60 | 75 {
  if (columnSize === 1) return 75;
  if (columnSize <= 3) return 60;
  return 50;
}
