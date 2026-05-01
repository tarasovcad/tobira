import {Skeleton} from "@/components/ui/coss/skeleton";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";

export function WebsiteSkeletonList() {
  const {contentToggles} = useViewOptionsStore();

  return (
    <div className="flex w-full gap-5 border-b px-6 py-5 pr-16">
      <div className="flex items-center">
        <Skeleton className="size-9 rounded-md" />
      </div>
      <div className="min-w-0 flex-1">
        <Skeleton className="h-[20px] w-48 rounded-[2px]" />
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="mt-2">
            <Skeleton className="h-[13.5px] w-32 rounded-[2px]" />
          </div>
        )}
        {contentToggles.description && (
          <>
            <div className="mt-3">
              <Skeleton className="h-4 w-80 rounded-[2px]" />
            </div>
          </>
        )}
        {contentToggles.tags && (
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-5 w-16 rounded-[2px]" />
            <Skeleton className="h-5 w-20 rounded-[2px]" />
          </div>
        )}
      </div>
    </div>
  );
}

export function WebsiteSkeletonTable() {
  return <div>TODO: add skeleton for table</div>;
}

export function WebsiteSkeletonCompact() {
  return <div>TODO: add skeleton for compact</div>;
}

export function WebsiteSkeletonGrid({
  borderRadiusClass = "rounded-md",
}: {
  borderRadiusClass?: string;
}) {
  const {contentToggles} = useViewOptionsStore();

  return (
    <div className={cn("bg-background w-full overflow-hidden border", borderRadiusClass)}>
      <Skeleton className="aspect-16/10 w-full" />
      <div className="p-4">
        <Skeleton className="h-4 w-3/4 rounded" />
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="mt-2">
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        )}
        {contentToggles.description && (
          <div className="mt-3">
            <Skeleton className="h-3 w-full rounded" />
            <div className="mt-1.5">
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
          </div>
        )}
        {contentToggles.tags && (
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        )}
      </div>
    </div>
  );
}

export function PostSkeletonList() {
  return (
    <div className="border-border flex flex-col gap-4 border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="bg-muted size-10 animate-pulse rounded-full" />
        <div className="flex flex-col gap-1.5">
          <div className="bg-muted h-[15px] w-28 animate-pulse rounded" />
          <div className="bg-muted h-[13px] w-20 animate-pulse rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="bg-muted h-[15px] w-full animate-pulse rounded" />
        <div className="bg-muted h-[15px] w-4/5 animate-pulse rounded" />
        <div className="bg-muted h-[15px] w-3/5 animate-pulse rounded" />
      </div>
      <div className="bg-muted h-44 w-full animate-pulse rounded-[16px]" />
    </div>
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
