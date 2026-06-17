"use client";

import React, {useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {cn} from "@/lib/utils";
import {AnimatePresence, motion} from "framer-motion";
import {SidebarTagItem, SidebarTagSkeleton} from "./SidebarItems";
import {useDeleteTagDialogStore} from "@/store/use-delete-tag-dialog-store";
import {useClipboardCopy} from "@/lib/hooks/use-clipboard-copy";
import type {SidebarTag} from "@/features/home/types";
import {useTagsQuery} from "@/features/home/hooks/use-home-metadata-query";
import {SidebarSectionMenu} from "./SidebarSectionMenu";

const SIDEBAR_TAG_LIMIT = 5;

export type SidebarTagsType = SidebarTag[];

export function SidebarTags({allTags, userId}: {allTags?: SidebarTagsType; userId?: string}) {
  const {data: tags = [], isFetching} = useTagsQuery({
    userId,
    initialData: allTags,
  });

  return <SidebarTagsContent tags={tags} isFetching={isFetching} />;
}

function SidebarTagsContent({tags, isFetching}: {tags: SidebarTagsType; isFetching: boolean}) {
  const pathname = usePathname();
  const router = useRouter();
  const openDeleteDialog = useDeleteTagDialogStore((state) => state.openDialog);
  const {copyText} = useClipboardCopy(2000, {toast: true});

  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [tagsSelectValue, setTagsSelectValue] = useState("5");

  const pathTagId = pathname.startsWith("/tags/")
    ? decodeURIComponent(pathname.split("/")[2] ?? "")
    : null;
  const visibleTags = tags.slice(0, SIDEBAR_TAG_LIMIT);
  const hasMoreTags = tags.length > SIDEBAR_TAG_LIMIT;

  return (
    <div className="px-3">
      <div
        tabIndex={0}
        role="button"
        onClick={() => setTagsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setTagsExpanded((prev) => !prev);
          }
        }}
        className={cn(
          "flex h-[35px] w-full items-center justify-between rounded-md px-3 py-[7.5px] text-sm font-medium",
          "text-muted-foreground hover:bg-muted hover:text-foreground",
          "group/tags cursor-pointer text-[11px] font-semibold tracking-wider uppercase",
          "focus-visible:ring-ring focus-visible:ring-offset-background relative outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-offset-1",
        )}>
        <div className="flex items-center gap-0.5">
          <span className="">TAGS</span>

          <span
            className={cn(
              "inline-flex size-5 shrink-0 items-center justify-center text-current transition-transform duration-200 ease-out",
              tagsExpanded ? "rotate-0" : "-rotate-90",
            )}
            aria-hidden>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={cn(
                "opacity-0 transition-opacity duration-150 ease-out group-hover/tags:opacity-100",
                !tagsExpanded && "opacity-100",
              )}>
              <path
                d="M10.0879 5.1292C10.3156 4.90139 10.6849 4.90139 10.9127 5.1292C11.1405 5.35701 11.1405 5.72626 10.9127 5.95409L7.41274 9.45409C7.18489 9.68189 6.81564 9.68189 6.58785 9.45409L3.08784 5.95409C2.86004 5.72626 2.86004 5.35701 3.08784 5.1292C3.31565 4.90139 3.68491 4.90139 3.91272 5.1292L7.00027 8.21679L10.0879 5.1292Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </div>

        <div className="flex items-center">
          <SidebarSectionMenu
            open={tagMenuOpen}
            onOpenChange={setTagMenuOpen}
            selectValue={tagsSelectValue}
            onSelectValueChange={(v) => setTagsSelectValue(String(v))}
            ariaLabel="Tag options"
            triggerClassName="group-hover/tags:pointer-events-auto group-hover/tags:opacity-100 focus-visible:opacity-100 focus-visible:pointer-events-auto"
          />
        </div>
      </div>
      <div className="flex flex-col gap-0.5 pb-2">
        {isFetching &&
          tags.length === 0 &&
          [1, 2, 3, 4, 5].map((i, idx) => (
            <SidebarTagSkeleton
              key={`tag-skeleton-${i}`}
              width={["w-[50%]", "w-[70%]", "w-[40%]", "w-[60%]", "w-[45%]"][idx % 5]}
            />
          ))}
        <AnimatePresence initial={false}>
          {tagsExpanded &&
            visibleTags.map((tag) => {
              const isActive = pathTagId === tag.id;
              return (
                <SidebarTagItem
                  key={tag.id}
                  tag={tag}
                  isActive={isActive}
                  onCopy={() => void copyText(tag.name, tag.id)}
                  onContextMenuDelete={() => {
                    openDeleteDialog([{id: tag.id, name: tag.name}]);
                  }}
                />
              );
            })}
          {tagsExpanded && hasMoreTags && (
            <motion.div
              initial={{opacity: 0, height: 0, filter: "blur(8px)"}}
              animate={{opacity: 1, height: "auto", filter: "blur(0px)"}}
              exit={{opacity: 0, height: 0, filter: "blur(8px)"}}
              transition={{type: "spring", stiffness: 420, damping: 36, mass: 0.6}}>
              <button
                type="button"
                onClick={() => router.push("/tags")}
                className={cn(
                  "text-secondary bg-transparent",
                  "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-[7.5px] text-sm font-medium",
                  "hover:bg-muted hover:text-foreground transition-none!",
                  "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                )}>
                <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M8.00033 9.33332C8.73671 9.33332 9.33366 8.73637 9.33366 7.99999C9.33366 7.26361 8.73671 6.66666 8.00033 6.66666C7.26395 6.66666 6.66699 7.26361 6.66699 7.99999C6.66699 8.73637 7.26395 9.33332 8.00033 9.33332Z"
                      fill="currentColor"
                    />
                    <path
                      d="M12.6663 9.33332C13.4027 9.33332 13.9997 8.73637 13.9997 7.99999C13.9997 7.26361 13.4027 6.66666 12.6663 6.66666C11.93 6.66666 11.333 7.26361 11.333 7.99999C11.333 8.73637 11.93 9.33332 12.6663 9.33332Z"
                      fill="currentColor"
                    />
                    <path
                      d="M3.33333 9.33332C4.06971 9.33332 4.66667 8.73637 4.66667 7.99999C4.66667 7.26361 4.06971 6.66666 3.33333 6.66666C2.59695 6.66666 2 7.26361 2 7.99999C2 8.73637 2.59695 9.33332 3.33333 9.33332Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>More</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
