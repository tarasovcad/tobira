"use client";

import {useQueryClient} from "@tanstack/react-query";
import {useEffect} from "react";
import {
  findBookmarkInQueryCache,
  isOptimisticBookmarkId,
} from "@/features/add-item/_utils/optimistic-bookmark-cache";
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";

export function useWebsiteBookmarkMenu() {
  const item = useBookmarkMenuStore((state) => state.item);
  const open = useBookmarkMenuStore((state) => state.isOpen);
  const setItem = useBookmarkMenuStore((state) => state.setItem);
  const onDelete = useBookmarkMenuStore((state) => state.onDelete);
  const onArchive = useBookmarkMenuStore((state) => state.onArchive);
  const setMenuOpen = useBookmarkMenuStore((state) => state.setMenuOpen);
  const queryClient = useQueryClient();

  const websiteItem = item?.kind === "website" ? item : undefined;
  const isOpen = open && !!websiteItem;
  const websiteItemId = websiteItem?.id;

  useEffect(() => {
    if (!isOpen || !websiteItemId) return;

    return queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] !== "bookmarks") return;

      const fresh = findBookmarkInQueryCache(queryClient, websiteItemId);
      if (fresh) setItem(fresh);
    });
  }, [isOpen, queryClient, setItem, websiteItemId]);

  const isSaving = isOptimisticBookmarkId(websiteItem?.id);
  const metadataLoading = websiteItem?.metadata?.textMetadataStatus === "pending";

  return {
    websiteItem,
    isOpen,
    isSaving,
    metadataLoading,
    fieldsLocked: isSaving || metadataLoading,
    onDelete,
    onArchive,
    setMenuOpen,
  };
}
