"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import type {WebsiteBookmark} from "@/components/bookmark/types";
import {useFloatingHoverTooltip} from "@/lib/hooks/use-floating-hover-tooltip";
import WebsiteBookmarkCompactHoverPreviewContent, {
  hasWebsiteBookmarkPreviewImage,
} from "@/components/bookmark/_components/website/WebsiteBookmarkCompactHoverPreview";
import {cn} from "@/lib/utils";
import {
  getCompactPreviewWidthClass,
  getCompactPreviewWidthPx,
  useViewOptionsStore,
} from "@/store/use-view-options";

type TriggerProps = {
  onMouseEnter: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
};

type WebsiteBookmarkCompactHoverPreviewContextValue = {
  getTriggerProps: (item: WebsiteBookmark) => TriggerProps;
};

const WebsiteBookmarkCompactHoverPreviewContext =
  createContext<WebsiteBookmarkCompactHoverPreviewContextValue | null>(null);

const noopTriggerProps: TriggerProps = {
  onMouseEnter: () => {},
  onMouseLeave: () => {},
  onFocus: () => {},
  onBlur: () => {},
};

export function useWebsiteBookmarkCompactHoverPreviewTrigger(item: WebsiteBookmark) {
  const context = useContext(WebsiteBookmarkCompactHoverPreviewContext);

  return useMemo(() => context?.getTriggerProps(item) ?? noopTriggerProps, [context, item]);
}

export function WebsiteBookmarkCompactHoverPreviewProvider({
  children,
  enabled = true,
  selectionMode = false,
}: {
  children: ReactNode;
  enabled?: boolean;
  selectionMode?: boolean;
}) {
  const [activeItem, setActiveItem] = useState<WebsiteBookmark | null>(null);
  const compactInteractions = useViewOptionsStore((state) => state.compactInteractions);
  const previewSize = compactInteractions.previewSize;
  const previewWidth = getCompactPreviewWidthPx(previewSize);
  const {
    getTriggerProps: getBaseTriggerProps,
    getTooltipProps,
    hideImmediately,
    tooltipRef,
    tooltipStyle,
    visible,
  } = useFloatingHoverTooltip({
    side: compactInteractions.previewPosition,
    offsetX: 12,
    offsetY: 0,
    horizontalFallback: "center",
    verticalAlign: "center",
    tooltipFallbackWidth: previewWidth,
    tooltipFallbackHeight: previewWidth * (9 / 16),
    getCollisionRect: (trigger) =>
      trigger.closest('[data-slot="scroll-area-viewport"]')?.getBoundingClientRect() ?? null,
  });

  const contextValue = useMemo<WebsiteBookmarkCompactHoverPreviewContextValue>(() => {
    const getTriggerProps = (item: WebsiteBookmark): TriggerProps => {
      const mouseProps = getBaseTriggerProps();

      const showForItem = (event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
        if (!hasWebsiteBookmarkPreviewImage(item)) return;

        setActiveItem(item);
        mouseProps.onMouseEnter(event as MouseEvent<HTMLElement>);
      };

      return {
        onMouseEnter: showForItem,
        onMouseLeave: mouseProps.onMouseLeave,
        onFocus: showForItem,
        onBlur: (event) => {
          const nextTarget = event.relatedTarget;
          if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;

          mouseProps.onMouseLeave();
        },
      };
    };

    return {getTriggerProps};
  }, [getBaseTriggerProps]);

  const showPreview =
    enabled && compactInteractions.hoverPreview && !selectionMode && visible && activeItem !== null;

  return (
    <WebsiteBookmarkCompactHoverPreviewContext.Provider value={contextValue}>
      {children}
      <div
        ref={tooltipRef}
        {...getTooltipProps()}
        className={cn(
          "border-border/80 bg-background pointer-events-auto fixed top-0 left-0 z-[9999] hidden overflow-hidden rounded-lg border lg:block",
          getCompactPreviewWidthClass(previewSize),
        )}
        style={{
          ...tooltipStyle,
          transform: `translateY(-50%) scale(${visible && showPreview ? 1 : 0.98})`,
          visibility: showPreview ? "visible" : "hidden",
        }}>
        {activeItem ? (
          <WebsiteBookmarkCompactHoverPreviewContent
            item={activeItem}
            previewSize={previewSize}
            onOpenFullscreen={hideImmediately}
          />
        ) : null}
      </div>
    </WebsiteBookmarkCompactHoverPreviewContext.Provider>
  );
}
