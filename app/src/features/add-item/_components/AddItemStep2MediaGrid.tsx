"use client";

import {useState} from "react";
import Image from "next/image";
import {cn} from "@/lib/utils";
import type {MediaMediaItem} from "@/components/bookmark/types/metadata";

type AddItemStep2MediaGridProps = {
  mediaItems: MediaMediaItem[];
  selectedMediaUrls: string[];
  onToggleMediaUrl: (url: string) => void;
};

function MediaGridImageFallback() {
  return (
    <div className="text-muted-foreground/30 z-10 col-start-1 row-start-1">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.375 2.5C16.1009 2.5 17.5 3.89911 17.5 5.625V14.375C17.5 16.1009 16.1009 17.5 14.375 17.5H5.625C3.89911 17.5 2.5 16.1009 2.5 14.375V5.625C2.5 3.89911 3.89911 2.5 5.625 2.5H14.375ZM7.99235 11.3257C7.26015 10.5937 6.07318 10.5937 5.34098 11.3257L3.75 12.9167V14.375C3.75 15.4105 4.58947 16.25 5.625 16.25H12.9167L7.99235 11.3257ZM12.5 5.41667C11.3494 5.41667 10.4167 6.34941 10.4167 7.5C10.4167 8.65058 11.3494 9.58333 12.5 9.58333C13.6506 9.58333 14.5833 8.65058 14.5833 7.5C14.5833 6.34941 13.6506 5.41667 12.5 5.41667Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

function MediaGridOptionImage({src, alt}: {src: string; alt: string}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");

  const hasSrc = !!src;
  const isLoaded = hasSrc && status === "loaded";

  return (
    <div className="bg-muted border-border relative grid aspect-video w-full place-items-center overflow-hidden rounded-md">
      {!isLoaded ? <MediaGridImageFallback /> : null}

      {hasSrc ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "col-start-1 row-start-1 object-cover transition-opacity duration-100 ease-in-out",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          unoptimized
          loading="lazy"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      ) : null}
    </div>
  );
}

function MediaGridCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.16699 8.6154L7.04199 10.5L10.167 5.83333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AddItemStep2MediaGrid({
  mediaItems,
  selectedMediaUrls,
  onToggleMediaUrl,
}: AddItemStep2MediaGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-6 px-6 pt-4 pb-6",
        mediaItems.length === 2 && "grid-cols-1",
      )}>
      {mediaItems.map((mediaItem, i) => {
        const isSelected = selectedMediaUrls.includes(mediaItem.url);
        const thumbSrc = mediaItem.thumbnail_url ?? mediaItem.url;
        return (
          <button
            key={`${mediaItem.url}-${i}`}
            type="button"
            onClick={() => onToggleMediaUrl(mediaItem.url)}
            className={cn(
              "hit-area-1.5 ring-offset-background relative cursor-pointer rounded-xl p-1.5 transition-all duration-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-[1.5px]",
              isSelected
                ? "ring-highlight-hovered ring-2 ring-offset-[1.5px] hover:ring-blue-600 focus-visible:ring-blue-600"
                : "hover:ring-muted-foreground/40 focus-visible:ring-muted-foreground/40 hover:ring-2 hover:ring-offset-[1.5px]",
            )}>
            <div className="relative overflow-hidden rounded-lg">
              <MediaGridOptionImage src={thumbSrc} alt={`Media ${i + 1}`} />
              <div
                className={cn(
                  "bg-primary text-primary-foreground absolute top-2 right-2 flex h-6 w-6 scale-50 items-center justify-center rounded-full opacity-0 shadow-sm transition-all duration-100",
                  isSelected && "scale-100 opacity-100",
                )}>
                <MediaGridCheckIcon />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
