"use client";

import {ScrollArea as ScrollAreaPrimitive} from "@base-ui/react/scroll-area";

import {cn} from "@/lib/utils/classnames";

function ScrollArea({
  className,
  children,
  scrollFade = false,
  scrollFadeTop,
  scrollFadeBottom,
  scrollFadeLeft,
  scrollFadeRight,
  scrollbarGutter = false,
  hideScrollbar = false,
  hideFocusRing = false,
  viewportProps,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  scrollFade?: boolean;
  scrollFadeTop?: boolean;
  scrollFadeBottom?: boolean;
  scrollFadeLeft?: boolean;
  scrollFadeRight?: boolean;
  scrollbarGutter?: boolean;
  hideScrollbar?: boolean;
  hideFocusRing?: boolean;
  viewportProps?: React.ComponentProps<typeof ScrollAreaPrimitive.Viewport>;
}) {
  const fadeTop = scrollFadeTop ?? scrollFade;
  const fadeBottom = scrollFadeBottom ?? scrollFade;
  const fadeLeft = scrollFadeLeft ?? scrollFade;
  const fadeRight = scrollFadeRight ?? scrollFade;

  return (
    <ScrollAreaPrimitive.Root className={cn("size-full min-h-0", className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        {...viewportProps}
        className={cn(
          "transition-shadows h-full rounded-[inherit] outline-none data-has-overflow-x:overscroll-x-contain",
          !hideFocusRing &&
            "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-1",
          hideScrollbar && "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          (fadeTop || fadeBottom || fadeLeft || fadeRight) && "[--fade-size:1.5rem]",
          fadeTop &&
            "mask-t-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-start)))]",
          fadeBottom &&
            "mask-b-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-end)))]",
          fadeLeft &&
            "mask-l-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-start)))]",
          fadeRight &&
            "mask-r-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-end)))]",
          scrollbarGutter && "data-has-overflow-x:pb-2.5 data-has-overflow-y:pe-2.5",
          viewportProps?.className,
        )}
        data-slot="scroll-area-viewport">
        {children}
      </ScrollAreaPrimitive.Viewport>
      {!hideScrollbar && (
        <>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
        </>
      )}
      <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      className={cn(
        "z-50 m-1 flex opacity-0 transition-opacity delay-300 data-hovering:opacity-100 data-hovering:delay-0 data-hovering:duration-100 data-scrolling:opacity-100 data-scrolling:delay-0 data-scrolling:duration-100 data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:w-1.5",
        className,
      )}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}>
      <ScrollAreaPrimitive.Thumb
        className="bg-foreground/20 relative flex-1 rounded-full"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export {ScrollArea, ScrollBar};
