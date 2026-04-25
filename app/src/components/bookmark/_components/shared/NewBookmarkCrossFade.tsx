import {ReactNode} from "react";
import {cn} from "@/lib/utils";
import {CROSS_FADE_DURATION_MS} from "@/components/bookmark/_hooks/use-placeholder-transition";

export default function CrossFade({
  loaded,
  delay = 0,
  skeleton,
  children,
  className,
  fill = false,
}: {
  loaded: boolean;
  delay?: number;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
  fill?: boolean;
}) {
  if (fill) {
    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "absolute inset-0 transition-all",
            loaded ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          style={{
            transitionDelay: `${delay}ms`,
            transitionDuration: `${CROSS_FADE_DURATION_MS}ms`,
          }}>
          {skeleton}
        </div>
        <div
          className={cn(
            "absolute inset-0 transition-all",
            loaded ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          style={{
            transitionDelay: `${delay}ms`,
            transitionDuration: `${CROSS_FADE_DURATION_MS}ms`,
          }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("grid min-w-0 grid-cols-1 items-start *:col-start-1 *:row-start-1", className)}>
      <div
        className={cn(
          "w-full min-w-0 transition-all",
          loaded ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        style={{transitionDelay: `${delay}ms`, transitionDuration: `${CROSS_FADE_DURATION_MS}ms`}}>
        {skeleton}
      </div>
      <div
        className={cn(
          "w-full min-w-0 transition-all",
          loaded ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{transitionDelay: `${delay}ms`, transitionDuration: `${CROSS_FADE_DURATION_MS}ms`}}>
        {children}
      </div>
    </div>
  );
}
