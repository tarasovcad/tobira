"use client";

import type {MediaGalleryEntry} from "@/components/bookmark/_utils/media-grid-render";
import {cn} from "@/lib/utils";

const MAX_VISIBLE_COUNT = 5;
const BUFFER_COUNT = 2;
const THUMB_SIZE = 50;
const THUMB_GAP = 8;
const THUMB_STRIDE = THUMB_SIZE + THUMB_GAP;

type PreviewThumbnailRailProps = {
  entries: MediaGalleryEntry[];
  currentIndex: number | null;
  expanded: boolean;
  visible: boolean;
  onSelect: (index: number) => void;
};

function getRailThumbnailSrc(src: string) {
  try {
    const url = new URL(src);

    if (url.hostname !== "media.tobira.app") {
      return src;
    }

    url.searchParams.set("size", "thumb");
    url.searchParams.set("format", "webp");
    return url.toString();
  } catch {
    return src;
  }
}

export function PreviewThumbnailRail({
  entries,
  currentIndex,
  expanded,
  visible,
  onSelect,
}: PreviewThumbnailRailProps) {
  const visibleCount = entries.length === 0 ? 0 : Math.min(entries.length, MAX_VISIBLE_COUNT);
  const trackCount = visibleCount + BUFFER_COUNT * 2;
  const viewportWidth =
    visibleCount > 0 ? THUMB_SIZE * visibleCount + THUMB_GAP * (visibleCount - 1) : 0;
  const trackWidth = trackCount > 0 ? THUMB_SIZE * trackCount + THUMB_GAP * (trackCount - 1) : 0;
  const visibleStart =
    currentIndex === null
      ? 0
      : Math.min(
          Math.max(currentIndex - Math.floor(visibleCount / 2), 0),
          Math.max(entries.length - visibleCount, 0),
        );
  const trackStart = visibleStart - BUFFER_COUNT;
  const railEntries =
    currentIndex === null
      ? []
      : Array.from({length: trackCount}, (_, slot) => {
          const index = trackStart + slot;
          const entry = index >= 0 && index < entries.length ? entries.at(index) : undefined;

          if (!entry) {
            return null;
          }

          return {entry, index, slot};
        }).filter(
          (value): value is {entry: MediaGalleryEntry; index: number; slot: number} =>
            value !== null,
        );

  if (railEntries.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-3 z-[110] mx-auto flex w-fit justify-center px-4 transition-transform duration-200 ease-out",
        visible && expanded
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}>
      <div className="rounded-xl border border-white/10 bg-black/40 p-2 shadow-xl backdrop-blur-md">
        <div className="overflow-hidden" style={{width: viewportWidth}}>
          <div
            className="relative transition-transform duration-300 ease-out"
            style={{
              width: trackWidth,
              height: THUMB_SIZE,
              transform: `translateX(-${BUFFER_COUNT * THUMB_STRIDE}px)`,
            }}>
            {railEntries.map(({entry, index}) => {
              const thumbnailSrc =
                entry.previewItem.type === "video"
                  ? getRailThumbnailSrc(entry.previewItem.poster ?? entry.previewItem.src)
                  : getRailThumbnailSrc(entry.previewItem.src);
              const isActive = index === currentIndex;
              const slot = index - trackStart;

              return (
                <button
                  key={entry.renderId}
                  type="button"
                  aria-label={`Go to item ${index + 1}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(index);
                  }}
                  className={cn(
                    "absolute top-0 left-0 cursor-pointer overflow-hidden rounded-md border transition-transform duration-300 ease-out",
                    isActive
                      ? "border-white/80 opacity-100"
                      : "border-white/15 opacity-70 hover:opacity-100",
                  )}
                  style={{transform: `translateX(${slot * THUMB_STRIDE}px)`}}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailSrc}
                    alt={entry.previewItem.alt}
                    className={cn(
                      "size-12 object-cover transition duration-300",
                      isActive ? "brightness-100" : "brightness-75",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
