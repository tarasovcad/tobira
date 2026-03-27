import React from "react";
import {cn} from "@/lib/utils";
import {Checkbox} from "@/components/coss-ui/checkbox";
import {ContextMenu, ContextMenuTrigger} from "@/components/shadcn/context-menu";
import {motion} from "framer-motion";
import NumberFlow from "@number-flow/react";
import {CollectionContextMenuContent, TagContextMenuContent} from "./SidebarMenus";
import {useRouter} from "next/navigation";
import type {Collection} from "@/app/actions/collections";
import type {TagWithCount} from "@/app/home/_types";

interface SidebarCollectionItemProps {
  collection: Collection;
  index: number;
  isActive: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onToggleSelection: () => void;
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
  onContextMenuDelete,
}: SidebarCollectionItemProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{opacity: 0, height: 0, filter: "blur(8px)"}}
      animate={{opacity: 1, height: "auto", filter: "blur(0px)"}}
      exit={{opacity: 0, height: 0, filter: "blur(8px)"}}
      transition={{duration: 0.2, ease: "easeOut"}}>
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
        </ContextMenuTrigger>

        <CollectionContextMenuContent collection={collection} onDelete={onContextMenuDelete} />
      </ContextMenu>
    </motion.div>
  );
}

interface SidebarTagItemProps {
  tag: TagWithCount;
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

  return (
    <motion.div
      initial={{opacity: 0, height: 0, filter: "blur(8px)"}}
      animate={{opacity: 1, height: "auto", filter: "blur(0px)"}}
      exit={{opacity: 0, height: 0, filter: "blur(8px)"}}
      transition={{duration: 0.2, ease: "easeOut"}}>
      <ContextMenu>
        <ContextMenuTrigger
          tabIndex={0}
          onClick={() => {
            if (selectionMode) {
              onToggleSelection();
              return;
            }
            router.push(`/home?tag=${encodeURIComponent(tag.name)}`);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (selectionMode) {
                onToggleSelection();
              } else {
                router.push(`/home?tag=${encodeURIComponent(tag.name)}`);
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
          <span className="text-secondary text-sm tabular-nums">
            <NumberFlow value={tag.count} />
          </span>
        </ContextMenuTrigger>

        <TagContextMenuContent tag={tag} onCopy={onCopy} onDelete={onContextMenuDelete} />
      </ContextMenu>
    </motion.div>
  );
}
