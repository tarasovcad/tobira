import * as React from "react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/coss/button";

export default function MediaBookmarkHoverAction({
  className,
  variant = "default",
  onExpand,
  onOptions,
  onSave,
  onDismiss,
}: {
  className?: string;
  variant?: "default" | "glass";
  onExpand?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onOptions?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete?: () => void;
  onSave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDismiss?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const stopNav = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

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
        "group-data-[selection-mode=true]/bookmark-row:!pointer-events-none group-data-[selection-mode=true]/bookmark-row:!opacity-0",
        className,
      )}>
      {/* <button
        type="button"
        aria-label="Delete"
        className={getButtonClassName(true)}
        onClick={(e) => {
          stopNav(e);
          onDelete?.();
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
            d="M5.24552 3.33317H2.1665C1.89036 3.33317 1.6665 3.55703 1.6665 3.83317C1.6665 4.10931 1.89036 4.33317 2.1665 4.33317H2.66648C2.6665 4.34477 2.66691 4.35645 2.66773 4.36819L3.22761 12.3416C3.31956 13.6512 4.40871 14.6665 5.72147 14.6665H10.2782C11.591 14.6665 12.6801 13.6512 12.772 12.3416L13.332 4.36819C13.3328 4.35645 13.3332 4.34477 13.3332 4.33317H13.8332C14.1093 4.33317 14.3332 4.10931 14.3332 3.83317C14.3332 3.55703 14.1093 3.33317 13.8332 3.33317H10.7542C10.4542 2.08988 9.33524 1.1665 7.9999 1.1665C6.66455 1.1665 5.5455 2.08988 5.24552 3.33317ZM6.2914 3.33317H9.70837C9.4417 2.65039 8.77704 2.1665 7.9999 2.1665C7.2227 2.1665 6.55804 2.65039 6.2914 3.33317ZM6.6665 6.49984C6.94264 6.49984 7.1665 6.7237 7.1665 6.99984V10.8332C7.1665 11.1093 6.94264 11.3332 6.6665 11.3332C6.39036 11.3332 6.1665 11.1093 6.1665 10.8332V6.99984C6.1665 6.7237 6.39036 6.49984 6.6665 6.49984ZM9.33317 6.49984C9.6093 6.49984 9.83317 6.7237 9.83317 6.99984V10.8332C9.83317 11.1093 9.6093 11.3332 9.33317 11.3332C9.05704 11.3332 8.83317 11.1093 8.83317 10.8332V6.99984C8.83317 6.7237 9.05704 6.49984 9.33317 6.49984Z"
            fill="currentColor"
          />
        </svg>
      </button> */}
      {onExpand ? (
        <button
          type="button"
          aria-label="Preview"
          className={getButtonClassName(Boolean(onOptions))}
          onClick={(e) => {
            stopNav(e);
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
      {onDismiss ? (
        <Button
          type="button"
          aria-label="Dismiss"
          variant="outline"
          size="icon"
          onClick={(e) => {
            stopNav(e);
            onDismiss(e);
          }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7.00033 1.16667C3.77866 1.16667 1.16699 3.77834 1.16699 7.00001C1.16699 10.2217 3.77866 12.8333 7.00033 12.8333C10.222 12.8333 12.8337 10.2217 12.8337 7.00001C12.8337 3.77834 10.222 1.16667 7.00033 1.16667ZM9.02116 9.02084C8.85033 9.19167 8.57366 9.19167 8.40283 9.02084L7.00033 7.61834L5.59783 9.02084C5.427 9.19167 5.15033 9.19167 4.9795 9.02084C4.80866 8.85001 4.80866 8.57334 4.9795 8.40251L6.382 7.00001L4.9795 5.59751C4.80866 5.42667 4.80866 5.15001 4.9795 4.97917C5.15033 4.80834 5.427 4.80834 5.59783 4.97917L7.00033 6.38167L8.40283 4.97917C8.57366 4.80834 8.85033 4.80834 9.02116 4.97917C9.192 5.15001 9.192 5.42667 9.02116 5.59751L7.61866 7.00001L9.02116 8.40251C9.192 8.57334 9.192 8.84417 9.02116 9.02084Z"
              fill="currentColor"
            />
          </svg>
        </Button>
      ) : null}
      {onSave ? (
        <Button
          type="button"
          aria-label="Save to bookmarks"
          variant="outline"
          size="icon"
          onClick={(e) => {
            stopNav(e);
            onSave(e);
          }}>
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
        </Button>
      ) : null}
      {onOptions ? (
        <button
          type="button"
          aria-label="Options"
          className={getButtonClassName(false)}
          onClick={(e) => {
            stopNav(e);
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
