export type ProviderStatus = "connected" | "disconnected" | "error" | "coming_soon";

export type ImportType = "bookmarks" | "rss" | "articles" | "videos" | "notes" | "highlights";

export interface SyncProvider {
  id: string;
  name: string;
  description: string;
  importTypes: ImportType[];
  status: ProviderStatus;
  /** Human-readable last sync label, e.g. "2 hours ago" */
  lastSync?: string;
  /** Short routing context displayed on the row, e.g. "Imports to All Items" */
  routingHint?: string;
  /** Number of items synced so far */
  itemCount?: number;
  connectLabel?: string;
  reconnectLabel?: string;
}

export interface SyncSummary {
  connectedProviders: number;
  totalProviders: number;
  lastSyncStatus: "ok" | "warning" | "error" | "never";
  lastSyncLabel: string;
  totalItems: number;
}
