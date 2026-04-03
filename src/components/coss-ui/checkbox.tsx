"use client";

import {Checkbox as CheckboxPrimitive} from "@base-ui/react/checkbox";
import {motion, type Variants} from "motion/react";

import {cn} from "@/lib/utils/classnames";

const CHECK_VARIANTS: Variants = {
  unchecked: {
    pathLength: 0,
    opacity: 0,
    transition: {duration: 0.075, opacity: {duration: 0.05}},
  },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: {duration: 0.125, delay: 0.025, opacity: {duration: 0.05}},
  },
};

const DASH_VARIANTS: Variants = {
  unchecked: {
    pathLength: 0,
    opacity: 0,
    transition: {duration: 0.075, opacity: {duration: 0.05}},
  },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: {duration: 0.1, opacity: {duration: 0.05}},
  },
};

function Checkbox({className, ...props}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "border-input bg-background focus-visible:ring-offset-background aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:ring-destructive/48 dark:not-data-checked:bg-input/32 dark:aria-invalid:ring-destructive/24 group relative inline-flex size-4.5 shrink-0 items-center justify-center rounded-[.25rem] border shadow-xs/5 ring-[#6B97FF] transition-shadow outline-none not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[3px] not-data-disabled:not-data-checked:not-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] focus-visible:ring-2 focus-visible:ring-offset-1 data-disabled:opacity-64 sm:size-4 dark:not-data-disabled:not-data-checked:not-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)] [[data-disabled],[data-checked],[aria-invalid]]:shadow-none",
        className,
      )}
      data-slot="checkbox"
      {...props}>
      <CheckboxPrimitive.Indicator
        className="absolute -inset-px flex items-center justify-center rounded-[.25rem] text-white transition-colors data-checked:bg-[#6B97FF] group-hover:data-checked:bg-[#5C89F2] data-indeterminate:bg-[#6B97FF] data-indeterminate:text-white group-hover:data-indeterminate:bg-[#5C89F2] data-unchecked:hidden"
        data-slot="checkbox-indicator"
        render={(props, state) => (
          <span {...props}>
            {state.indeterminate ? (
              <svg
                className="size-3.5 sm:size-3"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg">
                <motion.path
                  d="M5.252 12h13.496"
                  initial="unchecked"
                  animate="checked"
                  exit="unchecked"
                  variants={DASH_VARIANTS}
                />
              </svg>
            ) : (
              <svg
                className="size-3.5 sm:size-3"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg">
                <motion.path
                  d="M5.252 12.7 10.2 18.63 18.748 5.37"
                  initial="unchecked"
                  animate="checked"
                  exit="unchecked"
                  variants={CHECK_VARIANTS}
                />
              </svg>
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

export {Checkbox};
