"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
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

const PREVIEW_OFFSET_X = 12;
const PREVIEW_OFFSET_Y = 0;
const PREVIEW_ASPECT_RATIO = 9 / 16;
const DISABLED_PREVIEW_TRANSITION = "left 0s, top 0s, transform 0s, opacity 0s";
const SCROLL_VIEWPORT_SELECTOR = '[data-slot="scroll-area-viewport"]';

type HoverPreviewTriggerProps = {
  onMouseEnter: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
};

type WebsiteBookmarkCompactHoverPreviewContextValue = {
  getTriggerProps: (item: WebsiteBookmark) => HoverPreviewTriggerProps;
};

type WebsiteBookmarkCompactHoverPreviewProviderProps = {
  children: ReactNode;
  enabled?: boolean;
  selectionMode?: boolean;
};

const WebsiteBookmarkCompactHoverPreviewContext =
  createContext<WebsiteBookmarkCompactHoverPreviewContextValue | null>(null);

const noopTriggerProps: HoverPreviewTriggerProps = {
  onMouseEnter: () => {},
  onMouseLeave: () => {},
  onFocus: () => {},
  onBlur: () => {},
};

function getPreviewTransition(previewAnimation: boolean) {
  return previewAnimation ? undefined : DISABLED_PREVIEW_TRANSITION;
}

function getPreviewHeight(width: number) {
  return width * PREVIEW_ASPECT_RATIO;
}

function getScrollViewportCollisionRect(trigger: HTMLElement) {
  return trigger.closest(SCROLL_VIEWPORT_SELECTOR)?.getBoundingClientRect() ?? null;
}

function didFocusMoveWithinTrigger(event: FocusEvent<HTMLElement>) {
  const nextTarget = event.relatedTarget;

  return nextTarget instanceof Node && event.currentTarget.contains(nextTarget);
}

function getTooltipVisibilityStyle({
  shouldShowPreview,
  visible,
}: {
  shouldShowPreview: boolean;
  visible: boolean;
}): CSSProperties {
  return {
    transform: `translateY(-50%) scale(${visible && shouldShowPreview ? 1 : 0.98})`,
    visibility: shouldShowPreview ? "visible" : "hidden",
  };
}

export function useWebsiteBookmarkCompactHoverPreviewTrigger(item: WebsiteBookmark) {
  const context = useContext(WebsiteBookmarkCompactHoverPreviewContext);

  return useMemo(() => context?.getTriggerProps(item) ?? noopTriggerProps, [context, item]);
}

export function WebsiteBookmarkCompactHoverPreviewProvider({
  children,
  enabled = true,
  selectionMode = false,
}: WebsiteBookmarkCompactHoverPreviewProviderProps) {
  const [activeItem, setActiveItem] = useState<WebsiteBookmark | null>(null);
  const compactInteractions = useViewOptionsStore((state) => state.compactInteractions);
  const previewSize = compactInteractions.previewSize;
  const previewWidth = getCompactPreviewWidthPx(previewSize);
  const previewHeight = getPreviewHeight(previewWidth);
  const previewTransition = getPreviewTransition(compactInteractions.previewAnimation);
  const {
    getTriggerProps: getBaseTriggerProps,
    getTooltipProps,
    hideImmediately,
    tooltipRef,
    tooltipStyle,
    visible,
  } = useFloatingHoverTooltip({
    side: compactInteractions.previewPosition,
    offsetX: PREVIEW_OFFSET_X,
    offsetY: PREVIEW_OFFSET_Y,
    horizontalFallback: "center",
    verticalAlign: "center",
    tooltipFallbackWidth: previewWidth,
    tooltipFallbackHeight: previewHeight,
    getCollisionRect: getScrollViewportCollisionRect,
    openTransition: previewTransition,
    closeTransition: previewTransition,
    positionTransition: previewTransition,
  });

  const contextValue = useMemo<WebsiteBookmarkCompactHoverPreviewContextValue>(() => {
    const getTriggerProps = (item: WebsiteBookmark): HoverPreviewTriggerProps => {
      const floatingTriggerProps = getBaseTriggerProps();

      const showPreviewForItem = (event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
        if (!hasWebsiteBookmarkPreviewImage(item)) return;

        setActiveItem(item);
        floatingTriggerProps.onMouseEnter(event as MouseEvent<HTMLElement>);
      };

      return {
        onMouseEnter: showPreviewForItem,
        onMouseLeave: floatingTriggerProps.onMouseLeave,
        onFocus: showPreviewForItem,
        onBlur: (event) => {
          if (didFocusMoveWithinTrigger(event)) return;

          floatingTriggerProps.onMouseLeave();
        },
      };
    };

    return {getTriggerProps};
  }, [getBaseTriggerProps]);

  const shouldShowPreview =
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
          ...getTooltipVisibilityStyle({shouldShowPreview, visible}),
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
