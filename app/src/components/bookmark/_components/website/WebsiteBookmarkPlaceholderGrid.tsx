import {cn} from "@/lib/utils";
import {Skeleton} from "@/components/coss-ui/skeleton";
import {formatDateAbsolute} from "@/lib/utils/dates";
import type {Bookmark} from "@/components/bookmark/types";
import {useViewOptionsStore} from "@/store/use-view-options";
import {Tag} from "@/components/ui/Tag";
import {
  getFastDelay,
  usePlaceholderDone,
} from "@/components/bookmark/_hooks/use-placeholder-transition";
import CrossFade from "../shared/NewBookmarkCrossFade";

export default function WebsiteBookmarkPlaceholderGrid({
  url,
  bookmark,
  onDone,
  tags,
}: {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
  tags?: string[];
}) {
  const loaded = !!bookmark;
  const {borderRadius, contentToggles, gridGap} = useViewOptionsStore();
  const zeroGap = gridGap === "none";
  const onlyTitle =
    !contentToggles.source &&
    !contentToggles.savedDate &&
    !contentToggles.description &&
    !(
      contentToggles.tags &&
      ((tags && tags.length > 0) || (bookmark?.tags && bookmark.tags.length > 0))
    );

  const radiusClass =
    borderRadius === "none" || zeroGap
      ? "rounded-none"
      : borderRadius === "sm"
        ? "rounded-sm"
        : borderRadius === "md"
          ? "rounded-md"
          : "rounded-lg";

  usePlaceholderDone(loaded, onDone);

  return (
    <div
      className={cn(
        "bg-background relative flex h-full w-full flex-col overflow-hidden text-left",
        zeroGap ? "border-r border-b" : "border",
        radiusClass,
      )}>
      <div className="bg-muted relative aspect-16/10 w-full shrink-0 overflow-hidden">
        <CrossFade
          loaded={loaded}
          delay={0}
          className="w-full"
          skeleton={<Skeleton className="absolute inset-0 size-full rounded-none" />}>
          <div className="bg-muted aspect-16/10 w-full" />
        </CrossFade>
      </div>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col px-4",
          onlyTitle ? "py-3" : "pt-3 pb-4",
        )}>
        <CrossFade
          loaded={!!bookmark?.title}
          delay={getFastDelay(150)}
          skeleton={
            <div className="flex flex-col gap-2">
              <Skeleton className="h-[22.5px] w-full max-w-[92%] rounded-sm" />
            </div>
          }>
          <div className="text-foreground line-clamp-1 text-[15px] font-[550]">
            {bookmark?.title ?? url}
          </div>
        </CrossFade>
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="text-muted-foreground mt-1 min-w-0 text-[13px] whitespace-nowrap">
            <CrossFade
              loaded={loaded}
              delay={getFastDelay(300)}
              skeleton={<Skeleton className="h-[19.5px] w-full rounded-sm" />}>
              <div className="flex min-w-0 items-center gap-1">
                {contentToggles.source && (
                  <span className="min-w-0 flex-1 truncate">{bookmark?.url ?? url}</span>
                )}
                {bookmark && contentToggles.source && contentToggles.savedDate ? (
                  <span className="shrink-0">-</span>
                ) : null}
                {bookmark && contentToggles.savedDate ? (
                  <span className="shrink-0">{formatDateAbsolute(bookmark.created_at)}</span>
                ) : null}
              </div>
            </CrossFade>
          </div>
        )}
        {contentToggles.description && (
          <div className="text-muted-foreground mt-1.5">
            <CrossFade
              loaded={!!bookmark?.description}
              delay={getFastDelay(400)}
              skeleton={
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-[19.5px] w-full max-w-full rounded-sm" />
                  <Skeleton className="h-[19.5px] w-full max-w-[58%] rounded-sm" />
                </div>
              }>
              <div className="line-clamp-2 text-[13px]">{bookmark?.description ?? ""}</div>
            </CrossFade>
          </div>
        )}
        {contentToggles.tags &&
          (!loaded ||
            (tags && tags.length > 0) ||
            (bookmark?.tags && bookmark.tags.length > 0)) && (
            <div className="mt-2 flex flex-wrap gap-1">
              <CrossFade
                loaded={
                  !!((bookmark?.tags && bookmark.tags.length > 0) || (tags && tags.length > 0))
                }
                delay={getFastDelay(500)}
                skeleton={
                  <div className="flex flex-wrap gap-1">
                    <Skeleton className="h-[20.5px] w-14 rounded-[2px]" />
                    <Skeleton className="h-[20.5px] w-18 rounded-[2px]" />
                    <Skeleton className="h-[20.5px] w-12 rounded-[2px]" />
                  </div>
                }>
                <div className="flex flex-wrap gap-1">
                  {(bookmark?.tags ?? tags ?? []).map((tag) => (
                    <Tag key={tag} className="text-muted-foreground text-[12px]">
                      {tag}
                    </Tag>
                  ))}
                </div>
              </CrossFade>
            </div>
          )}
      </div>
    </div>
  );
}
