import {useEffect, useRef} from "react";
import type {ViewMode} from "@/store/use-view-options";

interface UseHomeShortcutsProps {
  selectionMode: boolean;
  handleClearSelection: () => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
}

export function useHomeShortcuts({
  selectionMode,
  handleClearSelection,
  view,
  setView,
}: UseHomeShortcutsProps) {
  // Store latest values in a ref to avoid re-attaching the event listener
  const stateRef = useRef({selectionMode, handleClearSelection, view, setView});

  // Update ref when props change
  useEffect(() => {
    stateRef.current = {selectionMode, handleClearSelection, view, setView};
  }, [selectionMode, handleClearSelection, view, setView]);

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
        setView: currentSetView,
      } = stateRef.current;

      // Escape: Clear selection
      if (e.key === "Escape" && currentSelectionMode) {
        currentHandleClearSelection();
        return;
      }

      // Shift + V: Toggle view mode (list <-> grid)
      // Using e.code === "KeyV" is more robust than e.key === "V" against CapsLock
      if (e.code === "KeyV" && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const {view: currentView, setView: currentSetView} = stateRef.current;
        currentSetView(currentView === "list" ? "grid" : "list");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
