"use client";

import * as React from "react";

type ExitPhase = "idle" | "flash" | "exit" | "collapse" | "done";
type RemovalKind = "delete" | "archive";

const EXIT_TIMING = {flash: 120, exit: {list: 400, grid: 500}, collapse: 300} as const;

const EXIT_STYLES: Record<
  RemovalKind,
  Record<"list" | "grid", Record<"flash" | "exit", React.CSSProperties>>
> = {
  delete: {
    list: {
      flash: {
        background: "linear-gradient(90deg, rgba(239,68,68,.08), rgba(239,68,68,.02))",
        boxShadow: "inset 4px 0 0 0 rgba(239,68,68,.6)",
        transition: "all 120ms ease-out",
      },
      exit: {
        transform: "translateX(80px) scale(.96) rotate(1.5deg)",
        opacity: 0,
        filter: "blur(6px)",
        transition:
          "transform 400ms cubic-bezier(.36,0,.66,-.2), opacity 300ms ease-out, filter 400ms ease-out",
      },
    },
    grid: {
      flash: {
        boxShadow: "0 0 0 2px rgba(239,68,68,.5), 0 0 24px rgba(239,68,68,.15)",
        transition: "all 120ms ease-out",
        borderRadius: "inherit",
      },
      exit: {
        transform: "perspective(600px) rotateX(25deg) scale(.4)",
        opacity: 0,
        filter: "blur(10px)",
        transformOrigin: "center bottom",
        transition:
          "transform 500ms cubic-bezier(.36,0,.66,-.2), opacity 400ms ease-out, filter 500ms ease-out",
      },
    },
  },
  archive: {
    list: {
      flash: {
        background: "linear-gradient(90deg, rgba(0,0,0,.06), rgba(0,0,0,.02))",
        boxShadow: "inset 4px 0 0 0 rgba(0,0,0,.35)",
        transition: "all 120ms ease-out",
      },
      exit: {
        transform: "translateX(80px) scale(.96) rotate(1.5deg)",
        opacity: 0,
        filter: "blur(6px)",
        transition:
          "transform 400ms cubic-bezier(.36,0,.66,-.2), opacity 300ms ease-out, filter 400ms ease-out",
      },
    },
    grid: {
      flash: {
        boxShadow: "0 0 0 2px rgba(0,0,0,.3), 0 0 24px rgba(0,0,0,.08)",
        transition: "all 120ms ease-out",
        borderRadius: "inherit",
      },
      exit: {
        transform: "perspective(600px) rotateX(25deg) scale(.4)",
        opacity: 0,
        filter: "blur(10px)",
        transformOrigin: "center bottom",
        transition:
          "transform 500ms cubic-bezier(.36,0,.66,-.2), opacity 400ms ease-out, filter 500ms ease-out",
      },
    },
  },
};

const COLLAPSE_STYLE: React.CSSProperties = {
  overflow: "hidden",
  transition: "height 300ms cubic-bezier(.22,1,.36,1)",
};

export function AnimatedItem({
  id,
  isRemoving,
  onRemoved,
  variant,
  kind = "delete",
  className,
  children,
}: {
  id: string;
  isRemoving: boolean;
  onRemoved: (id: string) => void;
  variant: "list" | "grid";
  kind?: RemovalKind;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const cbRef = React.useRef(onRemoved);
  const [phase, setPhase] = React.useState<ExitPhase>("idle");
  const [activeKind, setActiveKind] = React.useState<RemovalKind>(kind);

  React.useEffect(() => {
    cbRef.current = onRemoved;
  });

  // Capture the kind at the moment removal starts
  React.useEffect(() => {
    if (isRemoving && phase === "idle") {
      setActiveKind(kind);
      setPhase("flash");
    }
  }, [isRemoving, phase, kind]);

  // Phase state-machine: flash → exit → collapse (list) | done (grid)
  React.useEffect(() => {
    let ms: number;
    let next: ExitPhase;

    switch (phase) {
      case "flash":
        ms = EXIT_TIMING.flash;
        next = "exit";
        break;
      case "exit":
        ms = variant === "list" ? EXIT_TIMING.exit.list : EXIT_TIMING.exit.grid;
        next = variant === "list" ? "collapse" : "done";
        break;
      case "collapse": {
        const el = ref.current;
        if (el) {
          el.style.height = `${el.offsetHeight}px`;
          void el.offsetHeight;
          requestAnimationFrame(() => (el.style.height = "0px"));
        }
        ms = EXIT_TIMING.collapse;
        next = "done";
        break;
      }
      default:
        return;
    }

    const t = setTimeout(() => {
      setPhase(next);
      if (next === "done") cbRef.current(id);
    }, ms);

    return () => clearTimeout(t);
  }, [phase, id, variant]);

  if (phase === "done") return null;

  const styles = EXIT_STYLES[activeKind][variant];
  const isExiting = phase === "exit" || phase === "collapse";
  const contentStyle = phase === "flash" ? styles.flash : isExiting ? styles.exit : undefined;
  const isGrid = variant === "grid";

  return (
    <div ref={ref} className={className} style={phase === "collapse" ? COLLAPSE_STYLE : undefined}>
      <div className={isGrid ? "flex min-h-0 flex-1 flex-col" : undefined} style={contentStyle}>
        {children}
      </div>
    </div>
  );
}
