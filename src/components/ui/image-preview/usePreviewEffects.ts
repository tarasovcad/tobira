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

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onEscape, open]);

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
