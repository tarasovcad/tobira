import {cn} from "@/lib/utils/classnames";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {Bookmark} from "../types";
import {BookmarkImage} from "./BookmarkImage";
import {Avatar} from "@/components/ui/avatar";

function getDomainLetter(url: string): {letter: string; domain: string} {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const letter = hostname[0]?.toUpperCase() ?? "?";
    return {letter, domain: hostname};
  } catch {
    return {letter: "?", domain: "fallback"};
  }
}

export function BookmarkAvatar({
  item,
  className,
  imageContainerClassName,
  letterClassName,
  imageClassName,
  skeletonClassName,
  width,
  height,
  iconSize = 16,
}: {
  item: Bookmark;
  className?: string;
  imageContainerClassName?: string;
  letterClassName?: string;
  imageClassName?: string;
  skeletonClassName?: string;
  width?: number;
  height?: number;
  iconSize?: number;
}) {
  const {contentToggles} = useViewOptionsStore();
  const showImage = contentToggles.avatar;

  if (showImage) {
    return (
      <div
        className={cn(
          "bg-background relative shrink-0 overflow-hidden rounded-md border",
          className,
          imageContainerClassName,
        )}>
        <BookmarkImage
          bookmark_id={item.id}
          item={item}
          type="favicon"
          divClassName="absolute inset-0"
          imageClassName={imageClassName}
          skeletonClassName={skeletonClassName}
          fallbackClassName=""
          height={height}
          width={width}
        />
      </div>
    );
  }

  const {letter, domain} = getDomainLetter(item.url);
  return (
    <Avatar
      seed={domain}
      label={letter}
      size={iconSize}
      animated={false}
      showFrame={false}
      className={cn("rounded-sm", className, letterClassName)}
      style={{
        fontSize: Math.max(10, Math.floor(iconSize * 0.55)) + "px",
      }}
    />
  );
}
