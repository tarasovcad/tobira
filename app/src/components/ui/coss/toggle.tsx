"use client";

import {Toggle as TogglePrimitive} from "@base-ui/react/toggle";
import {cva, type VariantProps} from "class-variance-authority";

import {cn} from "@/lib/utils";

const toggleVariants = cva(
  "[&_svg]:-mx-0.5 relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium text-base text-foreground outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 data-pressed:bg-input/64 data-pressed:text-accent-foreground sm:text-sm [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 min-w-9 px-[calc(--spacing(2)-1px)] sm:h-8 sm:min-w-8",
        lg: "h-10 min-w-10 px-[calc(--spacing(2.5)-1px)] sm:h-9 sm:min-w-9",
        sm: "h-8 min-w-8 px-[calc(--spacing(1.5)-1px)] sm:h-7 sm:min-w-7",
      },
      variant: {
        default: "border-transparent",
        ai: [
          // Off (default) â†’ Hover (preview) â†’ On (data-pressed)
          "coss-ai-toggle group border-transparent",
          // OFF (matches your framer-motion "init" vibe)
          "bg-[radial-gradient(70%_90%_at_50%_100%,rgb(31,30,31)_0%,rgb(31,30,31)_100%)]",
          "outline outline-[7px] outline-[rgba(129,75,255,0)]",
          "shadow-none",
          // HOVER preview (no glow shadow)
          "hover:bg-[radial-gradient(70%_100%_at_50%_110%,#c48ffd_0%,rgb(100,35,230)_100%)]",
          "hover:outline-[rgba(150,95,255,0.2)]",
          "hover:shadow-[0_2px_0_0_rgb(140,72,255)_inset,0_-2px_0_0_rgb(110,30,255)_inset]",
          // ON (pressed)
          "data-pressed:bg-[radial-gradient(70%_100%_at_50%_110%,#c48ffd_0%,rgb(100,35,230)_100%)]",
          "data-pressed:outline-[rgba(150,95,255,0.24)]",
          "data-pressed:shadow-[0_2px_0_0_rgb(140,72,255)_inset,0_-2px_0_0_rgb(110,30,255)_inset]",
          // Keep tap feedback
          "transition-[transform,box-shadow,background,outline-color] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] will-change-transform",
          "active:translate-y-px",
          "hover:opacity-80 opacity-90",
        ].join(" "),
        outline:
          "border-input bg-background not-dark:bg-clip-padding shadow-xs/5 not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] dark:bg-input/32 dark:data-pressed:bg-input dark:hover:bg-input/64 dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] dark:not-disabled:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/2%)] [:disabled,:active,[data-pressed]]:shadow-none",
      },
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  children,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      className={cn(toggleVariants({className, size, variant}))}
      data-slot="toggle"
      {...props}>
      {variant === "ai" ? (
        <span
          aria-hidden
          className="coss-ai-toggle-highlightContainer pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] pt-[2px] opacity-0 transition-opacity duration-200">
          <span
            aria-hidden
            className="coss-ai-toggle-highlight absolute top-0 left-1/2 aspect-square w-[200%] rounded-[inherit]"
          />
        </span>
      ) : null}

      {variant === "ai" ? (
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {children}
        </span>
      ) : (
        children
      )}
    </TogglePrimitive>
  );
}

export {Toggle, toggleVariants};
