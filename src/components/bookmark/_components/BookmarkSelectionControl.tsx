"use client";

import * as React from "react";
import {Checkbox} from "@/components/coss-ui/checkbox";
import {cn} from "@/lib/utils/classnames";

const selectionModeCheckboxClass =
  "group-data-[selection-mode=true]/bookmark-row:grid-cols-[1fr] group-data-[selection-mode=true]/bookmark-row:opacity-100";

const selectionModeOverlayClass =
  "group-data-[selection-mode=true]/bookmark-row:scale-100 group-data-[selection-mode=true]/bookmark-row:opacity-100";

interface BookmarkSelectionControlProps {
  itemId: string;
  title: string;
  checked: boolean;
  selectionIndex: number;
  onCheckedChange?: (id: string, checked: boolean) => void;
  variant?: "inline" | "overlay";
  className?: string;
  innerClassName?: string;
  paddingClassName?: string;
  maxDelayMs?: number;
  delayStepMs?: number;
}

function BookmarkSelectionControlImpl({
  itemId,
  title,
  checked,
  selectionIndex,
  onCheckedChange,
  variant = "inline",
  className,
  innerClassName,
  paddingClassName,
  maxDelayMs = 120,
  delayStepMs = 20,
}: BookmarkSelectionControlProps) {
  const delay = Math.min(selectionIndex * delayStepMs, maxDelayMs);

  if (variant === "overlay") {
    return (
      <div
        className={cn(
          "pointer-events-none absolute top-2 left-2 z-20 scale-90 opacity-0",
          selectionModeOverlayClass,
          className,
        )}
        style={{transitionDelay: `${delay}ms`}}>
        <Checkbox
          checked={checked}
          onCheckedChange={(next) => onCheckedChange?.(itemId, next === true)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${title}`}
          className={cn("focus-visible:ring-0 focus-visible:ring-offset-0", innerClassName)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid shrink-0 grid-cols-[0fr] items-center opacity-0 transition-[grid-template-columns,opacity] duration-200 ease-out",
        selectionModeCheckboxClass,
        className,
      )}
      style={{transitionDelay: `${delay}ms`}}>
      <div className="min-w-0 overflow-hidden">
        <div className={paddingClassName}>
          <Checkbox
            checked={checked}
            onCheckedChange={(next) => onCheckedChange?.(itemId, next === true)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${title}`}
            className={cn("focus-visible:ring-0 focus-visible:ring-offset-0", innerClassName)}
          />
        </div>
      </div>
    </div>
  );
}

export const BookmarkSelectionControl = React.memo(BookmarkSelectionControlImpl);
