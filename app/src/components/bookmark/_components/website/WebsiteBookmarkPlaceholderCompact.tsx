import {Skeleton} from "@/components/ui/coss/skeleton";
import {formatDateAbsolute} from "@/lib/utils/dates";
import type {Bookmark} from "@/components/bookmark/types";
import {useViewOptionsStore} from "@/store/use-view-options";
import {Tag} from "@/components/ui/app/tag";
import {
  getFastDelay,
  usePlaceholderDone,
} from "@/components/bookmark/_hooks/use-placeholder-transition";
import CrossFade from "../shared/NewBookmarkCrossFade";
import {useMemo} from "react";

export default function WebsiteBookmarkPlaceholderCompact({
  url,
  bookmark,
  onDone,
}: {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
}) {
  const loaded = !!bookmark;
  const {contentToggles} = useViewOptionsStore();
  usePlaceholderDone(loaded, onDone);

  const domain = useMemo(() => {
    try {
      return new URL(bookmark?.url ?? url).hostname.replace(/^www\./, "");
    } catch {
      return bookmark?.url ?? url;
    }
  }, [bookmark?.url, url]);

  return (
    <div className="flex min-h-[45px] w-full items-center gap-3 border-b px-5 py-2.5 pr-12">
      <div className="flex shrink-0 items-center">
        <CrossFade
          loaded={loaded}
          delay={0}
          skeleton={<Skeleton className="size-[18px] rounded-none" />}>
          <div className="bg-muted size-[18px] rounded-none" />
        </CrossFade>
      </div>

      <div className="min-w-0 flex-1">
        <CrossFade
          loaded={!!bookmark?.title}
          delay={getFastDelay(100)}
          skeleton={<Skeleton className="h-[20px] w-48 rounded" />}>
          <div className="text-foreground truncate text-[13.5px]">{bookmark?.title ?? url}</div>
        </CrossFade>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="text-muted-foreground hidden items-center gap-1 text-[12px] sm:flex">
            <CrossFade
              loaded={loaded}
              delay={getFastDelay(200)}
              skeleton={<Skeleton className="h-[18px] w-24 rounded" />}>
              <div className="flex items-center gap-1">
                {contentToggles.source && <span>{domain}</span>}
                {bookmark && contentToggles.source && contentToggles.savedDate && (
                  <span className="shrink-0">/</span>
                )}
                {bookmark && contentToggles.savedDate && (
                  <span className="shrink-0">{formatDateAbsolute(bookmark.created_at)}</span>
                )}
              </div>
            </CrossFade>
          </div>
        )}

        {contentToggles.tags && (!bookmark || (bookmark.tags && bookmark.tags.length > 0)) && (
          <div className="flex items-center gap-1">
            <CrossFade
              loaded={!!(bookmark?.tags && bookmark.tags.length > 0)}
              delay={getFastDelay(300)}
              skeleton={
                <div className="flex gap-1">
                  <Skeleton className="h-[18px] w-12 rounded-[2px]" />
                  <Skeleton className="h-[18px] w-16 rounded-[2px]" />
                </div>
              }>
              <div className="flex items-center gap-1">
                {bookmark?.tags?.slice(0, 2).map((tag) => (
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
