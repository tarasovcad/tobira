"use client";

import {useState} from "react";

import {Alert, AlertDescription} from "@/components/coss-ui/alert";
import {Checkbox} from "@/components/coss-ui/checkbox";
import {Label} from "@/components/coss-ui/label";
import {Select, SelectItem, SelectPopup, SelectTrigger} from "@/components/coss-ui/select";
import {Switch} from "@/components/coss-ui/switch";

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
};

export default function PreferencesSyncStep() {
  const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES);

  const setPreference = <K extends keyof PreferencesState>(key: K, value: PreferencesState[K]) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="flex flex-col gap-4 px-6 pb-2">
      <p className="text-secondary text-sm leading-relaxed">
        Choose how Tobira should handle your X bookmarks after the extension connects. You can
        change these preferences later in settings.
      </p>

      <div className="border-border bg-card overflow-hidden rounded-[10px] border">
        <div className="divide-border divide-y">
          <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <p className="text-foreground text-sm font-[550]">Sync mode</p>
              <p className="text-secondary mt-1 text-sm">
                Import your current bookmarks once, or keep Tobira updated as new ones appear.
              </p>
            </div>
            <Select
              value={preferences.syncMode}
              onValueChange={(value) => setPreference("syncMode", value as SyncMode)}>
              <SelectTrigger aria-label="Choose sync mode" size="sm" className="w-full sm:w-56">
                <span className="flex-1 truncate">{getSyncModeLabel(preferences.syncMode)}</span>
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="automatic">Keep synced automatically</SelectItem>
                <SelectItem value="once">Import once</SelectItem>
              </SelectPopup>
            </Select>
          </div>

          <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <p className="text-foreground text-sm font-[550]">Import range</p>
              <p className="text-secondary mt-1 text-sm">
                Pull everything on the first run, or start with a lighter recent-only import.
              </p>
            </div>
            <Select
              value={preferences.importRange}
              onValueChange={(value) => setPreference("importRange", value as ImportRange)}>
              <SelectTrigger aria-label="Choose import range" size="sm" className="w-full sm:w-48">
                <span className="flex-1 truncate">
                  {getImportRangeLabel(preferences.importRange)}
                </span>
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="all">All bookmarks</SelectItem>
                <SelectItem value="recent">Recent bookmarks only</SelectItem>
              </SelectPopup>
            </Select>
          </div>

          <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <p className="text-foreground text-sm font-[550]">Removed bookmark behavior</p>
              <p className="text-secondary mt-1 text-sm">
                Decide what happens in Tobira if a bookmark disappears from X later on.
              </p>
            </div>
            <Select
              value={preferences.deletedItemBehavior}
              onValueChange={(value) =>
                setPreference("deletedItemBehavior", value as DeletedItemBehavior)
              }>
              <SelectTrigger
                aria-label="Choose removed bookmark behavior"
                size="sm"
                className="w-full sm:w-56">
                <span className="flex-1 truncate">
                  {getDeletedItemBehaviorLabel(preferences.deletedItemBehavior)}
                </span>
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="keep">Keep archived in Tobira</SelectItem>
                <SelectItem value="remove">Remove from Tobira</SelectItem>
              </SelectPopup>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-border bg-card rounded-[10px] border p-4">
        <div className="mb-3">
          <p className="text-foreground text-sm font-[550]">Include in sync</p>
          <p className="text-secondary mt-1 text-sm">
            Pick which parts of each bookmarked post Tobira should save alongside the post itself.
          </p>
        </div>

        <div className="space-y-3">
          <Label className="flex items-start gap-3 text-left">
            <Checkbox
              checked={preferences.includeMedia}
              onCheckedChange={(checked) => setPreference("includeMedia", checked === true)}
            />
            <span className="flex-1">
              <span className="text-foreground block text-sm font-[550]">Media attachments</span>
              <span className="text-secondary mt-1 block text-sm font-normal">
                Save images and media metadata with each imported bookmark.
              </span>
            </span>
          </Label>

          <Label className="flex items-start gap-3 text-left">
            <Checkbox
              checked={preferences.includeLinks}
              onCheckedChange={(checked) => setPreference("includeLinks", checked === true)}
            />
            <span className="flex-1">
              <span className="text-foreground block text-sm font-[550]">Outbound links</span>
              <span className="text-secondary mt-1 block text-sm font-normal">
                Capture URLs attached to posts so linked articles and resources stay searchable.
              </span>
            </span>
          </Label>

          <Label className="flex items-start gap-3 text-left">
            <Checkbox
              checked={preferences.includeReplies}
              onCheckedChange={(checked) => setPreference("includeReplies", checked === true)}
            />
            <span className="flex-1">
              <span className="text-foreground block text-sm font-[550]">
                Quoted and replied context
              </span>
              <span className="text-secondary mt-1 block text-sm font-normal">
                Preserve surrounding conversation context when it is available.
              </span>
            </span>
          </Label>
        </div>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-[10px] border">
        <div className="px-4 pt-4 pb-1">
          <p className="text-foreground text-sm font-[550]">After import</p>
          <p className="text-secondary mt-1 text-sm">
            A couple of defaults that make the first sync easier to manage.
          </p>
        </div>

        <div className="divide-border divide-y">
          <Label className="flex w-full items-start justify-between gap-4 px-4 py-3.5 text-left">
            <span className="pr-4">
              <span className="text-foreground block text-sm font-[550]">
                Save imported items as private
              </span>
              <span className="text-secondary mt-1 block text-sm font-normal">
                Keep synced bookmarks visible only to you by default.
              </span>
            </span>
            <Switch
              checked={preferences.saveAsPrivate}
              onCheckedChange={(checked) => setPreference("saveAsPrivate", checked)}
              aria-label="Save imported items as private"
            />
          </Label>

          <Label className="flex w-full items-start justify-between gap-4 px-4 py-3.5 text-left">
            <span className="pr-4">
              <span className="text-foreground block text-sm font-[550]">
                Notify when first sync finishes
              </span>
              <span className="text-secondary mt-1 block text-sm font-normal">
                Get a completion message once Tobira has finished pulling in your bookmarks.
              </span>
            </span>
            <Switch
              checked={preferences.notifyOnCompletion}
              onCheckedChange={(checked) => setPreference("notifyOnCompletion", checked)}
              aria-label="Notify when first sync finishes"
            />
          </Label>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          These are onboarding defaults only. You can change them later without reconnecting your X
          account.
        </AlertDescription>
      </Alert>
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
