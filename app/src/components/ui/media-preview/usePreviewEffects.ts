import {useEffect, type Dispatch, type RefObject, type SetStateAction} from "react";

export function usePreviewEffects({
  open,
  overlayRef,
  onEscape,
  setIsFullscreen,
}: {
  open: boolean;
  overlayRef: RefObject<HTMLDivElement | null>;
  onEscape: () => void;
  setIsFullscreen: Dispatch<SetStateAction<boolean>>;
}) {
  useEffect(() => {
    if (!open) return;

    const overlay = overlayRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
      }
    };
    const preventScroll = (event: WheelEvent | TouchEvent) => {
      event.preventDefault();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown, {capture: true});
    overlay?.addEventListener("wheel", preventScroll, {passive: false});
    overlay?.addEventListener("touchmove", preventScroll, {passive: false});

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown, {capture: true});
      overlay?.removeEventListener("wheel", preventScroll);
      overlay?.removeEventListener("touchmove", preventScroll);
    };
  }, [onEscape, open, overlayRef]);

  useEffect(() => {
    if (!open) return;

    const syncViewportState = () => {
      setIsFullscreen(document.fullscreenElement === overlayRef.current);
    };

    syncViewportState();
    window.addEventListener("resize", syncViewportState);
    document.addEventListener("fullscreenchange", syncViewportState);

    return () => {
      window.removeEventListener("resize", syncViewportState);
      document.removeEventListener("fullscreenchange", syncViewportState);
    };
  }, [open, overlayRef, setIsFullscreen]);
}
