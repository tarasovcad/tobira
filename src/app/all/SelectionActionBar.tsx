"use client";

import {Button} from "@/components/coss-ui/button";
import {cn} from "@/lib/utils";
import {motion} from "motion/react";
import NumberFlow from "@number-flow/react";

export function SelectionActionBar({
  visible,
  selectedCount,
  allSelected,
  onClearSelection,
  onSelectAll,
  onCopy,
  onArchive,
  onDelete,
  displayArchive = true,
  displayFavorite = true,
  displayCopy = true,
}: {
  visible: boolean;
  selectedCount: number;
  allSelected: boolean;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onCopy?: () => void;
  onArchive?: () => void;
  onDelete: () => void;
  displayArchive?: boolean;
  displayFavorite?: boolean;
  displayCopy?: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center transition-all duration-200 ease-out",
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-3 opacity-0",
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
        {displayCopy && (
          <Button variant="outline" size="sm" onClick={onCopy} className="w-[74px]">
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
        {displayArchive && (
          <Button variant="outline" size="sm" onClick={onArchive} className="w-[85px]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1.83301 2C1.55687 2 1.33301 2.22386 1.33301 2.5V4.16667C1.33301 4.44281 1.55687 4.66667 1.83301 4.66667H14.1663C14.4425 4.66667 14.6663 4.44281 14.6663 4.16667V2.5C14.6663 2.22386 14.4425 2 14.1663 2H1.83301Z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14 5.66667H2V10.3214C1.99999 10.8633 1.99999 11.3004 2.02891 11.6543C2.05869 12.0187 2.12159 12.3388 2.27249 12.635C2.51217 13.1054 2.89462 13.4879 3.36503 13.7275C3.66117 13.8784 3.98127 13.9413 4.34569 13.9711C4.69963 14 5.1367 14 5.67859 14H10.3214C10.8633 14 11.3004 14 11.6543 13.9711C12.0187 13.9413 12.3388 13.8784 12.635 13.7275C13.1054 13.4879 13.4879 13.1054 13.7275 12.635C13.8784 12.3388 13.9413 12.0187 13.9711 11.6543C14 11.3004 14 10.8633 14 10.3214V5.66667ZM6.16667 7.83334C6.16667 7.5572 6.39053 7.33334 6.66667 7.33334H9.33333C9.60947 7.33334 9.83333 7.5572 9.83333 7.83334C9.83333 8.10947 9.60947 8.33334 9.33333 8.33334H6.66667C6.39053 8.33334 6.16667 8.10947 6.16667 7.83334Z"
                fill="currentColor"
              />
            </svg>
            Archive
          </Button>
        )}
        {displayFavorite && (
          <Button variant="favorite" size="sm" disabled className="w-[92px]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7.92731 1.16523C7.55404 0.38936 6.44565 0.38936 6.07237 1.16523L4.80475 3.79976C4.78289 3.8452 4.73866 3.87784 4.68609 3.88471L1.77038 4.26589C0.914823 4.37774 0.565005 5.4319 1.19782 6.02764L3.32885 8.03389C3.36632 8.06919 3.38257 8.12005 3.37342 8.16905L2.83816 11.0358C2.67886 11.889 3.58283 12.532 4.33822 12.1255L6.92579 10.7327C6.97187 10.7078 7.02781 10.7078 7.0739 10.7327L9.66145 12.1255C10.4169 12.532 11.3209 11.889 11.1615 11.0358L10.6263 8.16905C10.6171 8.12005 10.6334 8.06919 10.6708 8.03389L12.8019 6.02764C13.4347 5.4319 13.0849 4.37774 12.2293 4.26589L9.3136 3.88471C9.26105 3.87784 9.21683 3.8452 9.19495 3.79976L7.92731 1.16523Z"
                fill="currentColor"
              />
            </svg>
            Favorite
          </Button>
        )}

        <Button variant="destructive" size="sm" className="w-[81px]" onClick={onDelete}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.58965 2.91666H1.89551C1.65389 2.91666 1.45801 3.11254 1.45801 3.35416C1.45801 3.59578 1.65389 3.79166 1.89551 3.79166H2.33299C2.333 3.80181 2.33336 3.81203 2.33408 3.8223L2.82398 10.7991C2.90444 11.9449 3.85744 12.8333 5.0061 12.8333H8.99327C10.1419 12.8333 11.0949 11.9449 11.1753 10.7991L11.6653 3.8223C11.666 3.81203 11.6663 3.80181 11.6663 3.79166H12.1038C12.3455 3.79166 12.5413 3.59578 12.5413 3.35416C12.5413 3.11254 12.3455 2.91666 12.1038 2.91666H9.40977C9.14727 1.82879 8.16815 1.02083 6.99973 1.02083C5.8313 1.02083 4.85213 1.82879 4.58965 2.91666ZM5.50479 2.91666H8.49464C8.26131 2.31923 7.67972 1.89583 6.99973 1.89583C6.31968 1.89583 5.7381 2.31923 5.50479 2.91666ZM5.83301 5.68749C6.07462 5.68749 6.27051 5.88338 6.27051 6.12499V9.47916C6.27051 9.72078 6.07462 9.91666 5.83301 9.91666C5.59139 9.91666 5.39551 9.72078 5.39551 9.47916V6.12499C5.39551 5.88338 5.59139 5.68749 5.83301 5.68749ZM8.16634 5.68749C8.40796 5.68749 8.60384 5.88338 8.60384 6.12499V9.47916C8.60384 9.72078 8.40796 9.91666 8.16634 9.91666C7.92472 9.91666 7.72884 9.72078 7.72884 9.47916V6.12499C7.72884 5.88338 7.92472 5.68749 8.16634 5.68749Z"
              fill="currentColor"
            />
          </svg>
          Delete
        </Button>
      </motion.div>
    </div>
  );
}
