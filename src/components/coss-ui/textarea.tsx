"use client";

import {Field as FieldPrimitive} from "@base-ui/react/field";
import {mergeProps} from "@base-ui/react/merge-props";
import type * as React from "react";

import {cn} from "@/lib/utils/classnames";

type TextareaProps = React.ComponentProps<"textarea"> & {
  size?: "sm" | "default" | "lg" | number;
  unstyled?: boolean;
  error?: string;
};

function Textarea({className, size = "default", unstyled = false, error, ...props}: TextareaProps) {
  return (
    <>
      <span
        className={
          cn(
            !unstyled &&
              "border-input bg-background text-foreground ring-ring/24 has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-aria-invalid:border-destructive/36 has-focus-visible:border-ring dark:bg-input/32 dark:has-aria-invalid:ring-destructive/24 relative inline-flex w-full rounded-lg border text-base shadow-xs/5 transition-shadow not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:has-not-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/6%)] has-focus-visible:ring-[3px] has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none sm:text-sm dark:not-has-disabled:has-not-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)]",
            className,
          ) || undefined
        }
        data-size={size}
        data-slot="textarea-control">
        <FieldPrimitive.Control
          render={(defaultProps) => (
            <textarea
              className={cn(
                "field-sizing-content min-h-17.5 w-full rounded-[inherit] px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] outline-none max-sm:min-h-20.5",
                size === "sm" &&
                  "min-h-16.5 px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1)-1px)] max-sm:min-h-19.5",
                size === "lg" && "min-h-18.5 py-[calc(--spacing(2)-1px)] max-sm:min-h-21.5",
              )}
              data-slot="textarea"
              aria-invalid={!!error || props["aria-invalid"]}
              {...mergeProps(defaultProps, props)}
            />
          )}
        />
      </span>
      {error ? (
        <div className="text-destructive mt-1.5 flex items-center gap-1.5 text-sm" role="alert">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.99967 1.33333C11.6815 1.33333 14.6663 4.31809 14.6663 7.99999C14.6663 11.6819 11.6815 14.6667 7.99967 14.6667C4.31777 14.6667 1.33301 11.6819 1.33301 7.99999C1.33301 4.31809 4.31777 1.33333 7.99967 1.33333ZM7.99967 9.73306C7.55787 9.73306 7.19954 10.0914 7.19954 10.5332C7.19961 10.9749 7.55787 11.3333 7.99967 11.3333C8.44147 11.3333 8.79974 10.975 8.79981 10.5332C8.79981 10.0914 8.44147 9.73306 7.99967 9.73306ZM7.99967 4.66666C7.46867 4.66667 7.05821 5.13198 7.12401 5.65885L7.43781 8.17059C7.47327 8.45399 7.71407 8.66666 7.99967 8.66666C8.28527 8.66666 8.52607 8.45399 8.56154 8.17059L8.87601 5.65885C8.94174 5.13201 8.53061 4.66666 7.99967 4.66666Z"
              fill="currentColor"
            />
          </svg>
          {error}
        </div>
      ) : null}
    </>
  );
}

export {Textarea, type TextareaProps};
