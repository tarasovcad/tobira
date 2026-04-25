import {Skeleton} from "@/components/coss-ui/skeleton";
import type {Bookmark} from "@/components/bookmark/types";
import {
  getFastDelay,
  usePlaceholderDone,
} from "@/components/bookmark/_hooks/use-placeholder-transition";
import CrossFade from "../shared/NewBookmarkCrossFade";

export default function PostBookmarkPlaceholderList({
  bookmark,
  onDone,
}: {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
  tags?: string[];
}) {
  const loaded = !!bookmark;
  usePlaceholderDone(loaded, onDone);

  return (
    <div className="border-border flex flex-col gap-[14px] border-b px-4 py-3">
      {/* Author row skeleton */}
      <div className="flex items-center gap-2">
        <CrossFade
          loaded={loaded}
          delay={0}
          skeleton={<Skeleton className="size-10 rounded-full" />}>
          <div className="bg-muted size-10 rounded-full border" />
        </CrossFade>
        <div className="flex flex-col gap-1">
          <CrossFade
            loaded={loaded}
            delay={getFastDelay(80)}
            skeleton={<Skeleton className="h-[18px] w-28 rounded" />}>
            <div className="text-foreground text-[15px] font-semibold">
              {bookmark?.metadata && (bookmark.metadata as {user_name?: string}).user_name
                ? (bookmark.metadata as {user_name?: string}).user_name
                : ""}
            </div>
          </CrossFade>
          <CrossFade
            loaded={loaded}
            delay={getFastDelay(120)}
            skeleton={<Skeleton className="h-[15px] w-20 rounded" />}>
            <div className="text-muted-foreground text-[13px]" />
          </CrossFade>
        </div>
      </div>

      {/* Text skeleton */}
      <div className="space-y-1.5">
        <CrossFade
          loaded={loaded}
          delay={getFastDelay(200)}
          skeleton={<Skeleton className="h-[19px] w-full rounded" />}>
          <div />
        </CrossFade>
        <CrossFade
          loaded={loaded}
          delay={getFastDelay(260)}
          skeleton={<Skeleton className="h-[19px] w-4/5 rounded" />}>
          <div />
        </CrossFade>
        <CrossFade
          loaded={loaded}
          delay={getFastDelay(320)}
          skeleton={<Skeleton className="h-[19px] w-3/5 rounded" />}>
          <div />
        </CrossFade>
      </div>

      {/* Media skeleton */}
      <CrossFade
        loaded={loaded}
        delay={getFastDelay(400)}
        skeleton={<Skeleton className="h-48 w-full rounded-[16px]" />}>
        <div />
      </CrossFade>
    </div>
  );
}
