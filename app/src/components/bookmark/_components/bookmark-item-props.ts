import type {Bookmark} from "../types";

export interface BookmarkItemProps {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  onSave?: (item: Bookmark) => void;
  onDismiss?: (item: Bookmark) => void;
  className?: string;
  mediaIndex?: number;
  selectionIndex?: number;
  isSelected?: boolean;
  setSelected?: (id: string, checked: boolean) => void;
}
