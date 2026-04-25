"use client";

import {Button} from "@/components/ui/coss/button";
import {useHasMounted} from "@/lib/hooks/use-has-mounted";
import {cn} from "@/lib/utils";
import {motion} from "motion/react";
import NumberFlow from "@number-flow/react";
import {createPortal} from "react-dom";

export function SyncSelectionActionBar({
  visible,
  selectedCount,
  allSelected,
  onClearSelection,
  onSelectAll,
  onCopyLinks,
  onSave,
  onDismiss,
  className,
}: {
  visible: boolean;
  selectedCount: number;
  allSelected: boolean;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onCopyLinks?: () => void;
  onSave: () => void;
  onDismiss: () => void;
  className?: string;
}) {
  const hasMounted = useHasMounted();

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
        {/* Count + clear */}
        <div className="flex items-center gap-0.5">
          <span className="text-foreground flex items-center gap-1 pl-2 text-sm font-medium tabular-nums">
            <span className="min-w-[1ch] text-right">
              <NumberFlow value={selectedCount} />
            </span>
            selected
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onClearSelection}>
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

        {/* Select all / Deselect all */}
        <Button variant="outline" size="sm" onClick={onSelectAll}>
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

        {/* Copy */}
        {onCopyLinks && (
          <Button variant="outline" size="sm" onClick={onCopyLinks} className="w-[74px]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.8337 2.91667C12.8337 1.95018 12.0502 1.16667 11.0837 1.16667H6.41699C5.4505 1.16667 4.66699 1.95018 4.66699 2.91667V4.66667H2.91699C1.9505 4.66667 1.16699 5.45018 1.16699 6.41667V11.0833C1.16699 12.0499 1.9505 12.8333 2.91699 12.8333H7.58366C8.55018 12.8333 9.33366 12.0499 9.33366 11.0833V9.33334H11.0837C12.0502 9.33334 12.8337 8.54986 12.8337 7.58334V2.91667ZM9.33366 8.45834H11.0837C11.5669 8.45834 11.9587 8.06657 11.9587 7.58334V2.91667C11.9587 2.43342 11.5669 2.04167 11.0837 2.04167H6.41699C5.93376 2.04167 5.54199 2.43342 5.54199 2.91667V4.66667H7.58366C8.55018 4.66667 9.33366 5.45018 9.33366 6.41667V8.45834Z"
                fill="currentColor"
              />
            </svg>
            Copy
          </Button>
        )}

        {/* Dismiss */}
        <Button variant="destructive-outline" size="sm" onClick={onDismiss} className="w-[85px]">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7.00033 1.16667C3.77866 1.16667 1.16699 3.77834 1.16699 7.00001C1.16699 10.2217 3.77866 12.8333 7.00033 12.8333C10.222 12.8333 12.8337 10.2217 12.8337 7.00001C12.8337 3.77834 10.222 1.16667 7.00033 1.16667ZM9.02116 9.02084C8.85033 9.19167 8.57366 9.19167 8.40283 9.02084L7.00033 7.61834L5.59783 9.02084C5.427 9.19167 5.15033 9.19167 4.9795 9.02084C4.80866 8.85001 4.80866 8.57334 4.9795 8.40251L6.382 7.00001L4.9795 5.59751C4.80866 5.42667 4.80866 5.15001 4.9795 4.97917C5.15033 4.80834 5.427 4.80834 5.59783 4.97917L7.00033 6.38167L8.40283 4.97917C8.57366 4.80834 8.85033 4.80834 9.02116 4.97917C9.192 5.15001 9.192 5.42667 9.02116 5.59751L7.61866 7.00001L9.02116 8.40251C9.192 8.57334 9.192 8.84417 9.02116 9.02084Z"
              fill="currentColor"
            />
          </svg>
          Dismiss
        </Button>

        {/* Save to bookmarks */}
        <Button variant="default" size="sm" onClick={onSave} className="w-[74px]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5.33317 1.33334C3.86041 1.33334 2.6665 2.52725 2.6665 4.00001V13.3299C2.6665 14.4097 3.88307 15.0417 4.76654 14.4207L7.2331 12.6871C7.69317 12.3637 8.3065 12.3637 8.76657 12.6871L11.2331 14.4207C12.1166 15.0417 13.3332 14.4097 13.3332 13.3299V4.00001C13.3332 2.52725 12.1392 1.33334 10.6665 1.33334H5.33317Z"
              fill="currentColor"
            />
          </svg>
          Save
        </Button>
      </motion.div>
    </div>
  );

  if (!hasMounted) {
    return null;
  }

  return createPortal(content, document.body);
}
