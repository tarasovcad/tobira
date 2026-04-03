import {Skeleton} from "@/components/coss-ui/skeleton";
import {cn} from "@/lib/utils/classnames";
import {useViewOptionsStore} from "@/store/use-view-options";

export function ListSkeleton() {
  const {contentToggles} = useViewOptionsStore();

  return (
    <div className="flex w-full gap-5 border-b px-6 py-5 pr-16">
      <Skeleton className="size-9 rounded-md" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-[20px] w-48 rounded-[2px]" />
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="mt-2">
            <Skeleton className="h-3 w-32 rounded-[2px]" />
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

export function GridSkeleton({borderRadiusClass = "rounded-md"}: {borderRadiusClass?: string}) {
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

export function MediaSkeleton({
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
