"use client";

import {useEffect, useState} from "react";
import NumberFlow from "@number-flow/react";
import {motion} from "motion/react";
import {createPortal} from "react-dom";

import {Button} from "@/components/ui/coss/button";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/coss/alert-dialog";
import {useHasMounted} from "@/lib/hooks/use-has-mounted";
import {cn} from "@/lib/utils";

export function BinSelectionActionBar({
  visible,
  selectedCount,
  allSelected,
  disabled = false,
  onClearSelection,
  onSelectAll,
  onRestore,
  onDeleteForever,
  className,
}: {
  visible: boolean;
  selectedCount: number;
  allSelected: boolean;
  disabled?: boolean;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
  className?: string;
}) {
  const hasMounted = useHasMounted();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!visible || deleteDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "Escape") return;
      onClearSelection();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteDialogOpen, onClearSelection, visible]);

  const content = (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center transition-all duration-200 ease-out",
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}>
      <motion.div
        layout
        transition={{layout: {duration: 0.15, ease: "easeOut"}}}
        className="bg-background/90 ring-border flex items-center gap-1 rounded-xl p-1.5 shadow-lg ring-1 backdrop-blur">
        <div className="flex items-center gap-0.5">
          <span className="text-foreground flex items-center gap-1 pl-2 text-sm font-medium tabular-nums">
            <span className="min-w-[1ch] text-right">
              <NumberFlow value={selectedCount} />
            </span>
            selected
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear selection"
            onClick={onClearSelection}
            disabled={disabled}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.64551 3.64583L10.3538 10.3542M10.3538 3.64583L3.64551 10.3542"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </Button>
        </div>
        <div className="bg-foreground/30 mr-2 ml-1 h-5 w-px" />
        <Button variant="outline" size="sm" onClick={onSelectAll} disabled={disabled}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.00033 1.16667C3.77866 1.16667 1.16699 3.77834 1.16699 7.00001C1.16699 10.2216 3.77866 12.8333 7.00033 12.8333C10.222 12.8333 12.8337 10.2216 12.8337 7.00001C12.8337 3.77834 10.222 1.16667 7.00033 1.16667ZM9.08895 5.81871C9.24196 5.6317 9.21437 5.35607 9.02735 5.20306C8.84033 5.05006 8.56471 5.07762 8.4117 5.26463L6.09283 8.09883L5.26802 7.274C5.09717 7.10314 4.82015 7.10314 4.6493 7.274C4.47845 7.44486 4.47845 7.72182 4.6493 7.89268L5.81597 9.05935C5.90337 9.14679 6.02365 9.19311 6.14714 9.18698C6.27058 9.1808 6.38567 9.1227 6.46395 9.02703L9.08895 5.81871Z"
              fill="currentColor"
            />
          </svg>
          {allSelected ? "Deselect all" : "Select all"}
        </Button>
        <Button variant="outline" size="sm" onClick={onRestore} disabled={disabled}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3.20833 5.83333H8.16667C9.45533 5.83333 10.5 6.878 10.5 8.16667C10.5 9.45533 9.45533 10.5 8.16667 10.5H5.25M3.20833 5.83333L5.25 3.79167M3.20833 5.83333L5.25 7.875"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Restore
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={disabled}>
          <TrashIcon />
          Delete forever
        </Button>
      </motion.div>
    </div>
  );

  if (!hasMounted) {
    return null;
  }

  return (
    <>
      {createPortal(content, document.body)}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedCount <= 1
                ? "Delete bookmark forever?"
                : `Delete ${selectedCount} bookmarks forever?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCount <= 1
                ? "This permanently removes it from your bin and cannot be undone."
                : "This permanently removes them from your bin and cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteDialogOpen(false);
                onDeleteForever();
              }}
              disabled={disabled || selectedCount === 0}>
              Delete forever
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.58965 2.91666H1.89551C1.65389 2.91666 1.45801 3.11254 1.45801 3.35416C1.45801 3.59578 1.65389 3.79166 1.89551 3.79166H2.33299C2.333 3.80181 2.33336 3.81203 2.33408 3.8223L2.82398 10.7991C2.90444 11.9449 3.85744 12.8333 5.0061 12.8333H8.99327C10.1419 12.8333 11.0949 11.9449 11.1753 10.7991L11.6653 3.8223C11.666 3.81203 11.6663 3.80181 11.6663 3.79166H12.1038C12.3455 3.79166 12.5413 3.59578 12.5413 3.35416C12.5413 3.11254 12.3455 2.91666 12.1038 2.91666H9.40977C9.14727 1.82879 8.16815 1.02083 6.99973 1.02083C5.8313 1.02083 4.85213 1.82879 4.58965 2.91666ZM5.50479 2.91666H8.49464C8.26131 2.31923 7.67972 1.89583 6.99973 1.89583C6.31968 1.89583 5.7381 2.31923 5.50479 2.91666ZM5.83301 5.68749C6.07462 5.68749 6.27051 5.88338 6.27051 6.12499V9.47916C6.27051 9.72078 6.07462 9.91666 5.83301 9.91666C5.59139 9.91666 5.39551 9.72078 5.39551 9.47916V6.12499C5.39551 5.88338 5.59139 5.68749 5.83301 5.68749ZM8.16634 5.68749C8.40796 5.68749 8.60384 5.88338 8.60384 6.12499V9.47916C8.60384 9.72078 8.40796 9.91666 8.16634 9.91666C7.92472 9.91666 7.72884 9.72078 7.72884 9.47916V6.12499C7.72884 5.88338 7.92472 5.68749 8.16634 5.68749Z"
        fill="currentColor"
      />
    </svg>
  );
}
