"use client";

import {useMemo, type ReactNode} from "react";

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
import {ScrollArea} from "@/components/ui/coss/scroll-area";
import {Switch} from "@/components/ui/app/switch";
import {cn} from "@/lib/utils";
import {ChromeFolderListLoading} from "./ChromeFolderListLoading";
import {
  isChromeAutoSyncSource,
  isChromeBookmarksSource,
  useChromeSetupStore,
  type DeletedItemBehavior,
  type FolderOrganization,
} from "./use-chrome-setup-store";

interface ChromeFolder {
  id: string;
  label: string;
  count: number;
}

const MOCK_CHROME_FOLDERS: ChromeFolder[] = [
  {id: "bookmarks-bar", label: "Bookmarks Bar", count: 43},
  {id: "other-bookmarks", label: "Other Bookmarks", count: 12},
  {id: "mobile-bookmarks", label: "Mobile Bookmarks", count: 1},
  {id: "reading", label: "Reading", count: 0},
  {id: "work", label: "Work", count: 10},
  {id: "design", label: "Design", count: 313},
  {id: "de1sign", label: "Des1ign", count: 313},
];

function PreferenceSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-5", className)}>
      <div className="text-foreground text-[15px] font-[550]">{title}</div>
      <p className="text-secondary mt-1 text-sm">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function OrganizationOption({
  value,
  selected,
  label,
  description,
  badge,
  onSelect,
}: {
  value: FolderOrganization;
  selected: boolean;
  label: string;
  description: string;
  badge?: string;
  onSelect: (value: FolderOrganization) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 px-3.5 py-3 text-left transition-none!",
        selected
          ? "bg-muted-strong text-foreground"
          : "text-secondary hover:bg-muted hover:text-foreground",
      )}>
      <div
        className={cn(
          "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-none!",
          selected ? "border-highlight bg-highlight" : "border-muted-foreground/35",
          description ? "mt-1" : "mt-0.5",
        )}>
        {selected ? <div className="h-1 w-1 rounded-full bg-white" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {badge ? (
            <span className="bg-highlight/12 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-[550] tracking-wide text-blue-400 uppercase">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{description}</p>
      </div>
    </button>
  );
}

export function ChromePreferencesStep({userId}: {userId?: string | null}) {
  const selectedSource = useChromeSetupStore((state) => state.selectedSource);
  const preferences = useChromeSetupStore((state) => state.preferences);
  const setPreference = useChromeSetupStore((state) => state.setPreference);
  const toggleFolder = useChromeSetupStore((state) => state.toggleFolder);

  const isBookmarks = isChromeBookmarksSource(selectedSource);
  const isAutoSync = isChromeAutoSyncSource(selectedSource);
  const showCollectionPicker =
    !isBookmarks || preferences.folderOrganization === "single-collection";

  const {data: collections = []} = useCollectionsQuery({userId, enabled: !!userId});

  const collectionItems = useMemo(
    () => collections.map((c) => ({label: c.name, value: c.id})),
    [collections],
  );

  const selectedCollection = useMemo(
    () => collectionItems.find((ci) => ci.value === preferences.defaultCollectionId) ?? null,
    [collectionItems, preferences.defaultCollectionId],
  );

  const isLoadingFolders = false;

  const allFoldersSelected = preferences.selectedFolderIds.length === MOCK_CHROME_FOLDERS.length;

  const handleSelectAllFolders = () => {
    setPreference(
      "selectedFolderIds",
      allFoldersSelected ? [] : MOCK_CHROME_FOLDERS.map((folder) => folder.id),
    );
  };

  return (
    <div className="flex flex-col">
      {isBookmarks ? (
        <>
          <PreferenceSection
            title="Bookmark folders"
            description="Choose which Chrome folders to include. Nested folders stay selected with their parent when enabled."
            className="pt-0">
            {isLoadingFolders ? (
              <ChromeFolderListLoading />
            ) : (
              <div className="border-border overflow-hidden rounded-[10px] border">
                <button
                  type="button"
                  onClick={handleSelectAllFolders}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 border-b px-3.5 py-2.5 text-left transition-none!",
                    allFoldersSelected
                      ? "bg-muted-strong text-foreground border-border"
                      : "text-secondary hover:bg-muted hover:text-foreground border-border",
                  )}>
                  <FolderCheckmark checked={allFoldersSelected} />
                  <span className="text-sm font-medium">All folders</span>
                </button>

                <ScrollArea
                  className="h-56 **:data-[slot=scroll-area-scrollbar]:opacity-100 [&_[data-orientation=horizontal]]:hidden"
                  scrollbarGutter
                  viewportProps={{className: "divide-border divide-y overscroll-contain"}}>
                  {MOCK_CHROME_FOLDERS.map((folder) => {
                    const isSelected = preferences.selectedFolderIds.includes(folder.id);

                    return (
                      <button
                        key={folder.id}
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        onClick={() => toggleFolder(folder.id)}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left transition-none!",
                          isSelected
                            ? "bg-muted-strong text-foreground"
                            : "text-secondary hover:bg-muted hover:text-foreground",
                        )}>
                        <FolderCheckmark checked={isSelected} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {folder.label}
                            <span className="text-muted-foreground pl-2">{folder.count} items</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </ScrollArea>
              </div>
            )}
          </PreferenceSection>

          <PreferenceSection
            title="Include nested folders"
            description="When enabled, subfolders inside selected folders are imported too.">
            <Switch
              checked={preferences.includeNestedFolders}
              onToggle={() =>
                setPreference("includeNestedFolders", !preferences.includeNestedFolders)
              }
              aria-label="Include nested folders"
              className="hit-area-5 w-fit px-0 py-0"
            />
          </PreferenceSection>

          <PreferenceSection
            title="Organization"
            description="Decide whether Chrome folders become Tobira collections.">
            <div
              className="border-border divide-border divide-y overflow-hidden rounded-[10px] border"
              role="radiogroup"
              aria-label="Folder organization">
              <OrganizationOption
                value="preserve"
                selected={preferences.folderOrganization === "preserve"}
                label="Preserve Chrome folders"
                description="Create matching Tobira collections for the folders you selected."
                onSelect={(value) => setPreference("folderOrganization", value)}
              />
              <OrganizationOption
                value="single-collection"
                selected={preferences.folderOrganization === "single-collection"}
                label="Add everything to one collection"
                description="Place all imported bookmarks into a single Tobira collection."
                onSelect={(value) => setPreference("folderOrganization", value)}
              />
            </div>
          </PreferenceSection>
        </>
      ) : null}

      {showCollectionPicker ? (
        <PreferenceSection
          title={isBookmarks ? "Destination collection" : "Default collection"}
          description={
            isBookmarks
              ? "All imported bookmarks will be added to this collection."
              : "Imported items from this Chrome source will be added to this collection."
          }>
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
        </PreferenceSection>
      ) : null}

      {isAutoSync ? (
        <>
          <PreferenceSection
            title="When an item is removed from Chrome"
            description="Choose what happens in Tobira if a synced item disappears from Chrome.">
            <Select
              value={preferences.deletedItemBehavior}
              onValueChange={(value) =>
                setPreference("deletedItemBehavior", value as DeletedItemBehavior)
              }>
              <SelectTrigger aria-label="Deleted item behavior" className="w-full">
                <span className="flex-1 truncate">
                  {getDeletedItemBehaviorLabel(preferences.deletedItemBehavior)}
                </span>
              </SelectTrigger>
              <SelectPopup alignItemWithTrigger={false}>
                <SelectItem value="keep">Keep it in Tobira</SelectItem>
                <SelectItem value="remove">Remove it from Tobira</SelectItem>
              </SelectPopup>
            </Select>
          </PreferenceSection>

          <div className="px-6 pb-5">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Sync is one-way from Chrome to Tobira. Changes in Tobira never modify Chrome.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FolderCheckmark({checked}: {checked: boolean}) {
  return (
    <div
      className={cn(
        "flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] transition-none!",
        checked ? "border-highlight bg-highlight text-white" : "border-muted-foreground/35",
      )}
      aria-hidden="true">
      {checked ? (
        <svg
          className="size-2.5"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.91699 7.4375L5.83366 11.0833L11.0837 2.91667"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </div>
  );
}

function getDeletedItemBehaviorLabel(value: DeletedItemBehavior) {
  switch (value) {
    case "keep":
      return "Keep it in Tobira";
    case "remove":
      return "Remove it from Tobira";
  }
}
