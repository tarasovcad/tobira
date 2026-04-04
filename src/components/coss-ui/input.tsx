"use client";

import {Input as InputPrimitive} from "@base-ui/react/input";
import type * as React from "react";

import {cn} from "@/lib/utils/classnames";

type InputProps = Omit<InputPrimitive.Props & React.RefAttributes<HTMLInputElement>, "size"> & {
  size?: "sm" | "default" | "lg" | number;
  unstyled?: boolean;
  nativeInput?: boolean;
  error?: string;
};

function Input({
  className,
  size = "default",
  unstyled = false,
  nativeInput = false,
  error,
  ...props
}: InputProps) {
  const inputClassName = cn(
    "h-8.5 w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] leading-8.5 outline-none placeholder:text-muted-foreground/72 sm:h-7.5 sm:leading-7.5",
    size === "sm" && "h-7.5 px-[calc(--spacing(2.5)-1px)] leading-7.5 sm:h-6.5 sm:leading-6.5",
    size === "lg" && "h-9.5 leading-9.5 sm:h-8.5 sm:leading-8.5",
    props.type === "search" &&
      "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
    props.type === "file" &&
      "text-muted-foreground file:me-3 file:bg-transparent file:font-medium file:text-foreground file:text-sm",
  );

  return (
    <>
      <span
        className={
          cn(
            !unstyled &&
              "border-input bg-background text-foreground ring-ring/24 has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-aria-invalid:border-destructive/36 has-focus-visible:border-ring dark:bg-input/32 dark:has-aria-invalid:ring-destructive/24 relative inline-flex w-full rounded-lg border text-base shadow-xs/5 transition-shadow not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/6%)] has-focus-visible:ring-[3px] has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none sm:text-sm dark:not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)]",
            className,
          ) || undefined
        }
        data-size={size}
        data-slot="input-control">
        {nativeInput ? (
          <input
            className={inputClassName}
            data-slot="input"
            aria-invalid={!!error || props["aria-invalid"]}
            size={typeof size === "number" ? size : undefined}
            {...props}
          />
        ) : (
          <InputPrimitive
            className={inputClassName}
            data-slot="input"
            aria-invalid={!!error || props["aria-invalid"]}
            size={typeof size === "number" ? size : undefined}
            {...props}
          />
        )}
      </span>
      {error ? (
        <div className="text-destructive flex items-center gap-1.5 text-sm" role="alert">
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

export {Input, type InputProps};
