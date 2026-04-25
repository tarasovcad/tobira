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

export default function WebsiteBookmarkPlaceholderList({
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
  const {contentToggles} = useViewOptionsStore();
  usePlaceholderDone(loaded, onDone);

  return (
    <div className="flex w-full flex-col gap-2 border-b px-6 py-5 pr-16">
      <div className="flex min-w-0 flex-1 items-center gap-5">
        <CrossFade loaded={loaded} delay={0} skeleton={<Skeleton className="size-9 rounded-md" />}>
          <div className="bg-muted size-9 rounded-md border" />
        </CrossFade>
        <div className="min-w-0 flex-1 text-[13px]">
          <CrossFade
            loaded={!!bookmark?.title}
            delay={getFastDelay(100)}
            skeleton={<Skeleton className="h-[22.5px] w-48 rounded" />}>
            <div className="text-foreground truncate text-[15px] font-[550]">
              {bookmark?.title ?? url}
            </div>
          </CrossFade>
          {(contentToggles.source || contentToggles.savedDate) && (
            <div className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1 whitespace-nowrap">
              <CrossFade
                loaded={loaded}
                delay={getFastDelay(200)}
                skeleton={<Skeleton className="h-[19.5px] w-64 rounded" />}>
                <div className="flex min-w-0 items-center gap-1">
                  {contentToggles.source && (
                    <span className="min-w-0 truncate">{bookmark?.url ?? url}</span>
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
            <div
              className={cn(
                "text-muted-foreground",
                contentToggles.source || contentToggles.savedDate ? "mt-1.5" : "mt-0.5",
              )}>
              <CrossFade
                loaded={!!bookmark?.description}
                delay={getFastDelay(300)}
                skeleton={<Skeleton className="h-[19.5px] w-40 rounded" />}>
                <div className="line-clamp-1">{bookmark?.description ?? ""}</div>
              </CrossFade>
            </div>
          )}
        </div>
      </div>
      {contentToggles.tags &&
        ((tags && tags.length > 0) || (bookmark?.tags && bookmark.tags.length > 0)) && (
          <div className="pl-14">
            <CrossFade
              loaded={!!(bookmark?.tags && bookmark.tags.length > 0)}
              delay={getFastDelay(400)}
              skeleton={
                <div className="flex gap-2">
                  <Skeleton className="h-[20.5px] w-16 rounded-[2px]" />
                  <Skeleton className="h-[20.5px] w-20 rounded-[2px]" />
                </div>
              }>
              <div className="flex flex-wrap gap-1">
                {bookmark?.tags?.map((tag) => (
                  <Tag key={tag} className="text-muted-foreground text-[12px]">
                    {tag}
                  </Tag>
                ))}
              </div>
            </CrossFade>
          </div>
        )}
    </div>
  );
}
