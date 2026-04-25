import type {BookmarkMetadata} from "@/components/bookmark/types/metadata";
import type {BookmarkImages} from "@/db/schema";

export type Bookmark = {
  id: string;
  kind: "website" | "media" | "post";
  title: string;
  description: string;
  created_at: string;
  url: string;
  user_id: string;
  updated_at: string;
  archived_at: string;
  deleted_at: string;
  notes: string;
  tags?: string[];
  collections?: {id: string; name: string}[];
  images?: BookmarkImages;
  metadata?: BookmarkMetadata;
};

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
