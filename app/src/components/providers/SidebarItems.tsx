import React from "react";
import {cn} from "@/lib/utils";
import {Checkbox} from "@/components/coss-ui/checkbox";
import {ContextMenu, ContextMenuTrigger} from "@/components/shadcn/context-menu";
import {motion} from "framer-motion";
import NumberFlow from "@number-flow/react";
import {CollectionContextMenuContent, TagContextMenuContent} from "./SidebarMenus";
import {useRouter} from "next/navigation";
import type {Collection} from "@/app/actions/collections";
import type {SidebarTag} from "@/app/home/_types";
import {Skeleton} from "@/components/ui/skeleton";
import {useHasMounted} from "@/lib/hooks/use-has-mounted";

export function SidebarCollectionSkeleton({width}: {width?: string}) {
  return (
    <div className="flex w-full items-center gap-1 rounded-md px-3 py-2">
      <Skeleton className={cn("h-5 animate-pulse rounded-sm", width || "w-full")} />
    </div>
  );
}

export function SidebarTagSkeleton({width}: {width?: string}) {
  return (
    <div className="flex w-full items-center justify-between rounded-md px-3 py-2">
      <Skeleton className={cn("h-5 animate-pulse rounded-sm", width || "w-full")} />
      <Skeleton className="ml-10 h-5 w-5 shrink-0 animate-pulse rounded-sm" />
    </div>
  );
}

interface SidebarCollectionItemProps {
  collection: Collection;
  index: number;
  isActive: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onToggleSelection: () => void;
  onCopy: () => void;
  onContextMenuDelete: () => void;
}

export function SidebarCollectionItem({
  collection,
  index,
  isActive,
  selectionMode,
  isSelected,
  onSelect,
  onToggleSelection,
  onCopy,
  onContextMenuDelete,
}: SidebarCollectionItemProps) {
  const router = useRouter();
  const hasMounted = useHasMounted();

  return (
    <motion.div
      layout="position"
      initial={{opacity: 0, height: 0, filter: "blur(8px)"}}
      animate={{opacity: 1, height: "auto", filter: "blur(0px)"}}
      exit={{opacity: 0, height: 0, filter: "blur(8px)"}}
      transition={{type: "spring", stiffness: 420, damping: 36, mass: 0.6}}>
      <ContextMenu>
        <ContextMenuTrigger
          tabIndex={0}
          onClick={() => {
            if (selectionMode) {
              onToggleSelection();
              return;
            }
            router.push(`/home?collection=${collection.id}`);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (selectionMode) {
                onToggleSelection();
              } else {
                router.push(`/home?collection=${collection.id}`);
              }
            }
          }}
          className={cn(
            isActive
              ? "text-foreground bg-[#F0F0F0] dark:bg-[#181717]"
              : "text-secondary bg-transparent",
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
            "hover:bg-muted hover:text-foreground",
            "cursor-pointer justify-between transition-none!",
            "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          )}>
          <div className="flex items-center">
            <div
              className={cn(
                "grid shrink-0 items-center transition-[grid-template-columns,opacity] duration-200 ease-out",
                selectionMode ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
              )}
              style={{
                transitionDelay: selectionMode ? `${Math.min(index * 20, 120)}ms` : "0ms",
              }}>
              <div className="min-w-0 overflow-hidden">
                <div className="pr-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(!!checked)}
                    onClick={(e) => e.stopPropagation()}
                    tabIndex={-1}
                  />
                </div>
              </div>
            </div>
            <span className="flex items-center gap-2 text-sm font-medium">
              <span aria-hidden="true" className="text-base leading-none">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.1801 5.20811C8.42024 4.93063 8.80956 4.93063 9.04971 5.20811L11.4597 7.99274C12.1801 8.8252 12.1801 10.1748 11.4597 11.0073L9.04971 13.7919C8.80956 14.0694 8.42024 14.0694 8.1801 13.7919C7.93997 13.5144 7.93997 13.0646 8.1801 12.7871L10.59 10.0024C10.8302 9.72492 10.8302 9.2751 10.59 8.99762L8.1801 6.21295C7.93997 5.93547 7.93997 5.48558 8.1801 5.20811Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              {collection.name}
            </span>
          </div>
          {collection.is_pinned && (
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
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onToggleSelection: () => void;
  onCopy: () => void;
  onContextMenuDelete: () => void;
}

export function SidebarTagItem({
  tag,
  index,
  isActive,
  selectionMode,
  isSelected,
  onSelect,
  onToggleSelection,
  onCopy,
  onContextMenuDelete,
}: SidebarTagItemProps) {
  const router = useRouter();
  const hasMounted = useHasMounted();

  return (
    <motion.div
      layout="position"
      initial={{opacity: 0, height: 0, filter: "blur(8px)"}}
      animate={{opacity: 1, height: "auto", filter: "blur(0px)"}}
      exit={{opacity: 0, height: 0, filter: "blur(8px)"}}
      transition={{type: "spring", stiffness: 420, damping: 36, mass: 0.6}}>
      <ContextMenu>
        <ContextMenuTrigger
          tabIndex={0}
          onClick={() => {
            if (selectionMode) {
              onToggleSelection();
              return;
            }
            router.push(`/home?tag=${tag.id}`);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (selectionMode) {
                onToggleSelection();
              } else {
                router.push(`/home?tag=${tag.id}`);
              }
            }
          }}
          className={cn(
            isActive
              ? "text-foreground bg-[#F0F0F0] dark:bg-[#181717]"
              : "text-secondary bg-transparent",
            "flex w-full items-center gap-2 rounded-md px-3 py-2",
            "hover:bg-muted hover:text-foreground",
            "cursor-pointer justify-between",
            "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          )}>
          <div className="flex items-center">
            <div
              className={cn(
                "grid shrink-0 items-center transition-[grid-template-columns,opacity] duration-200 ease-out",
                selectionMode ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
              )}
              style={{
                transitionDelay: selectionMode ? `${Math.min(index * 20, 120)}ms` : "0ms",
              }}>
              <div className="min-w-0 overflow-hidden">
                <div className="pr-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(!!checked)}
                    onClick={(e) => e.stopPropagation()}
                    tabIndex={-1}
                  />
                </div>
              </div>
            </div>
            <span className="flex items-center gap-0.5 text-sm font-medium">
              <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
                #
              </span>
              {tag.name}
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
            <span className="text-secondary text-sm tabular-nums">
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
