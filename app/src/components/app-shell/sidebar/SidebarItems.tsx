import React from "react";
import {cn} from "@/lib/utils";
import {ContextMenu, ContextMenuTrigger} from "@/components/ui/legacy-shadcn/context-menu";
import {motion} from "framer-motion";
import NumberFlow from "@number-flow/react";
import {CollectionContextMenuContent, TagContextMenuContent} from "./SidebarMenus";
import {useRouter} from "next/navigation";
import type {Collection} from "@/app/actions/collections";
import type {SidebarTag} from "@/features/home/types";
import {Skeleton} from "@/components/ui/app/skeleton";
import {useHasMounted} from "@/lib/hooks/use-has-mounted";

export function SidebarCollectionSkeleton({width}: {width?: string}) {
  return (
    <div className="flex w-full items-center gap-1 rounded-md px-3 py-2.25">
      <Skeleton className={cn("h-5 animate-pulse rounded-sm", width || "w-full")} />
    </div>
  );
}

export function SidebarTagSkeleton({width}: {width?: string}) {
  return (
    <div className="flex w-full items-center justify-between rounded-md px-3 py-2.25">
      <Skeleton className={cn("h-5 animate-pulse rounded-sm", width || "w-full")} />
      <Skeleton className="ml-10 h-5 w-5 shrink-0 animate-pulse rounded-sm" />
    </div>
  );
}

interface SidebarCollectionItemProps {
  collection: Collection;
  isActive: boolean;
  onCopy: () => void;
  onContextMenuDelete: () => void;
}

export function SidebarCollectionItem({
  collection,
  isActive,
  onCopy,
  onContextMenuDelete,
}: SidebarCollectionItemProps) {
  const router = useRouter();
  const hasMounted = useHasMounted();
  const collectionColor = collection.color?.hex ?? "#38bdf8";
  const collectionColorOpacity = (collection.color?.opacity ?? 100) / 100;

  const openCollection = () => {
    router.push(`/collections/${collection.id}`);
  };

  return (
    <motion.div
      className={cn("relative focus-within:z-20", isActive ? "z-10" : "z-0")}
      initial={{opacity: 0, height: 0, filter: "blur(8px)"}}
      animate={{opacity: 1, height: "auto", filter: "blur(0px)"}}
      exit={{opacity: 0, height: 0, filter: "blur(8px)"}}
      transition={{type: "spring", stiffness: 420, damping: 36, mass: 0.6}}>
      <ContextMenu>
        <ContextMenuTrigger
          tabIndex={0}
          onClick={() => {
            openCollection();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openCollection();
            }
          }}
          className={cn(
            isActive
              ? "text-foreground bg-[#F0F0F0] dark:bg-[#181717]"
              : "text-secondary bg-transparent",
            "flex w-full items-center gap-2 rounded-md px-3 py-2.25 text-sm font-medium",
            "hover:bg-muted hover:text-foreground",
            "cursor-pointer justify-between transition-none!",
            "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          )}>
          <div className="flex min-w-0 flex-1 items-center">
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
              <span
                aria-hidden="true"
                className="ring-border/70 size-2.5 shrink-0 rounded-full ring-2"
                style={{backgroundColor: collectionColor, opacity: collectionColorOpacity}}
              />
              <span className="min-w-0 truncate" title={collection.name}>
                {collection.name}
              </span>
            </span>
          </div>
          {collection.is_pinned && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="text-muted-foreground/80 shrink-0"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.83366 1.33334C5.45295 1.33334 4.33366 2.45262 4.33366 3.83334V4.66464C4.33366 5.81391 3.87711 6.91614 3.06446 7.72874L2.81344 7.9798C2.71967 8.07354 2.66699 8.20074 2.66699 8.33334V10.1667C2.66699 10.2993 2.71967 10.4265 2.81344 10.5202C2.90721 10.614 3.03439 10.6667 3.16699 10.6667H7.50033V14.1667C7.50033 14.4428 7.72419 14.6667 8.00033 14.6667C8.27646 14.6667 8.50033 14.4428 8.50033 14.1667V10.6667H12.8337C13.1098 10.6667 13.3337 10.4428 13.3337 10.1667V8.33334C13.3337 8.20074 13.281 8.07354 13.1872 7.9798L12.9362 7.72874C12.1235 6.91614 11.667 5.81391 11.667 4.66464V3.83334C11.667 2.45262 10.5477 1.33334 9.16699 1.33334H6.83366Z"
                fill="currentColor"
              />
            </svg>
          )}
        </ContextMenuTrigger>

        {hasMounted && (
          <CollectionContextMenuContent
            collection={collection}
            onCopy={onCopy}
            onDelete={onContextMenuDelete}
          />
        )}
      </ContextMenu>
    </motion.div>
  );
}

interface SidebarTagItemProps {
  tag: SidebarTag;
  index: number;
  isActive: boolean;
  onCopy: () => void;
  onContextMenuDelete: () => void;
}

export function SidebarTagItem({
  tag,
  index: _index,
  isActive,
  onCopy,
  onContextMenuDelete,
}: SidebarTagItemProps) {
  const router = useRouter();
  const hasMounted = useHasMounted();

  const openTag = () => {
    router.push(`/tags/${tag.id}`);
  };

  return (
    <motion.div
      className={cn("relative focus-within:z-20", isActive ? "z-10" : "z-0")}
      layout="position"
      initial={{opacity: 0, height: 0, filter: "blur(8px)"}}
      animate={{opacity: 1, height: "auto", filter: "blur(0px)"}}
      exit={{opacity: 0, height: 0, filter: "blur(8px)"}}
      transition={{type: "spring", stiffness: 420, damping: 36, mass: 0.6}}>
      <ContextMenu>
        <ContextMenuTrigger
          tabIndex={0}
          onClick={() => {
            openTag();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openTag();
            }
          }}
          className={cn(
            isActive
              ? "text-foreground bg-[#F0F0F0] dark:bg-[#181717]"
              : "text-secondary bg-transparent",
            "flex w-full items-center gap-2 rounded-md px-3 py-[9px] leading-none",
            "hover:bg-muted hover:text-foreground",
            "cursor-pointer justify-between",
            "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          )}>
          <div className="flex min-w-0 flex-1 items-center">
            <span className="flex min-w-0 items-center gap-0.5 text-sm font-medium">
              <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
                #
              </span>
              <span className="truncate">{tag.name}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {tag.is_pinned && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                className="text-muted-foreground/80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.83366 1.33334C5.45295 1.33334 4.33366 2.45262 4.33366 3.83334V4.66464C4.33366 5.81391 3.87711 6.91614 3.06446 7.72874L2.81344 7.9798C2.71967 8.07354 2.66699 8.20074 2.66699 8.33334V10.1667C2.66699 10.2993 2.71967 10.4265 2.81344 10.5202C2.90721 10.614 3.03439 10.6667 3.16699 10.6667H7.50033V14.1667C7.50033 14.4428 7.72419 14.6667 8.00033 14.6667C8.27646 14.6667 8.50033 14.4428 8.50033 14.1667V10.6667H12.8337C13.1098 10.6667 13.3337 10.4428 13.3337 10.1667V8.33334C13.3337 8.20074 13.281 8.07354 13.1872 7.9798L12.9362 7.72874C12.1235 6.91614 11.667 5.81391 11.667 4.66464V3.83334C11.667 2.45262 10.5477 1.33334 9.16699 1.33334H6.83366Z"
                  fill="currentColor"
                />
              </svg>
            )}
            <span className="text-secondary h-[20px] text-sm leading-0 tabular-nums">
              <NumberFlow value={tag.count} />
            </span>
          </div>
        </ContextMenuTrigger>

        {hasMounted && (
          <TagContextMenuContent tag={tag} onCopy={onCopy} onDelete={onContextMenuDelete} />
        )}
      </ContextMenu>
    </motion.div>
  );
}
