"use client";

import {useMemo, useState} from "react";
import {type QueryKey, useMutation, useQueryClient} from "@tanstack/react-query";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";
import {
  addWebsiteBookmark,
  addMediaBookmark,
  addPostBookmark,
  type AddWebsiteBookmarkResult,
  type AddMediaBookmarkResult,
  type AddPostBookmarkResult,
} from "@/app/actions/bookmarks/create";
import {addBulkWebsiteBookmarks} from "@/app/actions/bookmarks/addBulkWebsiteBookmarks";
import {toastManager} from "@/components/ui/coss/toast";
import type {BookmarkMediaItem} from "@/components/bookmark/types/metadata";
import {
  homeMetadataKeys,
  useCollectionsQuery,
  useTagsQuery,
} from "@/features/home/hooks/use-home-metadata-query";
import {useAddItemDialogStore} from "@/store/use-add-item-dialog";
import {trackClientEvent} from "@/lib/analytics/client";
import {normalizeInputUrl} from "@/lib/fetch/web/url";
import {extractUrls} from "../_utils/extract-urls";
import {getBookmarkErrorCode} from "@/components/bookmark/_utils/bookmark-analytics";
import {
  addBookmarkSchema,
  createAddBookmarkDefaultValues,
  type AddBookmarkFormValues,
} from "../add-bookmark-schema";
import {
  bookmarkCountQueryMatchesInput,
  bookmarkListQueryMatchesInput,
  insertCreatedBookmark,
  type AddBookmarkMutationContext,
  type AddBookmarkMutationInput,
  type BookmarksInfiniteData,
} from "../_utils/optimistic-bookmark-cache";

function getUrlHost(url: string) {
  try {
    return normalizeInputUrl(url).hostname.replace(/^www\./, "");
  } catch {
    return "invalid_url";
  }
}

export function useAddBookmarkFlow({
  userId,
  isAuthenticated,
  defaultType = "website",
  defaultCollectionId = null,
  defaultTagNames = [],
}: {
  userId?: string;
  isAuthenticated: boolean;
  defaultType?: AddBookmarkFormValues["type"];
  defaultCollectionId?: string | null;
  defaultTagNames?: string[];
}) {
  const router = useRouter();
  const open = useAddItemDialogStore((state) => state.isOpen);
  const setDialogOpen = useAddItemDialogStore((state) => state.setDialogOpen);
  const closeDialog = useAddItemDialogStore((state) => state.closeDialog);
  const [step, setStep] = useState<1 | 2>(1);
  const [resetKey, setResetKey] = useState(0);
  const [mediaItems, setMediaItems] = useState<BookmarkMediaItem[]>([]);
  const [selectedMediaUrls, setSelectedMediaUrls] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const {data: collections = []} = useCollectionsQuery({
    userId,
    enabled: open && !!userId,
  });
  const {data: tags = []} = useTagsQuery({
    userId,
    enabled: open && !!userId,
  });

  const form = useForm<AddBookmarkFormValues>({
    resolver: zodResolver(addBookmarkSchema),
    defaultValues: createAddBookmarkDefaultValues({
      type: defaultType,
      collectionId: defaultCollectionId,
      tagNames: defaultTagNames,
    }),
    mode: "onChange",
  });

  const collectionItems = useMemo(
    () =>
      collections.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    [collections],
  );

  const addItemMutation = useMutation<
    AddWebsiteBookmarkResult | AddMediaBookmarkResult | AddPostBookmarkResult,
    Error,
    AddBookmarkMutationInput,
    AddBookmarkMutationContext
  >({
    mutationKey: ["add-bookmark"],
    onMutate: async (input) => {
      if (input.kind !== "website") {
        return {previousBookmarkQueries: [], previousCountQueries: []};
      }

      await queryClient.cancelQueries({queryKey: ["bookmarks"]});
      return {previousBookmarkQueries: [], previousCountQueries: []};
    },
    mutationFn: async (input) => {
      if (input.kind === "website") {
        return addWebsiteBookmark(input);
      }
      if (input.kind === "media") {
        return addMediaBookmark({
          url: input.url,
          tags: input.tags,
          collectionId: input.collectionId,
          kind: input.kind,
          selectedMediaUrls: input.selectedMediaUrls,
        });
      }
      return addPostBookmark(input);
    },
    onSuccess: (res, variables) => {
      if (variables.kind === "website" && "bookmark" in res) {
        const matchesListQuery = (queryKey: QueryKey) =>
          bookmarkListQueryMatchesInput({
            queryKey,
            input: variables,
            userId,
            defaultTagNames,
          });
        const matchesCountQuery = (queryKey: QueryKey) =>
          bookmarkCountQueryMatchesInput({
            queryKey,
            input: variables,
            userId,
            defaultTagNames,
          });

        queryClient.setQueriesData<BookmarksInfiniteData>(
          {
            queryKey: ["bookmarks", "all-items"],
            type: "active",
            predicate: (query) => matchesListQuery(query.queryKey),
          },
          (current) => insertCreatedBookmark(current, res.bookmark),
        );
        queryClient.setQueriesData<number>(
          {
            queryKey: ["bookmarks", "count"],
            type: "active",
            predicate: (query) => matchesCountQuery(query.queryKey),
          },
          (current) => (typeof current === "number" ? current + 1 : current),
        );
      }

      if (
        variables.kind === "media" &&
        "media" in res &&
        Array.isArray(res.media) &&
        res.media.length > 1 &&
        !("selectedMediaUrls" in variables && variables.selectedMediaUrls)
      ) {
        const nextMediaItems = res.mediaItems ?? res.media.map((url) => ({type: "photo", url}));
        setMediaItems(nextMediaItems);
        setSelectedMediaUrls(nextMediaItems.map((item) => item.url));
        setStep(2);
        return;
      }

      closeDialog();
      toastManager.add({
        title: "Bookmark added",
        type: "success",
      });
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
      queryClient.invalidateQueries({queryKey: homeMetadataKeys.tagsRoot});
      setTimeout(() => {
        form.reset(getDefaultValues());
        setStep(1);
        setMediaItems([]);
        setSelectedMediaUrls([]);
      }, 500);
    },
    onError: (err, _variables, context) => {
      context?.previousBookmarkQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      context?.previousCountQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      trackClientEvent("bookmark_add_failed", {
        kind: _variables.kind,
        error_code: getBookmarkErrorCode(err),
      });

      toastManager.add({
        title: "Submit failed",
        description:
          (err instanceof Error ? err.message : "Unknown error")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 160) || "Unknown error",
        type: "error",
      });
    },
  });

  const onSubmit = async (data: AddBookmarkFormValues) => {
    const parsedUrls = extractUrls(data.url);

    if (parsedUrls.length > 1) {
      closeDialog();

      if (data.type === "website") {
        try {
          const res = await addBulkWebsiteBookmarks({
            urls: parsedUrls,
            tags: data.tags,
            collectionId: data.collectionId ?? undefined,
          });

          if (res.bookmarks.length > 0) {
            const count = res.bookmarks.length;
            const rejectedCount = res.rejected.length + res.duplicates.length;
            const rejectedSuffix = rejectedCount > 0 ? ` (${rejectedCount} skipped)` : "";
            toastManager.add({
              title:
                count === 1
                  ? `Bookmark added${rejectedSuffix}`
                  : `${count} bookmarks added${rejectedSuffix}`,
              type: "success",
            });
            queryClient.invalidateQueries({queryKey: ["bookmarks"]});
            queryClient.invalidateQueries({queryKey: homeMetadataKeys.tagsRoot});
          }
        } catch (err) {
          toastManager.add({
            title: "Submit failed",
            description: err instanceof Error ? err.message : "Unknown error",
            type: "error",
          });
        }

        setTimeout(() => {
          resetLocalState();
        }, 500);
        return;
      }

      toastManager.add({
        title: `Adding ${parsedUrls.length} bookmarks...`,
        type: "info",
      });

      const results = await Promise.allSettled(
        parsedUrls.map((targetUrl) => {
          if (data.type === "media") {
            return addMediaBookmark({
              url: targetUrl,
              tags: data.tags,
              collectionId: data.collectionId ?? undefined,
              kind: "media",
            });
          }
          return addPostBookmark({
            url: targetUrl,
            tags: data.tags,
            collectionId: data.collectionId ?? undefined,
            kind: "post",
          });
        }),
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toastManager.add({
          title: `Successfully added ${successful} bookmark${successful > 1 ? "s" : ""}`,
          type: "success",
        });
        queryClient.invalidateQueries({queryKey: ["bookmarks"]});
        queryClient.invalidateQueries({queryKey: homeMetadataKeys.tagsRoot});
      }

      if (failed > 0) {
        toastManager.add({
          title: `Failed to add ${failed} bookmark${failed > 1 ? "s" : ""}`,
          type: "error",
        });
      }

      setTimeout(() => {
        resetLocalState();
      }, 500);
      return;
    }

    trackClientEvent("bookmark_add_submitted", {
      kind: data.type,
      url_host: getUrlHost(data.url),
      tag_count: data.tags.length,
      has_collection: Boolean(data.collectionId),
    });

    switch (data.type) {
      case "website":
        addItemMutation.mutate({
          url: data.url,
          tags: data.tags,
          collectionId: data.collectionId ?? undefined,
          kind: "website",
        });
        closeDialog();
        break;
      case "media":
        addItemMutation.mutate({
          url: data.url,
          tags: data.tags,
          collectionId: data.collectionId ?? undefined,
          kind: "media",
        });
        break;
      case "post":
        addItemMutation.mutate({
          url: data.url,
          tags: data.tags,
          collectionId: data.collectionId ?? undefined,
          kind: "post",
        });
        closeDialog();
        break;
      default:
        throw new Error("Invalid item type");
    }
  };

  const resetLocalState = () => {
    form.reset(getDefaultValues());
    setResetKey((key) => key + 1);
    setStep(1);
    setMediaItems([]);
    setSelectedMediaUrls([]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !isAuthenticated) {
      closeDialog();
      router.push("/login");
      return;
    }

    if (nextOpen) {
      resetLocalState();
    }

    setDialogOpen(nextOpen);
    if (!nextOpen) {
      setTimeout(() => {
        resetLocalState();
      }, 500);
    }
  };

  const handleOpenDialogClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    resetLocalState();
    setDialogOpen(true);
  };

  const confirmMediaSelection = () => {
    const data = form.getValues();
    addItemMutation.mutate({
      url: data.url,
      tags: data.tags,
      collectionId: data.collectionId ?? undefined,
      kind: "media",
      selectedMediaUrls,
      selectedMediaItems: mediaItems.filter((item) => selectedMediaUrls.includes(item.url)),
    });
    closeDialog();
  };

  const toggleMediaUrl = (url: string) => {
    setSelectedMediaUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  };

  return {
    open,
    step,
    mediaItems,
    selectedMediaUrls,
    toggleMediaUrl,
    form,
    resetKey,
    addItemMutation,
    collectionItems,
    tags,
    handleOpenChange,
    handleOpenDialogClick,
    handleSubmitForm: form.handleSubmit(onSubmit),
    confirmMediaSelection,
  };

  function getDefaultValues() {
    return createAddBookmarkDefaultValues({
      type: defaultType,
      collectionId: defaultCollectionId,
      tagNames: defaultTagNames,
    });
  }
}
