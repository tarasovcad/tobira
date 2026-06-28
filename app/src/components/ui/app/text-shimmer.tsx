"use client";

import {memo, type CSSProperties} from "react";
import {motion} from "motion/react";
import {cn} from "@/lib/utils";

export type TextShimmerProps = {
  children: string;
  as?: "span" | "p" | "div";
  className?: string;
  duration?: number;
  spread?: number;
};

const motionComponents = {
  span: motion.span,
  p: motion.p,
  div: motion.div,
};

function TextShimmerComponent({
  children,
  as: Component = "span",
  className,
  duration = 1.5,
  spread = 3,
}: TextShimmerProps) {
  const MotionComponent = motionComponents[Component];
  const dynamicSpread = children.length * spread;

  return (
    <MotionComponent
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
        "[--base-color:var(--foreground)] [--base-gradient-color:#878787]",
        "[background-repeat:no-repeat,padding-box] [--bg:linear-gradient(90deg,#0000_calc(50%_-_var(--spread)),var(--base-gradient-color),#0000_calc(50%_+_var(--spread)))]",
        "dark:[--base-gradient-color:#8C8C8C]",
        className,
      )}
      initial={{backgroundPosition: "100% center"}}
      animate={{backgroundPosition: "0% center"}}
      transition={{repeat: Infinity, duration, ease: "linear"}}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundImage: "var(--bg), linear-gradient(var(--base-color), var(--base-color))",
        } as CSSProperties
      }>
      {children}
    </MotionComponent>
  );
}

export const TextShimmer = memo(TextShimmerComponent);
