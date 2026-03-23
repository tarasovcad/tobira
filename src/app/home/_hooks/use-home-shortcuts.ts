import {useEffect, useRef} from "react";
import type {ViewMode} from "@/store/use-view-options";
import type {TypeFilter} from "../_components/AllItemsToolbar";
import {getNextAllItemsView} from "../_components/all-items-client/all-items-list-view-options";

interface UseHomeShortcutsProps {
  selectionMode: boolean;
  handleClearSelection: () => void;
  view: ViewMode;
  typeFilter: TypeFilter;
  setView: (view: ViewMode) => void;
}

export function useHomeShortcuts({
  selectionMode,
  handleClearSelection,
  view,
  typeFilter,
  setView,
}: UseHomeShortcutsProps) {
  // Store latest values in a ref to avoid re-attaching the event listener
  const stateRef = useRef({selectionMode, handleClearSelection, view, typeFilter, setView});

  // Update ref when props change
  useEffect(() => {
    stateRef.current = {selectionMode, handleClearSelection, view, typeFilter, setView};
  }, [selectionMode, handleClearSelection, view, typeFilter, setView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // Do not trigger shortcuts when typing in input fields
      if (isInput) return;

      const {
        selectionMode: currentSelectionMode,
        handleClearSelection: currentHandleClearSelection,
      } = stateRef.current;

      // Escape: Clear selection
      if (e.key === "Escape" && currentSelectionMode) {
        currentHandleClearSelection();
        return;
      }

      // Shift + V: Cycle through the layouts available for the current type filter.
      if (e.code === "KeyV" && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const {
          view: currentView,
          typeFilter: currentTypeFilter,
          setView: currentSetView,
        } = stateRef.current;
        currentSetView(getNextAllItemsView(currentView, currentTypeFilter));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
