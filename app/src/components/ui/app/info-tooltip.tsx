"use client";

import type {ReactNode} from "react";

import {Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger} from "@/components/ui/coss/tooltip";
import {cn} from "@/lib/utils";

type InfoTooltipProps = {
  children: ReactNode;
  label?: string;
  className?: string;
  popupClassName?: string;
  sideOffset?: number;
};

export function InfoTooltip({
  children,
  label = "More information",
  className,
  popupClassName,
  sideOffset = 6,
}: InfoTooltipProps) {
  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              aria-label={label}
              className={cn(
                "text-muted-foreground focus-visible:ring-ring inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-sm outline-none focus-visible:ring-2",
                className,
              )}
              tabIndex={0}
            />
          }>
          <InfoIcon />
        </TooltipTrigger>
        <TooltipPopup
          sideOffset={sideOffset}
          size="md"
          className={cn("shadow-none!", popupClassName)}>
          {children}
        </TooltipPopup>
      </Tooltip>
    </TooltipProvider>
  );
}

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.00016 1.33334C4.31826 1.33334 1.3335 4.3181 1.3335 8C1.3335 11.6819 4.31826 14.6667 8.00016 14.6667C11.682 14.6667 14.6668 11.6819 14.6668 8C14.6668 4.3181 11.682 1.33334 8.00016 1.33334ZM6.66683 7.33334C6.66683 7.0572 6.8907 6.83334 7.16683 6.83334H8.00016C8.2763 6.83334 8.50016 7.0572 8.50016 7.33334V10.8333C8.50016 11.1095 8.2763 11.3333 8.00016 11.3333C7.72403 11.3333 7.50016 11.1095 7.50016 10.8333V7.83334H7.16683C6.8907 7.83334 6.66683 7.60947 6.66683 7.33334ZM8.00016 4.83334C7.72403 4.83334 7.50016 5.0572 7.50016 5.33334C7.50016 5.60948 7.72403 5.83334 8.00016 5.83334C8.2763 5.83334 8.50016 5.60948 8.50016 5.33334C8.50016 5.0572 8.2763 4.83334 8.00016 4.83334Z"
        fill="var(--muted-foreground)"
      />
    </svg>
  );
}
