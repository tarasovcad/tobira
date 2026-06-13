"use client";

import {Skeleton} from "@/components/ui/coss/skeleton";

export function HeaderSkeleton() {
  return (
    <div className="border-b px-6 py-8.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <Skeleton className="h-[29px] w-40" />

          <div className="flex h-[21px] items-center gap-4 pt-2">
            <Skeleton className="h-4.5 w-20" />
            <Skeleton className="h-4.5 w-32" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-7.5 w-[72px]" />
          <Skeleton className="h-7.5 w-[80px]" />
        </div>
      </div>
    </div>
  );
}
