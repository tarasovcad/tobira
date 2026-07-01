"use client";

import {memo, type CSSProperties} from "react";
import {cn} from "@/lib/utils";

const TRANSITION_STYLES = `
:root {
  --shimmer-dur: 2000ms;
  --shimmer-base: #7c7c7c;
  --shimmer-highlight: #0d0d0d;
  --shimmer-band: 400%;
  --shimmer-ease: linear;
}

.dark {
  --shimmer-base: #b0b0b0;
  --shimmer-highlight: #f2f2f2;
}

.t-shimmer {
  position: relative;
  display: inline-block;
  color: var(--shimmer-base);
}

.t-shimmer::before {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    transparent 40%,
    var(--shimmer-highlight) 50%,
    transparent 60%,
    transparent 100%
  );
  background-size: var(--shimmer-band) 100%;
  background-repeat: no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: t-shimmer var(--shimmer-dur) var(--shimmer-ease) infinite;
}

@keyframes t-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .t-shimmer::before { animation: none !important; }
}
`;

if (typeof document !== "undefined" && !document.getElementById("transitions-p15")) {
  const style = document.createElement("style");
  style.id = "transitions-p15";
  style.textContent = TRANSITION_STYLES;
  document.head.appendChild(style);
}

export type TextShimmerProps = {
  children: string;
  as?: "span" | "p" | "div";
  className?: string;
  duration?: number;
  spread?: number;
};

function TextShimmerComponent({
  children,
  as: Component = "span",
  className,
  duration,
  spread,
}: TextShimmerProps) {
  const style = {
    ...(duration ? {"--shimmer-dur": `${duration}s`} : null),
    ...(spread ? {"--shimmer-band": `${Math.max(spread, 1) * 100}%`} : null),
  } as CSSProperties;

  return (
    <Component className={cn("t-shimmer", className)} data-text={children} style={style}>
      {children}
    </Component>
  );
}

export const TextShimmer = memo(TextShimmerComponent);
