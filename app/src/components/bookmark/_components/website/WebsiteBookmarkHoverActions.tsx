import * as React from "react";
import {cn} from "@/lib/utils";

export default function WebsiteBookmarkHoverActions({
  className,
  variant = "default",
  onOptions,
}: {
  className?: string;
  variant?: "default" | "glass";
  onOptions?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const getButtonClassName = (hasRightBorder?: boolean) => {
    if (variant === "glass") {
      return cn(
        "pointer-events-auto flex size-8 cursor-pointer items-center justify-center text-white/90 transition-colors hover:bg-white/8",
        "outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0",
        hasRightBorder && "border-r border-white/15",
      );
    }
    return cn(
      "pointer-events-auto inline-flex size-8 items-center justify-center rounded-md border",
      "bg-background text-foreground/90",
      "hover:bg-muted cursor-pointer",
      "outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0",
    );
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-2 right-2 z-10 flex items-center",
        variant === "glass"
          ? "overflow-hidden rounded-md border border-white/10 bg-black/40 shadow-xl backdrop-blur-md"
          : "gap-1",
        "opacity-0",
        "group-hover:pointer-events-auto group-hover:opacity-100",
        "group-focus-visible:pointer-events-auto group-focus-visible:opacity-100",
        "group-data-[selection-mode=true]/bookmark-row:pointer-events-none! group-data-[selection-mode=true]/bookmark-row:opacity-0!",
        className,
      )}>
      {onOptions ? (
        <button
          type="button"
          aria-label="Options"
          className={getButtonClassName(false)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOptions(e);
          }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2.50016 6.8335C1.85583 6.8335 1.3335 7.35583 1.3335 8.00016C1.3335 8.6445 1.85583 9.16683 2.50016 9.16683C3.1445 9.16683 3.66683 8.6445 3.66683 8.00016C3.66683 7.35583 3.1445 6.8335 2.50016 6.8335Z"
              fill="currentColor"
            />
            <path
              d="M8.00016 6.8335C7.35583 6.8335 6.8335 7.35583 6.8335 8.00016C6.8335 8.6445 7.35583 9.16683 8.00016 9.16683C8.6445 9.16683 9.16683 8.6445 9.16683 8.00016C9.16683 7.35583 8.6445 6.8335 8.00016 6.8335Z"
              fill="currentColor"
            />
            <path
              d="M13.5002 6.8335C12.8558 6.8335 12.3335 7.35583 12.3335 8.00016C12.3335 8.6445 12.8558 9.16683 13.5002 9.16683C14.1445 9.16683 14.6668 8.6445 14.6668 8.00016C14.6668 7.35583 14.1445 6.8335 13.5002 6.8335Z"
              fill="currentColor"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
