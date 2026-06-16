"use client";

import React, {useState} from "react";
import Link from "next/link";
import {useQueryState} from "nuqs";
import {cn} from "@/lib/utils";
import {buttonVariants} from "@/components/ui/legacy-shadcn/button";
import {AnimatePresence} from "framer-motion";
import {SidebarTagItem, SidebarTagSkeleton} from "./SidebarItems";
import {useDeleteTagDialogStore} from "@/store/use-delete-tag-dialog-store";
import {useClipboardCopy} from "@/lib/hooks/use-clipboard-copy";
import type {SidebarTag} from "@/features/home/types";
import {useTagsQuery} from "@/features/home/hooks/use-home-metadata-query";
import {homeFilterParsers} from "@/lib/query-params";

export type SidebarTagsType = SidebarTag[];

export function SidebarTags({allTags, userId}: {allTags?: SidebarTagsType; userId?: string}) {
  const {data: tags = [], isFetching} = useTagsQuery({
    userId,
    initialData: allTags,
  });

  return <SidebarTagsContent tags={tags} isFetching={isFetching} />;
}

function SidebarTagsContent({tags, isFetching}: {tags: SidebarTagsType; isFetching: boolean}) {
  const [tagParam] = useQueryState("tag", homeFilterParsers.tag);
  const openDeleteDialog = useDeleteTagDialogStore((state) => state.openDialog);
  const {copyText} = useClipboardCopy(2000, {toast: true});

  const [tagsExpanded, setTagsExpanded] = useState(true);

  const activeTag = tagParam?.trim() || null;

  return (
    <div className="px-3 pe-2">
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
          "flex w-full items-center justify-between rounded-md px-3 py-1.75 text-sm font-medium",
          "text-muted-foreground hover:bg-muted hover:text-foreground",
          "group/tags cursor-pointer text-[11px] font-semibold tracking-wider uppercase",
          "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
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
          {/*<SidebarSectionMenu
            open={tagMenuOpen}
            onOpenChange={setTagMenuOpen}
            selectValue={tagsSelectValue}
            onSelectValueChange={(v) => setTagsSelectValue(String(v))}
            ariaLabel="Tag options"
            triggerClassName="group-hover/tags:pointer-events-auto group-hover/tags:opacity-100 focus-visible:opacity-100 focus-visible:pointer-events-auto"
          />*/}
          <Link
            href="/tags"
            className={cn(
              buttonVariants({variant: "ghost", size: "xs"}),
              "text-muted-foreground hover:bg-foreground/5",
              "pointer-events-none opacity-0 transition-opacity duration-150 ease-out",
              "group-hover/tags:pointer-events-auto group-hover/tags:opacity-100",
              "px-1.5 text-xs! normal-case focus-visible:pointer-events-auto focus-visible:opacity-100",
            )}>
            All
          </Link>
        </div>
      </div>
      <div className="flex flex-col pb-2">
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
            tags.map((tag, index) => {
              const isActive = activeTag === tag.id;
              return (
                <SidebarTagItem
                  key={tag.id}
                  tag={tag}
                  index={index}
                  isActive={isActive}
                  onCopy={() => void copyText(tag.name, tag.id)}
                  onContextMenuDelete={() => {
                    openDeleteDialog([{id: tag.id, name: tag.name}]);
                  }}
                />
              );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
}
