import * as React from "react";
import {cn} from "@/lib/utils";

export default function WebsiteBookmarkHoverActions({
  className,
  variant = "default",
  onOptions,
  onExpand,
}: {
  className?: string;
  variant?: "default" | "glass";
  onOptions?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onExpand?: (e: React.MouseEvent<HTMLButtonElement>) => void;
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
      {onExpand ? (
        <button
          type="button"
          aria-label="Preview"
          className={getButtonClassName(Boolean(onOptions))}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onExpand(e);
          }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.66667 2.66667C8.66667 2.29848 8.96513 2 9.33333 2H13.3333C13.7015 2 14 2.29848 14 2.66667V6.66667C14 7.03487 13.7015 7.33333 13.3333 7.33333C12.9651 7.33333 12.6667 7.03487 12.6667 6.66667V4.27614L9.80473 7.13807C9.5444 7.3984 9.12227 7.3984 8.86193 7.13807C8.6016 6.87773 8.6016 6.45561 8.86193 6.19526L11.7239 3.33333H9.33333C8.96513 3.33333 8.66667 3.03485 8.66667 2.66667ZM2.66667 8.66667C3.03485 8.66667 3.33333 8.96513 3.33333 9.33333V11.7239L6.19526 8.86193C6.45561 8.6016 6.87773 8.6016 7.13807 8.86193C7.3984 9.12227 7.3984 9.5444 7.13807 9.80473L4.27614 12.6667H6.66667C7.03487 12.6667 7.33333 12.9651 7.33333 13.3333C7.33333 13.7015 7.03487 14 6.66667 14H2.66667C2.29848 14 2 13.7015 2 13.3333V9.33333C2 8.96513 2.29848 8.66667 2.66667 8.66667Z"
              fill="currentColor"
            />
          </svg>
        </button>
      ) : null}
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
