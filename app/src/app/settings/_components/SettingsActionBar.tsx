"use client";

import {Button} from "@/components/ui/coss/button";
import {cn} from "@/lib/utils";
import {motion} from "motion/react";
import NumberFlow from "@number-flow/react";
import Spinner from "@/components/ui/app/spinner";

interface SettingsActionBarProps {
  visible: boolean;
  changedCount: number;
  onUpdate: () => void;
  onCancel: () => void;
  isUpdating?: boolean;
}

export function SettingsActionBar({
  visible,
  changedCount,
  onUpdate,
  onCancel,
  isUpdating = false,
}: SettingsActionBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center transition-all duration-200 ease-out",
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        "mx-auto w-fit",
      )}>
      <motion.div
        layout
        transition={{layout: {duration: 0.15, ease: "easeOut"}}}
        className="bg-background/90 ring-border flex items-center gap-6 rounded-xl p-1.5 shadow-lg ring-1 backdrop-blur">
        <div className="flex items-center gap-0.5">
          <span className="text-foreground flex items-center gap-1 pl-2 text-sm font-medium tabular-nums">
            You&apos;ve changed
            <span className="min-w-[1ch] text-right">
              <NumberFlow value={changedCount} />
            </span>
            {changedCount === 1 ? "field" : "fields"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={onUpdate} disabled={isUpdating}>
            {isUpdating && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
            Update Settings
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
