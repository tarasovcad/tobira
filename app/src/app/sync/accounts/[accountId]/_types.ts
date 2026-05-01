import type {Bookmark} from "@/components/bookmark/types";

export type SyncItem = Bookmark & {
  sync_account_id: string;
  synced_at: string;
};

export type SyncStatusFilter = "all" | "unsaved" | "added" | "errors" | "duplicates";
