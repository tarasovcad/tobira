"use client";

import {useMemo, useState} from "react";

import {SearchIcon} from "lucide-react";
import {useCollectionsQuery} from "@/features/home/hooks/use-home-metadata-query";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/coss/combobox";
import {Select as ComboboxSelect, SelectButton} from "@/components/ui/coss/select";
import {Select, SelectItem, SelectPopup, SelectTrigger} from "@/components/ui/coss/select";
import {Switch} from "@/components/ui/app/switch";
import {Separator} from "@/components/ui/legacy-shadcn/separator";

type SyncMode = "automatic" | "once";
type ImportRange = "all" | "recent";
type DeletedItemBehavior = "keep" | "remove";

interface PreferencesState {
  syncMode: SyncMode;
  importRange: ImportRange;
  deletedItemBehavior: DeletedItemBehavior;
  includeMedia: boolean;
  includeLinks: boolean;
  includeReplies: boolean;
  saveAsPrivate: boolean;
  notifyOnCompletion: boolean;
  skipDuplicates: boolean;
  autoTagImports: string[];
  defaultCollectionId: string | null;
}

const DEFAULT_PREFERENCES: PreferencesState = {
  syncMode: "automatic",
  importRange: "all",
  deletedItemBehavior: "keep",
  includeMedia: true,
  includeLinks: true,
  includeReplies: true,
  saveAsPrivate: true,
  notifyOnCompletion: true,
  skipDuplicates: true,
  autoTagImports: [],
  defaultCollectionId: null,
};

export default function PreferencesSyncStep({userId}: {userId?: string | null}) {
  const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES);

  const setPreference = <K extends keyof PreferencesState>(key: K, value: PreferencesState[K]) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const {data: collections = []} = useCollectionsQuery({userId, enabled: !!userId});

  const collectionItems = useMemo(
    () => collections.map((c) => ({label: c.name, value: c.id})),
    [collections],
  );

  const selectedCollection = useMemo(
    () => collectionItems.find((ci) => ci.value === preferences.defaultCollectionId) ?? null,
    [collectionItems, preferences.defaultCollectionId],
  );

  return (
    <div className="flex flex-col">
      <div className="px-6 pb-6">
        <p className="text-secondary text-sm leading-relaxed">
          Choose how Tobira should handle your X bookmarks after the extension connects. You can
          change these preferences later in settings.
        </p>
      </div>

      <Separator />

      <div className="px-6 py-5">
        <div className="text-foreground text-[15px] font-[550]">Sync mode</div>
        <p className="text-secondary mt-1 text-sm">
          Import your current bookmarks once, or keep Tobira updated as new ones appear.
        </p>
        <div className="mt-3">
          <Select
            value={preferences.syncMode}
            onValueChange={(value) => setPreference("syncMode", value as SyncMode)}>
            <SelectTrigger aria-label="Choose sync mode" className="w-full">
              <span className="flex-1 truncate">{getSyncModeLabel(preferences.syncMode)}</span>
            </SelectTrigger>
            <SelectPopup alignItemWithTrigger={false}>
              <SelectItem value="automatic">Keep synced automatically</SelectItem>
              <SelectItem value="once">Import once</SelectItem>
            </SelectPopup>
          </Select>
        </div>
      </div>

      {/* <div className="px-6 py-5">
        <div className="text-foreground text-[15px] font-[550]">Auto-tag imports</div>
        <p className="text-secondary mt-1 text-sm">
          These tags will be applied to all imported bookmarks.
        </p>
        <div className="mt-3">
          <TagsInput
            value={preferences.autoTagImports}
            onValueChange={(tags) => setPreference("autoTagImports", tags)}
            placeholder="Add tag..."
            aiEnabled={false}
            labelClassName="hidden"
            containerClassName="max-w-full gap-3"
          />
        </div>
      </div> */}

      <div className="px-6 py-5">
        <div className="text-foreground text-[15px] font-[550]">Default collection</div>
        <p className="text-secondary mt-1 text-sm">
          All imported X bookmarks will be added to this collection.
        </p>
        <div className="mt-3">
          <Combobox
            items={collectionItems}
            value={selectedCollection}
            onValueChange={(val) => setPreference("defaultCollectionId", val?.value ?? null)}>
            <ComboboxSelect>
              <ComboboxTrigger render={<SelectButton />}>
                <ComboboxValue placeholder="Select a collection" />
              </ComboboxTrigger>
            </ComboboxSelect>
            <ComboboxPopup aria-label="Select a collection" className="w-(--anchor-width)">
              <div className="border-b p-2">
                <ComboboxInput
                  className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
                  placeholder="Search collections..."
                  showTrigger={false}
                  startAddon={<SearchIcon className="size-4" />}
                />
              </div>
              <ComboboxEmpty>No collections found.</ComboboxEmpty>
              <ComboboxList>
                {(ci) => (
                  <ComboboxItem key={ci.value} value={ci}>
                    {ci.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxPopup>
          </Combobox>
        </div>
      </div>
      <div className="px-6 py-5">
        <div className="text-foreground text-[15px] font-[550]">Skip duplicates</div>
        <p className="text-secondary mt-1 text-sm">
          Don&apos;t import bookmarks already saved in Tobira.
        </p>
        <div className="mt-3">
          <Switch
            checked={preferences.skipDuplicates}
            onToggle={() => setPreference("skipDuplicates", !preferences.skipDuplicates)}
            aria-label="Skip duplicates"
            className="hit-area-5 w-fit px-0 py-0"
          />
        </div>
      </div>
    </div>
  );
}

function getSyncModeLabel(value: SyncMode) {
  switch (value) {
    case "automatic":
      return "Keep synced automatically";
    case "once":
      return "Import once";
  }
}

function getImportRangeLabel(value: ImportRange) {
  switch (value) {
    case "all":
      return "All bookmarks";
    case "recent":
      return "Recent bookmarks only";
  }
}

function getDeletedItemBehaviorLabel(value: DeletedItemBehavior) {
  switch (value) {
    case "keep":
      return "Keep archived in Tobira";
    case "remove":
      return "Remove from Tobira";
  }
}
