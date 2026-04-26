import React, {useEffect, useState} from "react";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import {useViewOptionsStore} from "@/store/use-view-options";
import {cn} from "@/lib/utils";
import Image from "next/image";
import {Avatar} from "@/components/ui/app/avatar";

function getDomainLetter(url: string): {letter: string; domain: string} {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const letter = hostname[0]?.toUpperCase() ?? "?";
    return {letter, domain: hostname};
  } catch {
    return {letter: "?", domain: "fallback"};
  }
}

const BookmarkFavicon = ({url, bookmarkUrl}: {url: string; bookmarkUrl: string}) => {
  const {contentToggles} = useViewOptionsStore();
  const showImage = contentToggles.avatar;
  const {letter, domain} = getDomainLetter(bookmarkUrl);
  const baseSrc = buildR2PublicUrl(url);
  const maxRetries = 12;
  const retryMs = 2000;

  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    if (!baseSrc) return;
    if (status !== "error") return;
    if (attempt >= maxRetries) return;

    const timer = window.setTimeout(() => {
      setAttempt((current) => current + 1);
      setStatus("loading");
    }, retryMs);

    return () => window.clearTimeout(timer);
  }, [attempt, baseSrc, status]);

  if (showImage) {
    return (
      <div
        className={cn(
          "bg-background relative shrink-0 overflow-hidden rounded-md border",
          "size-9 object-contain",
          "flex items-center justify-center",
        )}>
        {status !== "loaded" ? (
          <div className="text-muted-foreground/30 z-10 flex items-center justify-center">
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
        ) : null}

        {baseSrc ? (
          <div className={cn("absolute inset-0 flex items-center justify-center")}>
            <Image
              src={`${baseSrc}?v=${attempt}`}
              alt={bookmarkUrl + " favicon"}
              width={20}
              height={20}
              className={cn(
                "object-contain transition-opacity duration-200 ease-in-out",
                status === "loaded" ? "opacity-100" : "opacity-0",
              )}
              loading="lazy"
              onLoad={() => setStatus("loaded")}
              onError={() => setStatus("error")}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex size-9 items-center justify-center rounded-sm">
      <Avatar
        seed={domain}
        label={letter}
        size={32}
        animated={false}
        showFrame={false}
        className={cn("rounded-sm")}
        style={{
          fontSize: Math.max(10, Math.floor(36 * 0.55)) + "px",
        }}
      />
    </div>
  );
};

export default BookmarkFavicon;
