"use client";

import {useEffect, useMemo, useState, type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {useQueryClient} from "@tanstack/react-query";
import {useQueryState} from "nuqs";
import {PageHeader} from "@/components/ui/app/page/PageHeader";
import {SelectionModeButton} from "@/components/bookmark/SelectionModeButton";
import {SelectionActionBar} from "@/components/bookmark/SelectionActionBar";
import {SlotTextWithFallback} from "@/components/ui/SlotTextWithFallback";
import {Button} from "@/components/ui/coss/button";
import {Checkbox} from "@/components/ui/coss/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/coss/empty";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/coss/input-group";
import {Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger} from "@/components/ui/coss/menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/legacy-shadcn/context-menu";
import {toggleTagPin} from "@/app/actions/tags";
import type {TagWithCount, SidebarTag} from "@/features/home/types";
import {toastManager} from "@/components/ui/coss/toast";
import {homeMetadataKeys} from "@/features/home/hooks/use-home-metadata-query";
import {useClipboardCopy} from "@/lib/hooks/use-clipboard-copy";
import {useFloatingHoverTooltip} from "@/lib/hooks/use-floating-hover-tooltip";
import {useTagDialogStore} from "@/store/use-tag-dialog-store";
import {useDeleteTagDialogStore} from "@/store/use-delete-tag-dialog-store";
import {tagSearchParser} from "@/lib/query-params";
import {cn} from "@/lib/utils";

export type TagPageData = {
  tags: TagPageItem[];
  stats: {
    tagCount: number;
    taggedItemCount: number;
    updatedThisWeekCount: number;
  };
};

export type TagPageItem = {
  id: string;
  name: string;
  description: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string | null;
  itemCount: number;
};

const selectionModeCheckboxClass =
  "group-data-[selection-mode=true]/tag-row:grid-cols-[1fr] group-data-[selection-mode=true]/tag-row:opacity-100";

type TagStat = {
  label: string;
  value: string;
};

type TagPageProps = {
  data: TagPageData;
};

function createTagSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function tagMatchesQuery(tag: TagPageItem, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  return [tag.name, createTagSlug(tag.name), tag.description ?? ""].some((value) =>
    value.toLowerCase().includes(query),
  );
}

function toDialogTag(tag: TagPageItem): TagWithCount {
  return {
    id: tag.id,
    name: tag.name,
    count: tag.itemCount,
    description: tag.description,
    is_pinned: tag.isPinned,
    created_at: tag.createdAt,
    updated_at: tag.updatedAt ?? tag.createdAt,
  };
}

function sortTagPageItems(tags: TagPageItem[]) {
  return [...tags].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}

function sortSidebarTags(tags: SidebarTag[]) {
  return [...tags].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) {
      return a.is_pinned ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}

function isInteractiveChild(target: EventTarget | null) {
  return target instanceof HTMLElement && !!target.closest("a, button, input, select, textarea");
}

function getStatsAfterTagsDeleted(
  stats: TagPageData["stats"],
  deletedTags: TagPageItem[],
): TagPageData["stats"] {
  const deletedItemCount = deletedTags.reduce((sum, tag) => sum + tag.itemCount, 0);
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const deletedUpdatedThisWeekCount = deletedTags.filter(
    (tag) => tag.updatedAt && Date.now() - Date.parse(tag.updatedAt) <= weekMs,
  ).length;

  return {
    tagCount: Math.max(0, stats.tagCount - deletedTags.length),
    taggedItemCount: Math.max(0, stats.taggedItemCount - deletedItemCount),
    updatedThisWeekCount: Math.max(0, stats.updatedThisWeekCount - deletedUpdatedThisWeekCount),
  };
}

function getTagStats(stats: TagPageData["stats"]): TagStat[] {
  return [
    {label: "Tags", value: String(stats.tagCount)},
    {label: "Tagged items", value: String(stats.taggedItemCount)},
    {label: "Updated this week", value: String(stats.updatedThisWeekCount)},
  ];
}

export default function TagPage({data}: TagPageProps) {
  const tagsKey = data.tags
    .map(
      (tag) =>
        `${tag.id}:${tag.name}:${tag.description ?? ""}:${tag.isPinned}:${tag.createdAt}:${tag.updatedAt ?? ""}:${tag.itemCount}`,
    )
    .join("|");
  const statsKey = `${data.stats.tagCount}:${data.stats.taggedItemCount}:${data.stats.updatedThisWeekCount}`;

  return <TagPageContent key={`${tagsKey}:${statsKey}`} data={data} />;
}

function TagPageContent({data}: TagPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {getTriggerProps, tooltipRef, tooltipStyle, visible} = useFloatingHoverTooltip();
  const openTagDialog = useTagDialogStore((state) => state.openDialog);
  const openDeleteTagDialog = useDeleteTagDialogStore((state) => state.openDialog);
  const {copyText} = useClipboardCopy(2000, {toast: true});
  const [tagStats, setTagStats] = useState(data.stats);
  const [tags, setTags] = useState(data.tags);
  const [searchQuery, setSearchQuery] = useQueryState("search", tagSearchParser);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const trimmedSearchQuery = searchQuery.trim();
  const filteredTags = useMemo(
    () => tags.filter((tag) => tagMatchesQuery(tag, searchQuery)),
    [tags, searchQuery],
  );
  const tagCountLabel = trimmedSearchQuery
    ? `${filteredTags.length} of ${tags.length}`
    : String(tags.length);
  const selectedTagCount = selectedTagIds.size;
  const allFilteredTagsSelected = filteredTags.length
    ? filteredTags.every((tag) => selectedTagIds.has(tag.id))
    : false;
  const stats = getTagStats(tagStats);

  const handleSelectionModeChange = (enabled: boolean) => {
    setSelectionMode(enabled);
    if (!enabled) {
      setSelectedTagIds(new Set());
    }
  };

  const handleClearSelection = () => {
    setSelectedTagIds(new Set());
    setSelectionMode(false);
  };

  const handleSelectAllTags = () => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);

      if (allFilteredTagsSelected) {
        filteredTags.forEach((tag) => next.delete(tag.id));
      } else {
        filteredTags.forEach((tag) => next.add(tag.id));
      }

      return next;
    });
  };

  const handleToggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const handleSelectTag = (tagId: string, checked: boolean) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(tagId);
      else next.delete(tagId);
      return next;
    });
  };

  const handleDeleteSelectedTags = () => {
    const selectedTags = tags.filter((tag) => selectedTagIds.has(tag.id));
    const selectedIds = new Set(selectedTagIds);

    if (selectedTags.length === 0) return;

    openDeleteTagDialog(selectedTags, () => {
      setTags((prev) => prev.filter((tag) => !selectedIds.has(tag.id)));
      setTagStats((prev) => getStatsAfterTagsDeleted(prev, selectedTags));
      handleClearSelection();
      router.refresh();
    });
  };

  const handleOpenTag = (tag: TagPageItem) => {
    router.push(`/tags/${tag.id}`);
  };

  const handleEditTag = (tag: TagPageItem) => {
    openTagDialog(toDialogTag(tag));
  };

  const handleCopyTag = (tag: TagPageItem) => {
    void copyText(tag.name, tag.id);
  };

  const handleToggleTagPin = async (tag: TagPageItem) => {
    const previousTags = tags;
    const previousTagQueries = queryClient.getQueriesData<SidebarTag[]>({
      queryKey: homeMetadataKeys.tagsRoot,
    });
    const isPinned = !tag.isPinned;

    setTags((prev) =>
      sortTagPageItems(prev.map((item) => (item.id === tag.id ? {...item, isPinned} : item))),
    );
    queryClient.setQueriesData<SidebarTag[]>({queryKey: homeMetadataKeys.tagsRoot}, (prev) =>
      prev
        ? sortSidebarTags(
            prev.map((item) => (item.id === tag.id ? {...item, is_pinned: isPinned} : item)),
          )
        : prev,
    );

    try {
      await toggleTagPin(tag.id, isPinned);
      void queryClient.invalidateQueries({queryKey: homeMetadataKeys.tagsRoot});
      router.refresh();
      toastManager.add({
        title: tag.isPinned ? "Tag unpinned" : "Tag pinned",
        type: "success",
      });
    } catch (error) {
      setTags(previousTags);
      previousTagQueries.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData);
      });
      toastManager.add({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        type: "error",
      });
    }
  };

  const handleDeleteTag = (tag: TagPageItem) => {
    openDeleteTagDialog([tag], () => {
      setTags((prev) => prev.filter((item) => item.id !== tag.id));
      setTagStats((prev) => getStatsAfterTagsDeleted(prev, [tag]));
      setSelectedTagIds((prev) => {
        const next = new Set(prev);
        next.delete(tag.id);
        return next;
      });
      router.refresh();
    });
  };

  useEffect(() => {
    if (!selectionMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (isInput || event.key !== "Escape") return;

      handleClearSelection();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectionMode]);

  return (
    <div className="flex h-full w-full overflow-auto">
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="bg-popover text-foreground pointer-events-none fixed top-0 left-0 z-[9999] rounded-md border px-2.5 py-1 text-sm whitespace-nowrap"
        style={{
          ...tooltipStyle,
          transform: `scale(${visible ? 1 : 0.98})`,
        }}>
        Coming soon
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-scroll py-12">
        <div className="mx-auto max-w-[calc(840px+16px+16px)] space-y-10">
          <div className="px-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <PageHeader
                title="Tags"
                description="Keep your growing library in order with custom tags that make every bookmark findable."
              />
              <div className="flex items-center gap-2">
                <Menu>
                  <MenuTrigger
                    aria-label="Tag actions"
                    render={<Button variant="outline" size="icon" className="w-fit" />}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M1.33301 8C1.33301 7.2636 1.92996 6.66666 2.66634 6.66666C3.40272 6.66666 3.99967 7.2636 3.99967 8C3.99967 8.7364 3.40272 9.33333 2.66634 9.33333C1.92996 9.33333 1.33301 8.7364 1.33301 8ZM6.66634 8C6.66634 7.2636 7.26327 6.66666 7.99967 6.66666C8.73607 6.66666 9.33301 7.2636 9.33301 8C9.33301 8.7364 8.73607 9.33333 7.99967 9.33333C7.26327 9.33333 6.66634 8.7364 6.66634 8ZM11.9997 8C11.9997 7.2636 12.5966 6.66666 13.333 6.66666C14.0694 6.66666 14.6663 7.2636 14.6663 8C14.6663 8.7364 14.0694 9.33333 13.333 9.33333C12.5966 9.33333 11.9997 8.7364 11.9997 8Z"
                        fill="currentColor"
                      />
                    </svg>
                  </MenuTrigger>
                  <MenuPopup align="end" className="w-52">
                    <div {...getTriggerProps()}>
                      <MenuItem disabled>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M1.3335 7.99999C1.3335 4.31809 4.31826 1.33333 8.00016 1.33333C11.682 1.33333 14.6668 4.31809 14.6668 7.99999C14.6668 11.6819 11.682 14.6667 8.00016 14.6667C4.31826 14.6667 1.3335 11.6819 1.3335 7.99999ZM6.00016 11.3333C5.63197 11.3333 5.3335 11.0349 5.3335 10.6667C5.3335 10.2985 5.63197 9.99999 6.00016 9.99999H10.0002C10.3684 9.99999 10.6668 10.2985 10.6668 10.6667C10.6668 11.0349 10.3684 11.3333 10.0002 11.3333H6.00016ZM9.8049 7.80473L8.47156 9.13806C8.21123 9.39839 7.7891 9.39839 7.52876 9.13806L6.19542 7.80473C5.93508 7.54439 5.93508 7.12226 6.19542 6.86193C6.45578 6.60157 6.8779 6.60157 7.13823 6.86193L7.3335 7.05719V5.33333C7.3335 4.96513 7.63196 4.66666 8.00016 4.66666C8.36836 4.66666 8.66683 4.96513 8.66683 5.33333V7.05719L8.8621 6.86193C9.12243 6.60157 9.54456 6.60157 9.8049 6.86193C10.0652 7.12226 10.0652 7.54439 9.8049 7.80473Z"
                            fill="currentColor"
                          />
                        </svg>
                        Import tags
                      </MenuItem>
                    </div>
                    <div {...getTriggerProps()}>
                      <MenuItem disabled>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_692_37)">
                            <path
                              d="M10.6665 5.33334C10.6665 4.96515 10.368 4.66667 9.99984 4.66667C9.63164 4.66667 9.33317 4.96515 9.33317 5.33334C9.33317 6.87234 8.99264 7.82827 8.41037 8.41054C7.8281 8.99281 6.87217 9.33334 5.33317 9.33334C4.96498 9.33334 4.6665 9.63181 4.6665 10C4.6665 10.3682 4.96498 10.6667 5.33317 10.6667C6.87217 10.6667 7.8281 11.0072 8.41037 11.5895C8.99264 12.1717 9.33317 13.1277 9.33317 14.6667C9.33317 15.0349 9.63164 15.3333 9.99984 15.3333C10.368 15.3333 10.6665 15.0349 10.6665 14.6667C10.6665 13.1277 11.007 12.1717 11.5893 11.5895C12.1716 11.0072 13.1275 10.6667 14.6665 10.6667C15.0347 10.6667 15.3332 10.3682 15.3332 10C15.3332 9.63181 15.0347 9.33334 14.6665 9.33334C13.1275 9.33334 12.1716 8.99281 11.5893 8.41054C11.007 7.82827 10.6665 6.87234 10.6665 5.33334Z"
                              fill="currentColor"
                            />
                            <path
                              d="M4.99984 1.33334C4.99984 0.965152 4.70136 0.666672 4.33317 0.666672C3.96498 0.666672 3.6665 0.965152 3.6665 1.33334C3.6665 2.29363 3.45328 2.83293 3.14302 3.14319C2.83276 3.45345 2.29346 3.66667 1.33317 3.66667C0.964984 3.66667 0.666504 3.96515 0.666504 4.33334C0.666504 4.70153 0.964984 5.00001 1.33317 5.00001C2.29346 5.00001 2.83276 5.21323 3.14302 5.52349C3.45328 5.83375 3.6665 6.37305 3.6665 7.33334C3.6665 7.70154 3.96498 8.00001 4.33317 8.00001C4.70136 8.00001 4.99984 7.70154 4.99984 7.33334C4.99984 6.37305 5.21306 5.83375 5.52332 5.52349C5.83358 5.21323 6.37288 5.00001 7.33317 5.00001C7.70137 5.00001 7.99984 4.70153 7.99984 4.33334C7.99984 3.96515 7.70137 3.66667 7.33317 3.66667C6.37288 3.66667 5.83358 3.45345 5.52332 3.14319C5.21306 2.83293 4.99984 2.29363 4.99984 1.33334Z"
                              fill="currentColor"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_692_37">
                              <rect width="16" height="16" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        Suggest tags
                      </MenuItem>
                    </div>
                    <div {...getTriggerProps()}>
                      <MenuItem disabled>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M2.78927 4.93869C2.85378 4.90643 2.90608 4.85413 2.93834 4.78962L3.36828 3.92973C3.49112 3.68405 3.84173 3.68405 3.96457 3.92973L4.39451 4.78962C4.42677 4.85413 4.47908 4.90643 4.54358 4.93869L5.40348 5.36864C5.64916 5.49148 5.64916 5.84208 5.40348 5.96492L4.54358 6.39487C4.47908 6.42712 4.42677 6.47943 4.39451 6.54394L3.96457 7.40379C3.84172 7.64953 3.49112 7.64953 3.36828 7.40379L2.93834 6.54394C2.90608 6.47943 2.85378 6.42712 2.78927 6.39487L1.92938 5.96492C1.6837 5.84208 1.6837 5.49148 1.92938 5.36864L2.78927 4.93869Z"
                            fill="currentColor"
                          />
                          <path
                            d="M6.37277 2.48005C6.41885 2.45701 6.45621 2.41965 6.47925 2.37357L6.78635 1.75936C6.87408 1.58387 7.12455 1.58387 7.21228 1.75936L7.51935 2.37357C7.54241 2.41965 7.57981 2.45701 7.62588 2.48005L8.24008 2.78715C8.41555 2.87489 8.41555 3.12533 8.24008 3.21307L7.62588 3.52018C7.57981 3.54322 7.54241 3.58058 7.51935 3.62666L7.21228 4.24086C7.12455 4.41635 6.87408 4.41635 6.78635 4.24086L6.47925 3.62666C6.45621 3.58058 6.41885 3.54322 6.37277 3.52018L5.75857 3.21307C5.58308 3.12533 5.58308 2.87489 5.75857 2.78715L6.37277 2.48005Z"
                            fill="currentColor"
                          />
                          <path
                            d="M13.6617 1.42047C13.9819 1.60235 14.0939 2.00931 13.912 2.32944L10.8063 7.7956L10.9817 7.85939C11.9955 8.22839 12.8061 9.23406 12.6375 10.4353C12.4135 12.0307 11.7321 13.1821 10.4745 14.4665C10.2831 14.6621 9.99159 14.7207 9.73945 14.6145L5.97693 13.0301C5.90592 13.0002 5.87497 12.9165 5.90942 12.8476L6.4876 11.6912C6.54491 11.5766 6.4233 11.455 6.30869 11.5123L4.56456 12.3848C4.52974 12.4022 4.48905 12.4035 4.45317 12.3884L3.40696 11.9479C3.18079 11.8526 3.02523 11.6408 3.00202 11.3965C2.97881 11.1522 3.09171 10.9149 3.2959 10.7787C4.26743 10.1311 5.04421 9.49686 5.62774 8.57893C6.33206 7.47093 7.73059 6.67613 9.14832 7.19213L9.53559 7.33306L12.7527 1.67078C12.9346 1.35065 13.3416 1.23858 13.6617 1.42047Z"
                            fill="currentColor"
                          />
                        </svg>
                        Auto-organize
                      </MenuItem>
                    </div>
                  </MenuPopup>
                </Menu>
              </div>
            </div>

            <TagStats stats={stats} />
          </div>

          <section className="space-y-3">
            <TagSectionHeader
              tagCountLabel={tagCountLabel}
              searchQuery={searchQuery}
              selectionMode={selectionMode}
              onSearchQueryChange={(value) => void setSearchQuery(value)}
              onSelectionModeChange={handleSelectionModeChange}
            />

            <TagList
              tags={filteredTags}
              hasSearchQuery={!!trimmedSearchQuery}
              selectionMode={selectionMode}
              selectedTagIds={selectedTagIds}
              onOpenTag={handleOpenTag}
              onEditTag={handleEditTag}
              onCopyTag={handleCopyTag}
              onToggleTagPin={(tag) => void handleToggleTagPin(tag)}
              onDeleteTag={handleDeleteTag}
              onSelectTag={handleSelectTag}
              onToggleTagSelection={handleToggleTagSelection}
            />
          </section>
        </div>
      </div>

      <SelectionActionBar
        visible={selectionMode && selectedTagCount > 0}
        selectedCount={selectedTagCount}
        allSelected={allFilteredTagsSelected}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAllTags}
        onDelete={handleDeleteSelectedTags}
        displayArchive={false}
        displayFavorite={false}
        displayCopy={false}
      />
    </div>
  );
}

function TagStats({stats}: {stats: TagStat[]}) {
  return (
    <div className="border-border mt-4 flex flex-wrap items-center gap-5.5 border-t pt-4">
      {stats.map((stat, index) => (
        <div key={stat.label} className="contents">
          {index > 0 && <div className="bg-border h-7 w-px" aria-hidden />}
          <Stat label={stat.label} value={stat.value} />
        </div>
      ))}
    </div>
  );
}

function TagSectionHeader({
  tagCountLabel,
  searchQuery,
  selectionMode,
  onSearchQueryChange,
  onSelectionModeChange,
}: {
  tagCountLabel: string;
  searchQuery: string;
  selectionMode: boolean;
  onSearchQueryChange: (value: string) => void;
  onSelectionModeChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4">
      <h4 className="text-base font-[550]">
        <span className="text-foreground/95 inline-flex items-center">
          Your tags
          <span className="text-muted-foreground/90 ml-1 font-medium tracking-wide">
            ({tagCountLabel})
          </span>
        </span>
      </h4>

      <div className="flex items-center gap-2">
        <InputGroup className="w-full max-w-[320px]">
          <InputGroupInput
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            aria-label="Search tags"
            placeholder="Search tags"
            type="search"
            autoComplete="off"
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
        <SelectionModeButton
          selectionMode={selectionMode}
          onSelectionEnabledChange={onSelectionModeChange}
        />
        <Button variant="outline" size="default" disabled>
          <FilterIcon />
          Filter
        </Button>
      </div>
    </div>
  );
}

function TagList({
  tags,
  hasSearchQuery,
  selectionMode,
  selectedTagIds,
  onOpenTag,
  onEditTag,
  onCopyTag,
  onToggleTagPin,
  onDeleteTag,
  onSelectTag,
  onToggleTagSelection,
}: {
  tags: TagPageItem[];
  hasSearchQuery: boolean;
  selectionMode: boolean;
  selectedTagIds: Set<string>;
  onOpenTag: (tag: TagPageItem) => void;
  onEditTag: (tag: TagPageItem) => void;
  onCopyTag: (tag: TagPageItem) => void;
  onToggleTagPin: (tag: TagPageItem) => void;
  onDeleteTag: (tag: TagPageItem) => void;
  onSelectTag: (tagId: string, checked: boolean) => void;
  onToggleTagSelection: (tagId: string) => void;
}) {
  if (tags.length === 0) {
    return (
      <div className="pt-0.5">{hasSearchQuery ? <TagSearchEmptyState /> : <TagEmptyState />}</div>
    );
  }

  return (
    <div className="pt-0.5">
      {tags.map((tag, index) => (
        <TagRow
          key={tag.id}
          tag={tag}
          selectionIndex={index}
          selectionMode={selectionMode}
          isSelected={selectedTagIds.has(tag.id)}
          onOpen={() => onOpenTag(tag)}
          onEdit={() => onEditTag(tag)}
          onCopy={() => onCopyTag(tag)}
          onTogglePin={() => onToggleTagPin(tag)}
          onDelete={() => onDeleteTag(tag)}
          onToggleSelection={() => onToggleTagSelection(tag.id)}
          onSelect={(checked) => onSelectTag(tag.id, checked)}
        />
      ))}
    </div>
  );
}

function TagEmptyState() {
  return (
    <Empty className="gap-4 px-4 py-14 md:py-18">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-foreground/90 mb-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.33301 4C1.33301 2.52724 2.52691 1.33333 3.99967 1.33333H7.17127C7.87847 1.33333 8.55674 1.61429 9.05687 2.11438L13.8902 6.94773C14.9316 7.98913 14.9316 9.67753 13.8902 10.7189L10.7186 13.8905C9.67721 14.9319 7.98881 14.9319 6.94741 13.8905L2.11405 9.0572C1.61396 8.55707 1.33301 7.8788 1.33301 7.1716V4ZM4.99967 6C5.55196 6 5.99967 5.55229 5.99967 5C5.99967 4.44771 5.55196 4 4.99967 4C4.44739 4 3.99967 4.44771 3.99967 5C3.99967 5.55229 4.44739 6 4.99967 6Z"
              fill="currentColor"
            />
          </svg>
        </EmptyMedia>
        <EmptyTitle className="text-foreground/90 text-lg">No tags yet</EmptyTitle>
        <EmptyDescription className="max-w-[32rem]">
          Tags are created automatically when you add them to bookmarks.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function TagSearchEmptyState() {
  return (
    <div className="px-4 py-18">
      <div className="mx-auto flex max-w-[240px] flex-col items-center text-center">
        <div className="bg-muted/50 text-muted-foreground mb-3 flex items-center justify-center rounded-full p-1">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2 6C2 3.79086 3.79086 2 6 2H10.7574C11.8182 2 12.8356 2.42143 13.5858 3.17157L20.8358 10.4216C22.3979 11.9837 22.3979 14.5163 20.8358 16.0784L16.0784 20.8358C14.5163 22.3979 11.9837 22.3979 10.4216 20.8358L3.17157 13.5858C2.42143 12.8356 2 11.8182 2 10.7574V6ZM7.5 9C8.32843 9 9 8.32843 9 7.5C9 6.67157 8.32843 6 7.5 6C6.67157 6 6 6.67157 6 7.5C6 8.32843 6.67157 9 7.5 9Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h2 className="text-foreground text-lg font-medium tracking-tight">No tags found</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          No tags found. Try searching by name or description.
        </p>
      </div>
    </div>
  );
}

function TagRow({
  tag,
  selectionIndex,
  selectionMode,
  isSelected,
  onOpen,
  onEdit,
  onCopy,
  onTogglePin,
  onDelete,
  onSelect,
  onToggleSelection,
}: {
  tag: TagPageItem;
  selectionIndex: number;
  selectionMode: boolean;
  isSelected: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onSelect: (checked: boolean) => void;
  onToggleSelection: () => void;
}) {
  const pinLabel = tag.isPinned ? "Unpin" : "Pin";
  const selectionDelay = Math.min(selectionIndex * 20, 120);

  return (
    <ContextMenu>
      <ContextMenuTrigger
        data-selection-mode={selectionMode}
        role="button"
        tabIndex={0}
        onClick={(event) => {
          if (isInteractiveChild(event.target)) return;

          if (selectionMode) {
            onToggleSelection();
            return;
          }

          onOpen();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          if (isInteractiveChild(event.target)) return;

          event.preventDefault();

          if (selectionMode) {
            onToggleSelection();
            return;
          }

          onOpen();
        }}
        className={cn(
          "group/tag-row border-border/80 hover:bg-muted/80 focus-visible:bg-muted! relative grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 transition-none! outline-none last:border-b-0 md:grid-cols-[minmax(0,1fr)_90px_auto] xl:grid-cols-[minmax(0,1fr)_280px_90px_auto]",
          isSelected && "bg-muted/60",
        )}>
        <div className="flex min-w-0 flex-1 items-center">
          <div
            className={cn(
              "grid shrink-0 grid-cols-[0fr] items-center opacity-0 transition-[grid-template-columns,opacity] duration-200 ease-out",
              selectionModeCheckboxClass,
            )}
            style={{transitionDelay: `${selectionDelay}ms`}}>
            <span className="min-w-0 overflow-hidden">
              <span className="flex items-center pr-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(!!checked)}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`Select ${tag.name}`}
                  className="focus-visible:ring-0 focus-visible:ring-offset-0"
                  tabIndex={-1}
                />
              </span>
            </span>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            <span className="text-muted-foreground/80 min-w-0 shrink truncate text-sm font-medium">
              #
            </span>
            <span className="text-foreground min-w-0 shrink truncate text-sm font-medium">
              {tag.name}
            </span>
            {tag.isPinned && (
              <span
                className="text-muted-foreground/80 inline-flex size-5 shrink-0 items-center justify-center rounded-full"
                aria-label="Pinned tag"
                title="Pinned tag">
                <PinIcon />
              </span>
            )}
          </div>
        </div>

        <div className="text-muted-foreground hidden min-w-0 text-sm xl:block">
          <p className="truncate">{tag.description}</p>
        </div>

        <div className="text-muted-foreground hidden min-w-0 text-left text-sm md:block">
          {tag.itemCount} {tag.itemCount === 1 ? "item" : "items"}
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-1.5">
          <Menu>
            <MenuTrigger
              aria-label={`More options for ${tag.name}`}
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="data-pressed:bg-accent-foreground [:hover,[data-pressed]]:bg-muted-strong! hit-area-2! size-7"
                  onClick={(event) => event.stopPropagation()}
                />
              }>
              <MoreIcon />
            </MenuTrigger>
            <MenuPopup align="end" className="w-fit">
              <TagMenuItems
                pinLabel={pinLabel}
                ItemComponent={MenuItem}
                separator={<MenuSeparator />}
                onOpen={onOpen}
                onEdit={onEdit}
                onCopy={onCopy}
                onTogglePin={onTogglePin}
                onDelete={onDelete}
              />
            </MenuPopup>
          </Menu>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-fit">
        <TagMenuItems
          pinLabel={pinLabel}
          ItemComponent={ContextMenuItem}
          separator={<ContextMenuSeparator />}
          onOpen={onOpen}
          onEdit={onEdit}
          onCopy={onCopy}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      </ContextMenuContent>
    </ContextMenu>
  );
}

type TagMenuItemProps = {
  children: ReactNode;
  variant?: "default" | "destructive";
  onClick?: () => void;
};

function TagMenuItems({
  pinLabel,
  ItemComponent,
  separator,
  onOpen,
  onEdit,
  onCopy,
  onTogglePin,
  onDelete,
}: {
  pinLabel: string;
  ItemComponent: (props: TagMenuItemProps) => ReactNode;
  separator: ReactNode;
  onOpen: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <ItemComponent onClick={onOpen}>
        <OpenIcon />
        Open
      </ItemComponent>
      <ItemComponent onClick={onEdit}>
        <EditIcon />
        Edit
      </ItemComponent>
      <ItemComponent onClick={onCopy}>
        <CopyIcon />
        Copy
      </ItemComponent>
      <ItemComponent onClick={onTogglePin}>
        {pinLabel === "Unpin" ? <UnpinIcon /> : <PinIcon />}
        {pinLabel}
      </ItemComponent>
      {separator}
      <ItemComponent variant="destructive" onClick={onDelete}>
        <DeleteIcon />
        Delete
      </ItemComponent>
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.3333 13.3333L10.751 10.751M10.751 10.751C11.6257 9.87633 12.1667 8.668 12.1667 7.33333C12.1667 4.66396 10.0027 2.5 7.33333 2.5C4.66396 2.5 2.5 4.66396 2.5 7.33333C2.5 10.0027 4.66396 12.1667 7.33333 12.1667C8.668 12.1667 9.87633 11.6257 10.751 10.751Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.55229 2C3.1427 2 2 3.1427 2 4.55229C2 5.22919 2.2689 5.87837 2.74755 6.35702L5.60947 9.21893C5.85953 9.469 6 9.80813 6 10.1617V13.3713C6 14.3023 6.9298 14.9467 7.80147 14.6198L9.1348 14.1198C9.65527 13.9246 10 13.4271 10 12.8713V10.1617C10 9.80813 10.1405 9.469 10.3905 9.21893L13.2525 6.35702C13.7311 5.87837 14 5.22919 14 4.55229C14 3.1427 12.8573 2 11.4477 2H4.55229Z"
        fill="currentColor"
      />
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.00039 2.66667C10.4959 2.66669 12.9312 4.10717 14.6101 6.8632C15.0346 7.56 15.0346 8.44 14.6101 9.1368C12.9312 11.8929 10.4959 13.3333 8.00039 13.3333C5.50483 13.3333 3.06951 11.8928 1.39061 9.13673C0.966152 8.43993 0.966146 7.55993 1.39062 6.86313C3.06951 4.10709 5.50483 2.66665 8.00039 2.66667ZM5.5837 8C5.5837 6.66531 6.66568 5.58333 8.00039 5.58333C9.33506 5.58333 10.4171 6.66531 10.4171 8C10.4171 9.33467 9.33506 10.4167 8.00039 10.4167C6.66568 10.4167 5.5837 9.33467 5.5837 8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.66699 3.83333C2.66699 2.45262 3.78628 1.33333 5.16699 1.33333H10.8337C12.2144 1.33333 13.3337 2.45262 13.3337 3.83333V8.44493C12.4141 8.11113 11.3438 8.31293 10.6063 9.0504L8.10633 11.5504C7.82506 11.8317 7.66699 12.2133 7.66699 12.6111V14.1666C7.66699 14.3419 7.69706 14.5103 7.75239 14.6667H5.16699C3.78628 14.6667 2.66699 13.5474 2.66699 12.1667V3.83333ZM5.33366 4.5C5.33366 4.22386 5.55752 4 5.83366 4H10.167C10.4431 4 10.667 4.22386 10.667 4.5C10.667 4.77614 10.4431 5 10.167 5H5.83366C5.55752 5 5.33366 4.77614 5.33366 4.5ZM5.83366 6.66667C5.55752 6.66667 5.33366 6.89053 5.33366 7.16667C5.33366 7.4428 5.55752 7.66667 5.83366 7.66667H7.50033C7.77646 7.66667 8.00033 7.4428 8.00033 7.16667C8.00033 6.89053 7.77646 6.66667 7.50033 6.66667H5.83366Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.869 10.4646C12.6347 10.2303 12.2549 10.2303 12.0205 10.4646L9.66699 12.8182V13.6666H10.5155L12.869 11.3131C13.1033 11.0788 13.1033 10.6989 12.869 10.4646ZM11.3135 9.75753C11.9383 9.13267 12.9513 9.13267 13.5761 9.75753C14.2009 10.3823 14.2009 11.3953 13.5761 12.0202L11.0761 14.5202C10.9823 14.6139 10.8551 14.6666 10.7225 14.6666H9.16699C8.89086 14.6666 8.66699 14.4427 8.66699 14.1666V12.6111C8.66699 12.4785 8.71966 12.3513 8.81346 12.2575L11.3135 9.75753Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.3787 2.66667H10.8337C12.2144 2.66667 13.3337 3.78595 13.3337 5.16667V12.1667C13.3337 13.5474 12.2144 14.6667 10.8337 14.6667H5.16699C3.78628 14.6667 2.66699 13.5474 2.66699 12.1667V5.16667C2.66699 3.78595 3.78628 2.66667 5.16699 2.66667H5.62201C6.04117 1.8737 6.87433 1.33333 7.83366 1.33333H8.16699C9.12633 1.33333 9.95946 1.8737 10.3787 2.66667ZM9.66699 3.83333C9.66699 3.00491 8.99539 2.33333 8.16699 2.33333H7.83366C7.00526 2.33333 6.33366 3.00491 6.33366 3.83333V4.16667C6.33366 4.25871 6.40828 4.33333 6.50033 4.33333H9.50033C9.59239 4.33333 9.66699 4.25871 9.66699 4.16667V3.83333Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.83366 1.33334C5.45295 1.33334 4.33366 2.45262 4.33366 3.83334V4.66464C4.33366 5.81391 3.87711 6.91614 3.06446 7.72874L2.81344 7.9798C2.71967 8.07354 2.66699 8.20074 2.66699 8.33334V10.1667C2.66699 10.2993 2.71967 10.4265 2.81344 10.5202C2.90721 10.614 3.03439 10.6667 3.16699 10.6667H7.50033V14.1667C7.50033 14.4428 7.72419 14.6667 8.00033 14.6667C8.27646 14.6667 8.50033 14.4428 8.50033 14.1667V10.6667H12.8337C13.1098 10.6667 13.3337 10.4428 13.3337 10.1667V8.33334C13.3337 8.20074 13.281 8.07354 13.1872 7.9798L12.9362 7.72874C12.1235 6.91614 11.667 5.81391 11.667 4.66464V3.83334C11.667 2.45262 10.5477 1.33334 9.16699 1.33334H6.83366Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UnpinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.87621 1.18107C2.14427 0.928813 2.56657 0.941759 2.81892 1.20971L4.76553 3.27807L4.76619 3.27677L11.7212 10.6667H11.72L13.4856 12.5431C13.7379 12.8111 13.725 13.2334 13.4569 13.4857C13.1888 13.7381 12.7666 13.7252 12.5142 13.4571L9.88791 10.6667H8.66657V13.4213C8.66657 13.4729 8.6545 13.5242 8.63144 13.5704L8.14897 14.5353C8.08757 14.658 7.91224 14.658 7.85084 14.5353L7.36837 13.5704C7.3453 13.5241 7.33324 13.4729 7.33324 13.4213V10.6667H3.99991C3.29379 10.6666 2.60161 10.0711 2.71996 9.24093L2.76749 8.963C3.01556 7.7056 3.70633 6.61008 4.66657 5.83992L5.06175 5.53914L1.84757 2.12377C1.59541 1.85565 1.60817 1.43335 1.87621 1.18107Z"
        fill="currentColor"
      />
      <path
        d="M8.6665 1.3334C10.1391 1.33356 11.3331 2.52748 11.3332 4.00007V5.83991C12.3636 6.66634 13.0838 7.86746 13.2798 9.24092C13.3297 9.59106 13.2338 9.89852 13.0552 10.1381L5.47705 2.086C5.95713 1.62051 6.61172 1.33348 7.33317 1.3334H8.6665Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.24601 3.33334H2.16699C1.89085 3.33334 1.66699 3.5572 1.66699 3.83334C1.66699 4.10948 1.89085 4.33334 2.16699 4.33334H2.66697C2.66699 4.34494 2.6674 4.35662 2.66822 4.36836L3.2281 12.3418C3.32005 13.6513 4.4092 14.6667 5.72196 14.6667H10.2787C11.5915 14.6667 12.6806 13.6513 12.7725 12.3418L13.3325 4.36836C13.3333 4.35662 13.3337 4.34494 13.3337 4.33334H13.8337C14.1098 4.33334 14.3337 4.10948 14.3337 3.83334C14.3337 3.5572 14.1098 3.33334 13.8337 3.33334H10.7547C10.4547 2.09005 9.33573 1.16667 8.00039 1.16667C6.66504 1.16667 5.54599 2.09005 5.24601 3.33334ZM6.29188 3.33334H9.70886C9.44219 2.65056 8.77752 2.16667 8.00039 2.16667C7.22319 2.16667 6.55853 2.65056 6.29188 3.33334ZM6.66699 6.50001C6.94313 6.50001 7.16699 6.72387 7.16699 7.00001V10.8333C7.16699 11.1095 6.94313 11.3333 6.66699 11.3333C6.39085 11.3333 6.16699 11.1095 6.16699 10.8333V7.00001C6.16699 6.72387 6.39085 6.50001 6.66699 6.50001ZM9.33366 6.50001C9.60979 6.50001 9.83366 6.72387 9.83366 7.00001V10.8333C9.83366 11.1095 9.60979 11.3333 9.33366 11.3333C9.05753 11.3333 8.83366 11.1095 8.83366 10.8333V7.00001C8.83366 6.72387 9.05753 6.50001 9.33366 6.50001Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.50016 6.8335C1.85583 6.8335 1.3335 7.35583 1.3335 8.00016C1.3335 8.6445 1.85583 9.16683 2.50016 9.16683C3.1445 9.16683 3.66683 8.6445 3.66683 8.00016C3.66683 7.35583 3.1445 6.8335 2.50016 6.8335Z"
        fill="currentColor"
      />
      <path
        d="M8.00016 6.8335C7.35583 6.8335 6.8335 7.35583 6.8335 8.00016C6.8335 8.6445 7.35583 9.16683 8.00016 9.16683C8.6445 9.16683 9.16683 8.6445 9.16683 8.00016C9.16683 7.35583 8.6445 6.8335 8.00016 6.8335Z"
        fill="currentColor"
      />
      <path
        d="M13.5002 6.8335C12.8558 6.8335 12.3335 7.35583 12.3335 8.00016C12.3335 8.6445 12.8558 9.16683 13.5002 9.16683C14.1445 9.16683 14.6668 8.6445 14.6668 8.00016C14.6668 7.35583 14.1445 6.8335 13.5002 6.8335Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[12px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground font-mono text-sm font-medium">
        <SlotTextWithFallback text={value} />
      </span>
    </div>
  );
}
