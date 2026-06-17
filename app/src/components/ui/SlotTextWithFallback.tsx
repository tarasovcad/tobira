"use client";

import {useState} from "react";
import {SlotText} from "@/components/ui/slot-text";
import {cn} from "@/lib/utils";

export function SlotTextWithFallback({text}: {text: string}) {
  const [isReady, setIsReady] = useState(false);

  return (
    <span className="relative inline-block tabular-nums">
      <span
        aria-hidden={isReady}
        className={cn("inline-block leading-[inherit]", isReady && "invisible")}>
        {text}
      </span>
      <SlotText
        aria-hidden={!isReady}
        className={cn(
          "absolute inset-0 inline-flex leading-[inherit] [&_.char-face]:block [&_.char-face]:text-center [&_.char-face]:leading-[inherit] [&_.char-slot]:leading-[inherit]",
          !isReady && "invisible",
        )}
        onReady={() => setIsReady(true)}
        text={text}
      />
    </span>
  );
}
