"use client";

import React, {useEffect, useState} from "react";
import {usePathname, useSearchParams, useRouter} from "next/navigation";
import {cn} from "@/lib/utils";
import {buttonVariants} from "../../shadcn/button";
import {AnimatePresence, motion} from "framer-motion";
import type {Collection} from "@/app/actions/collections";
import {SidebarSectionMenu} from "./SidebarSectionMenu";
import {SidebarCollectionItem, SidebarCollectionSkeleton} from "./SidebarItems";
import {SelectionActionBar} from "@/components/bookmark/SelectionActionBar";
import {useCollectionDialogStore} from "@/store/use-collection-dialog-store";
import {useDeleteCollectionDialogStore} from "@/store/use-delete-collection-dialog-store";
import {useClipboardCopy} from "@/lib/hooks/use-clipboard-copy";
import {useCollectionsQuery} from "@/features/home/hooks/use-home-metadata-query";

export function SidebarCollections({
  allCollections,
  isAuthenticated = false,
  userId,
}: {
  allCollections?: Collection[];
  isAuthenticated?: boolean;
  userId?: string;
}) {
  const {data: collections = [], isFetching} = useCollectionsQuery({
    userId,
    initialData: allCollections,
  });

  return (
    <SidebarCollectionsContent
      collections={collections}
      isFetching={isFetching}
      isAuthenticated={isAuthenticated}
    />
  );
}

function SidebarCollectionsContent({
  collections,
  isFetching,
  isAuthenticated = false,
}: {
  collections: Collection[];
  isFetching: boolean;
  isAuthenticated?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const openDialog = useCollectionDialogStore((state) => state.openDialog);
  const openDeleteDialog = useDeleteCollectionDialogStore((state) => state.openDialog);
  const {copyText} = useClipboardCopy(2000, {toast: true});

  const handleCreateCollection = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    openDialog();
  };

  const [collectionsExpanded, setCollectionsExpanded] = useState(true);
  const [collectionSelectionMode, setCollectionSelectionMode] = useState(false);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [collectionMenuOpen, setCollectionMenuOpen] = useState(false);
  const [collectionsSelectValue, setCollectionsSelectValue] = useState("all");

  useEffect(() => {
    if (!collectionSelectionMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCollectionSelectionMode(false);
        setSelectedCollectionIds(new Set());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collectionSelectionMode]);

  const selectedCollectionCount = selectedCollectionIds.size;
  const allCollectionsSelected = collections.length
    ? selectedCollectionCount === collections.length
    : false;

  const handleClearCollectionSelection = React.useCallback(() => {
    setSelectedCollectionIds(new Set());
    setCollectionSelectionMode(false);
  }, []);

  const handleSelectAllCollections = React.useCallback(() => {
    if (allCollectionsSelected) {
      setSelectedCollectionIds(new Set());
    } else {
      setSelectedCollectionIds(new Set(collections.map((c) => c.id)));
    }
  }, [allCollectionsSelected, collections]);

  const handleDeleteSelectedCollections = React.useCallback(() => {
    const selectedCols = collections.filter((c) => selectedCollectionIds.has(c.id));
    if (selectedCols.length === 0) return;
    openDeleteDialog(selectedCols, handleClearCollectionSelection);
  }, [selectedCollectionIds, collections, openDeleteDialog, handleClearCollectionSelection]);

  return (
    <>
      <div className="px-3 pe-2">
        <div
          tabIndex={0}
          role="button"
          onClick={() => setCollectionsExpanded((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setCollectionsExpanded((prev) => !prev);
            }
          }}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            "group/collections cursor-pointer text-[11px] font-semibold tracking-wider uppercase",
            "h-[37px]",
            "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          )}>
          <div className="flex items-center gap-0.5">
            <span className="">Collections</span>

            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center text-current transition-transform duration-200 ease-out",
                collectionsExpanded ? "rotate-0" : "-rotate-90",
              )}
              aria-hidden>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-0 transition-opacity duration-150 ease-out group-hover/collections:opacity-100">
                <path
                  d="M10.0879 5.1292C10.3156 4.90139 10.6849 4.90139 10.9127 5.1292C11.1405 5.35701 11.1405 5.72626 10.9127 5.95409L7.41274 9.45409C7.18489 9.68189 6.81564 9.68189 6.58785 9.45409L3.08784 5.95409C2.86004 5.72626 2.86004 5.35701 3.08784 5.1292C3.31565 4.90139 3.68491 4.90139 3.91272 5.1292L7.00027 8.21679L10.0879 5.1292Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <SidebarSectionMenu
              open={collectionMenuOpen}
              onOpenChange={setCollectionMenuOpen}
              selectionMode={collectionSelectionMode}
              onSelectionModeChange={(checked) => {
                setCollectionSelectionMode(checked);
                if (!checked) setSelectedCollectionIds(new Set());
                if (checked) setCollectionsExpanded(true);
                setCollectionMenuOpen(false);
              }}
              selectValue={collectionsSelectValue}
              onSelectValueChange={(v) => setCollectionsSelectValue(String(v))}
              ariaLabel="Collection options"
              triggerClassName="group-hover/collections:pointer-events-auto group-hover/collections:opacity-100 focus-visible:opacity-100 focus-visible:pointer-events-auto"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateCollection();
              }}
              className={cn(
                buttonVariants({variant: "ghost", size: "icon-xs"}),
                "text-muted-foreground hover:bg-foreground/5",
                "pointer-events-none opacity-0 transition-opacity duration-150 ease-out",
                "group-hover/collections:pointer-events-auto group-hover/collections:opacity-100",
                "focus-visible:pointer-events-auto focus-visible:opacity-100",
              )}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.5 1.875C7.84519 1.875 8.125 2.15482 8.125 2.5V6.875H12.5C12.8452 6.875 13.125 7.15481 13.125 7.5C13.125 7.84519 12.8452 8.125 12.5 8.125H8.125V12.5C8.125 12.8452 7.84519 13.125 7.5 13.125C7.15481 13.125 6.875 12.8452 6.875 12.5V8.125H2.5C2.15482 8.125 1.875 7.84519 1.875 7.5C1.875 7.15481 2.15482 6.875 2.5 6.875H6.875V2.5C6.875 2.15482 7.15481 1.875 7.5 1.875Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <AnimatePresence initial={false}>
            {collectionsExpanded && collections.length === 0 && !isFetching && (
              <motion.div
                initial={{opacity: 0, height: 0, filter: "blur(8px)"}}
                animate={{opacity: 1, height: "auto", filter: "blur(0px)"}}
                exit={{opacity: 0, height: 0, filter: "blur(8px)"}}
                transition={{duration: 0.2, ease: "easeOut"}}>
                <button
                  onClick={handleCreateCollection}
                  className={cn(
                    "text-secondary bg-transparent",
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    "hover:bg-muted hover:text-foreground transition-none!",
                    "cursor-pointer",
                    "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                  )}>
                  <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10 5C10.4602 5 10.8333 5.3731 10.8333 5.83333V9.16667H14.1667C14.6269 9.16667 15 9.53975 15 10C15 10.4602 14.6269 10.8333 14.1667 10.8333H10.8333V14.1667C10.8333 14.6269 10.4602 15 10 15C9.53975 15 9.16667 14.6269 9.16667 14.1667V10.8333H5.83333C5.3731 10.8333 5 10.4602 5 10C5 9.53975 5.3731 9.16667 5.83333 9.16667H9.16667V5.83333C9.16667 5.3731 9.53975 5 10 5Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="">Add collection</span>
                </button>
              </motion.div>
            )}
            {isFetching &&
              collections.length === 0 &&
              [1, 2, 3, 4].map((i, idx) => (
                <SidebarCollectionSkeleton
                  key={`col-skeleton-${i}`}
                  width={["w-[60%]", "w-[40%]", "w-[75%]", "w-[50%]"][idx % 4]}
                />
              ))}
            {collectionsExpanded &&
              collections.map((c, index) => {
                const isActive = pathname === "/home" && searchParams.get("collection") === c.id;
                return (
                  <SidebarCollectionItem
                    key={c.id}
                    collection={c}
                    index={index}
                    isActive={isActive}
                    selectionMode={collectionSelectionMode}
                    isSelected={selectedCollectionIds.has(c.id)}
                    onSelect={(checked) => {
                      setSelectedCollectionIds((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(c.id);
                        else next.delete(c.id);
                        return next;
                      });
                    }}
                    onToggleSelection={() => {
                      setSelectedCollectionIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(c.id)) next.delete(c.id);
                        else next.add(c.id);
                        return next;
                      });
                    }}
                    onCopy={() => void copyText(c.name, c.id)}
                    onContextMenuDelete={() => {
                      openDeleteDialog([{id: c.id, name: c.name}]);
                    }}
                  />
                );
              })}
          </AnimatePresence>
        </div>
      </div>

      <SelectionActionBar
        visible={collectionSelectionMode && selectedCollectionCount > 0}
        selectedCount={selectedCollectionCount}
        allSelected={allCollectionsSelected}
        onClearSelection={handleClearCollectionSelection}
        onSelectAll={handleSelectAllCollections}
        onDelete={handleDeleteSelectedCollections}
        displayArchive={false}
        displayFavorite={false}
        displayCopy={false}
      />
    </>
  );
}
