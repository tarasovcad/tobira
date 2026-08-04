import {Skeleton} from "@/components/ui/coss/skeleton";
import {cn} from "@/lib/utils";
import {useIsPostDetailOpen} from "@/lib/hooks/use-is-post-detail-open";
import {useViewOptionsStore} from "@/store/use-view-options";

export function WebsiteSkeletonList() {
  const {contentToggles} = useViewOptionsStore();

  return (
    <div className="flex w-full flex-col gap-2 border-b px-6 py-5 pr-16">
      <div className="flex min-w-0 flex-1 items-center gap-5">
        <div className="flex items-center">
          <Skeleton className="size-9 rounded-md" />
        </div>
        <div className="min-w-0 flex-1 text-[13px]">
          <Skeleton className="h-[21px] w-48 rounded" />
          {(contentToggles.source || contentToggles.savedDate) && (
            <div className="mt-[6px]">
              <Skeleton className="h-[17px] w-64 rounded" />
            </div>
          )}
          {contentToggles.description && (
            <div
              className={contentToggles.source || contentToggles.savedDate ? "mt-[9px]" : "mt-3"}>
              <Skeleton className="h-[16.5px] w-40 rounded" />
            </div>
          )}
        </div>
      </div>
      {contentToggles.tags && (
        <div className="flex flex-wrap gap-1 pl-14">
          <Skeleton className="h-[20.5px] w-16 rounded-[2px]" />
          <Skeleton className="h-[20.5px] w-20 rounded-[2px]" />
        </div>
      )}
    </div>
  );
}

export function WebsiteSkeletonTable() {
  return <div>TODO: add skeleton for table</div>;
}

export function WebsiteSkeletonCompact() {
  const contentToggles = useViewOptionsStore((state) => state.contentToggles);
  const isFullWidth = useViewOptionsStore((state) => state.bookmarkWidthByType.website === "full");

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 border-b px-5 py-2.5",
        isFullWidth ? "pr-14" : "pr-12",
      )}>
      <div className="flex shrink-0 items-center">
        <Skeleton className="size-[18px] rounded-none" />
      </div>
      <div className="min-w-0 flex-1">
        <Skeleton className="h-[20.25px] w-48 rounded" />
      </div>
      {(contentToggles.source || contentToggles.savedDate || contentToggles.tags) && (
        <div className="flex shrink-0 items-center gap-2">
          {(contentToggles.source || contentToggles.savedDate) && (
            <Skeleton className="hidden h-[18px] w-24 rounded sm:block" />
          )}
          {contentToggles.tags && (
            <div className="flex items-center gap-1">
              <Skeleton className="h-[18px] w-12 rounded-[2px]" />
              <Skeleton className="h-[18px] w-16 rounded-[2px]" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WebsiteSkeletonGrid({
  borderRadiusClass = "rounded-md",
}: {
  borderRadiusClass?: string;
}) {
  const {contentToggles, showTitle} = useViewOptionsStore();
  const onlyTitle =
    showTitle &&
    !contentToggles.source &&
    !contentToggles.savedDate &&
    !contentToggles.description &&
    !contentToggles.tags;
  const hasVisibleMetadata =
    showTitle ||
    contentToggles.source ||
    contentToggles.savedDate ||
    contentToggles.description ||
    contentToggles.tags;

  return (
    <div className={cn("bg-background w-full overflow-hidden border", borderRadiusClass)}>
      <Skeleton className="aspect-16/10 w-full rounded-none" />
      {hasVisibleMetadata ? (
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col px-4",
            onlyTitle ? "py-3" : "pt-3 pb-4",
          )}>
          {showTitle && <Skeleton className="h-[22.5px] w-3/4 rounded" />}
          {(contentToggles.source || contentToggles.savedDate) && (
            <div className="mt-1">
              <Skeleton className="h-[19.5px] w-1/2 rounded" />
            </div>
          )}
          {contentToggles.description && (
            <div
              className={cn(
                contentToggles.source || contentToggles.savedDate ? "mt-1.5" : "mt-0.5",
              )}>
              <Skeleton className="h-[19.5px] w-full rounded" />
              <div className="mt-1.5">
                <Skeleton className="h-[19.5px] w-2/3 rounded" />
              </div>
            </div>
          )}
          {contentToggles.tags && (
            <div className="mt-2 flex flex-wrap gap-1">
              <Skeleton className="h-[20.5px] w-12 rounded-[2px]" />
              <Skeleton className="h-[20.5px] w-16 rounded-[2px]" />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function PostSkeletonList({className}: {className?: string}) {
  const isPostDetailOpen = useIsPostDetailOpen();

  return (
    <article
      aria-hidden="true"
      className={cn(
        "border-border grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 px-4",
        isPostDetailOpen ? "pt-0 pb-10" : "border-b py-4 pt-5",
        className,
      )}>
      <Skeleton className="size-10 rounded-full" />

      <div className="min-w-0 space-y-[14px]">
        <div className="flex min-w-0 items-center gap-2 pr-10">
          <Skeleton className="h-5 w-28 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>

        <div className="space-y-1.5">
          <Skeleton className="h-[18px] w-full rounded" />
          <Skeleton className="h-[18px] w-11/12 rounded" />
          <Skeleton className="h-[18px] w-3/5 rounded" />
        </div>

        <Skeleton className="aspect-video w-full rounded-lg" />
      </div>
    </article>
  );
}

export function MediaSkeletonGrid({
  index,
  borderRadiusClass = "rounded-md",
}: {
  index: number;
  borderRadiusClass?: string;
}) {
  // Alternate aspect ratios to simulate a masonry layout
  const aspectRatios = ["aspect-square", "aspect-4/3", "aspect-3/4", "aspect-16/9", "aspect-9/16"];
  const aspectClass = aspectRatios[index % aspectRatios.length];

  return (
    <div className={cn("bg-background w-full overflow-hidden border", borderRadiusClass)}>
      <Skeleton className={cn("w-full", aspectClass)} />
    </div>
  );
}
