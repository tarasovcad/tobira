import {useState} from "react";
import type {Bookmark} from "@/components/bookmark/Bookmark";
import {toastManager} from "@/components/coss-ui/toast";

/**
 * Manages bookmark selection state (single, multiple, all) and related actions.
 */
export function useBookmarksSelection(visibleItems: Bookmark[], allBookmarks: Bookmark[]) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  let activeSelectedIds = new Set<string>();

  if (selectionMode) {
    const visibleSet = new Set(visibleItems.map((i) => i.id));
    const pruned = new Set<string>();

    for (const id of selectedIds) {
      if (visibleSet.has(id)) {
        pruned.add(id);
      }
    }

    // NOTE: If no items were pruned, reuse the original Set to maintain
    // referential equality for any downstream components that depend on it.
    activeSelectedIds = pruned.size === selectedIds.size ? selectedIds : pruned;
  }

  const selectedCount = activeSelectedIds.size;
  const allSelected = selectedCount > 0 && selectedCount === visibleItems.length;

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const setSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setSelectionEnabled = (enabled: boolean) => {
    setSelectionMode(enabled);
    if (!enabled) setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleItems.map((i) => i.id)));
    }
  };

  const handleCopySelected = () => {
    // NOTE: We look up the full bookmark objects from allBookmarks so we can extract their URLs.
    const selectedBookmarks = allBookmarks.filter((item) => activeSelectedIds.has(item.id));
    const urls = selectedBookmarks.map((item) => item.url).join("\n\n");

    if (urls) {
      navigator.clipboard.writeText(urls);

      const count = selectedBookmarks.length;
      toastManager.add({
        title: "Copied to clipboard",
        description: `${count} link${count > 1 ? "s" : ""} copied to your clipboard.`,
        type: "success",
      });

      handleClearSelection();
    }
  };

  return {
    selectionMode,
    selectedIds: activeSelectedIds,
    selectedCount,
    allSelected,

    // Setters
    setSelectionMode: setSelectionEnabled, // Point to the safe setter that clears state on disable
    setSelectedIds,
    setSelectionEnabled,

    // Actions
    setSelected,
    toggleSelected,
    handleClearSelection,
    handleSelectAll,
    handleCopySelected,
  };
}
