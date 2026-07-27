import {create} from "zustand";

export type ChromeSourceId =
  | "import-bookmarks"
  | "import-open-tabs"
  | "import-tab-groups"
  | "import-reading-list"
  | "import-pinned-tabs"
  | "sync-bookmarks"
  | "sync-reading-list";

export type FolderOrganization = "preserve" | "single-collection";
export type DeletedItemBehavior = "keep" | "remove";

export interface ChromePreferencesState {
  selectedFolderIds: string[];
  includeNestedFolders: boolean;
  folderOrganization: FolderOrganization;
  defaultCollectionId: string | null;
  skipDuplicates: boolean;
  deletedItemBehavior: DeletedItemBehavior;
}

const DEFAULT_FOLDER_IDS = ["bookmarks-bar", "other-bookmarks"];

export const DEFAULT_CHROME_PREFERENCES: ChromePreferencesState = {
  selectedFolderIds: DEFAULT_FOLDER_IDS,
  includeNestedFolders: true,
  folderOrganization: "preserve",
  defaultCollectionId: null,
  skipDuplicates: true,
  deletedItemBehavior: "keep",
};

const DEFAULT_SOURCE: ChromeSourceId = "import-bookmarks";

interface ChromeSetupStore {
  selectedSource: ChromeSourceId;
  preferences: ChromePreferencesState;
  setSelectedSource: (sourceId: ChromeSourceId) => void;
  setPreference: <K extends keyof ChromePreferencesState>(
    key: K,
    value: ChromePreferencesState[K],
  ) => void;
  toggleFolder: (folderId: string) => void;
  reset: () => void;
}

export function isChromeBookmarksSource(sourceId: ChromeSourceId): boolean {
  return sourceId === "import-bookmarks" || sourceId === "sync-bookmarks";
}

export function isChromeAutoSyncSource(sourceId: ChromeSourceId): boolean {
  return sourceId === "sync-bookmarks" || sourceId === "sync-reading-list";
}

export const useChromeSetupStore = create<ChromeSetupStore>((set) => ({
  selectedSource: DEFAULT_SOURCE,
  preferences: DEFAULT_CHROME_PREFERENCES,

  setSelectedSource: (sourceId) => set({selectedSource: sourceId}),

  setPreference: (key, value) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        [key]: value,
      },
    })),

  toggleFolder: (folderId) =>
    set((state) => {
      const selected = state.preferences.selectedFolderIds;
      const next = selected.includes(folderId)
        ? selected.filter((id) => id !== folderId)
        : [...selected, folderId];

      return {
        preferences: {
          ...state.preferences,
          selectedFolderIds: next,
        },
      };
    }),

  reset: () =>
    set({
      selectedSource: DEFAULT_SOURCE,
      preferences: DEFAULT_CHROME_PREFERENCES,
    }),
}));
