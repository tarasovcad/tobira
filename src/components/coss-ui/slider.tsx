"use client";

import {Slider as SliderPrimitive} from "@base-ui/react/slider";
import {cn} from "@/lib/utils";

function Slider({className, ...props}: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none items-center py-4 select-none", className)}
      {...props}>
      <SliderPrimitive.Track className="bg-muted border-border relative h-1.5 w-full grow overflow-hidden rounded-full border">
        <SliderPrimitive.Indicator className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "bg-background ring-offset-background focus-visible:ring-ring border-primary/50 block h-4 w-4 rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        )}
      />
    </SliderPrimitive.Root>
  );
}

export {Slider};
