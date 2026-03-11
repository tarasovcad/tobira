import {Skeleton} from "@/components/coss-ui/skeleton";
import {cn} from "@/lib/utils";

export function RowSkeleton() {
  return (
    <div className="flex w-full gap-5 border-b px-6 py-5 pr-16">
      <Skeleton className="size-9 rounded-md" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-[20px] w-48 rounded-[2px]" />
        <div className="mt-3">
          <Skeleton className="h-4 w-80 rounded-[2px]" />
        </div>
        <div className="mt-1.5">
          <Skeleton className="h-4 w-80 rounded-[2px]" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="bg-background w-full overflow-hidden rounded-md border">
      <Skeleton className="aspect-16/10 w-full" />
      <div className="min-h-[92px] p-4">
        <Skeleton className="h-4 w-3/4 rounded" />
        <div className="mt-1">
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}

export function MediaSkeleton({index}: {index: number}) {
  // Alternate aspect ratios to simulate a masonry layout
  const aspectRatios = ["aspect-square", "aspect-4/3", "aspect-3/4", "aspect-16/9", "aspect-9/16"];
  const aspectClass = aspectRatios[index % aspectRatios.length];

  return (
    <div className="bg-background w-full overflow-hidden rounded-md border">
      <Skeleton className={cn("w-full", aspectClass)} />
    </div>
  );
}
