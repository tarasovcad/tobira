"use client";

import React, {useEffect, useState} from "react";
import {usePathname, useSearchParams} from "next/navigation";
import {cn} from "@/lib/utils";
import {AnimatePresence} from "framer-motion";
import {useQuery} from "@tanstack/react-query";
import {getTags} from "@/app/actions/tags";
import {SidebarSectionMenu} from "./SidebarSectionMenu";
import {SidebarTagItem} from "./SidebarItems";
import {DeleteTagDialog} from "./DeleteTagDialog";
import {SelectionActionBar} from "@/components/bookmark/SelectionActionBar";
import {useClipboardCopy} from "@/lib/useClipboardCopy";

export type SidebarTagsType = {id: string; name: string; count: number}[];

export function SidebarTags({initialTags}: {initialTags?: SidebarTagsType}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {copyText} = useClipboardCopy(2000, {toast: true});

  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [tagsSelectValue, setTagsSelectValue] = useState("all");
  const [tagSelectionMode, setTagSelectionMode] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [tagsToDelete, setTagsToDelete] = useState<{id: string; name: string}[] | null>(null);

  useEffect(() => {
    if (!tagSelectionMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTagSelectionMode(false);
        setSelectedTagIds(new Set());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tagSelectionMode]);

  const {data: tags} = useQuery({
    queryKey: ["tags"],
    queryFn: async () => await getTags(),
    initialData: initialTags,
  });

  const selectedCount = selectedTagIds.size;
  const allSelected = tags?.length ? selectedCount === tags.length : false;

  const handleClearSelection = React.useCallback(() => {
    setSelectedTagIds(new Set());
    setTagSelectionMode(false);
  }, []);

  const handleSelectAll = React.useCallback(() => {
    if (allSelected) {
      setSelectedTagIds(new Set());
    } else if (tags) {
      setSelectedTagIds(new Set(tags.map((t) => t.id)));
    }
  }, [allSelected, tags]);

  const handleDeleteSelected = React.useCallback(() => {
    if (!tags) return;
    const selectedTags = tags.filter((t) => selectedTagIds.has(t.id));
    if (selectedTags.length === 0) return;
    setTagsToDelete(selectedTags);
  }, [selectedTagIds, tags]);

  const activeTag =
    searchParams.get("tag")?.trim().replace(/\s+/g, " ").toLowerCase() ??
    searchParams.get("tab")?.trim().replace(/\s+/g, " ").toLowerCase() ??
    null;

  return (
    <>
      <div className="px-3 pe-2">
        <div
          onClick={() => setTagsExpanded((prev) => !prev)}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            "group/tags cursor-pointer text-[11px] font-semibold tracking-wider uppercase",
            "h-[37px]",
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
                className="opacity-0 transition-opacity duration-150 ease-out group-hover/tags:opacity-100">
                <path
                  d="M10.0879 5.1292C10.3156 4.90139 10.6849 4.90139 10.9127 5.1292C11.1405 5.35701 11.1405 5.72626 10.9127 5.95409L7.41274 9.45409C7.18489 9.68189 6.81564 9.68189 6.58785 9.45409L3.08784 5.95409C2.86004 5.72626 2.86004 5.35701 3.08784 5.1292C3.31565 4.90139 3.68491 4.90139 3.91272 5.1292L7.00027 8.21679L10.0879 5.1292Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </div>

          <SidebarSectionMenu
            open={tagMenuOpen}
            onOpenChange={setTagMenuOpen}
            selectionMode={tagSelectionMode}
            onSelectionModeChange={(checked) => {
              setTagSelectionMode(checked);
              if (!checked) setSelectedTagIds(new Set());
              if (checked) setTagsExpanded(true);
              setTagMenuOpen(false);
            }}
            selectValue={tagsSelectValue}
            onSelectValueChange={(v) => setTagsSelectValue(String(v))}
            ariaLabel="Tag options"
            triggerClassName="group-hover/tags:pointer-events-auto group-hover/tags:opacity-100"
          />
        </div>
        <div className="flex flex-col gap-0.5 pb-2">
          <AnimatePresence initial={false}>
            {tagsExpanded &&
              tags?.map((tag, index) => {
                const isActive =
                  pathname === "/all" && activeTag != null && activeTag === tag.name.toLowerCase();
                return (
                  <SidebarTagItem
                    key={tag.id}
                    tag={tag}
                    index={index}
                    isActive={isActive}
                    selectionMode={tagSelectionMode}
                    isSelected={selectedTagIds.has(tag.id)}
                    onSelect={(checked) => {
                      setSelectedTagIds((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(tag.id);
                        else next.delete(tag.id);
                        return next;
                      });
                    }}
                    onToggleSelection={() => {
                      setSelectedTagIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(tag.id)) next.delete(tag.id);
                        else next.add(tag.id);
                        return next;
                      });
                    }}
                    onCopy={() => void copyText(tag.name, tag.id)}
                    onContextMenuDelete={() => {
                      setTagsToDelete([{id: tag.id, name: tag.name}]);
                    }}
                  />
                );
              })}
          </AnimatePresence>
        </div>
      </div>

      <DeleteTagDialog
        open={tagsToDelete !== null}
        onOpenChange={(isOpen) => !isOpen && setTagsToDelete(null)}
        tags={tagsToDelete || []}
        onDeleted={handleClearSelection}
      />

      <SelectionActionBar
        visible={tagSelectionMode && selectedCount > 0}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onDelete={handleDeleteSelected}
        displayArchive={false}
        displayFavorite={false}
        displayCopy={false}
      />
    </>
  );
}
