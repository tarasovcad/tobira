import {useEffect, type RefObject} from "react";

export function usePreviewEffects({
  open,
  overlayRef,
  onEscape,
}: {
  open: boolean;
  overlayRef: RefObject<HTMLDivElement | null>;
  onEscape: () => void;
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
}
