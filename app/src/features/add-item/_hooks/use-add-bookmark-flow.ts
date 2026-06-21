"use client";

import {useMemo, useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useForm, useWatch} from "react-hook-form";
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
import {toastManager} from "@/components/ui/coss/toast";
import type {BookmarkMediaItem} from "@/components/bookmark/types/metadata";
import {
  homeMetadataKeys,
  useCollectionsQuery,
  useTagsQuery,
} from "@/features/home/hooks/use-home-metadata-query";
import {useAddItemDialogStore} from "@/store/use-add-item-dialog";
import {addBookmarkSchema, type AddBookmarkFormValues} from "../add-bookmark-schema";

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

  const {
    register,
    handleSubmit,
    control,
    reset,
    trigger,
    formState: {errors, isValid},
    getValues,
  } = useForm<AddBookmarkFormValues>({
    resolver: zodResolver(addBookmarkSchema),
    defaultValues: {
      url: "",
      tags: [...defaultTagNames],
      collectionId: defaultCollectionId,
      type: defaultType,
    },
    mode: "onChange",
  });
  const watchedUrl = useWatch({control, name: "url"});
  const watchedType = useWatch({control, name: "type"});

  const addItemMutation = useMutation<
    AddWebsiteBookmarkResult | AddMediaBookmarkResult | AddPostBookmarkResult,
    Error,
    | {url: string; tags: string[]; collectionId?: string; kind: "website"}
    | {
        url: string;
        tags: string[];
        collectionId?: string;
        kind: "media";
        selectedMediaUrls?: string[];
        selectedMediaItems?: BookmarkMediaItem[];
      }
    | {url: string; tags: string[]; collectionId?: string; kind: "post"}
  >({
    mutationKey: ["add-bookmark"],
    mutationFn: async (input) => {
      if (input.kind === "website") {
        return await addWebsiteBookmark(input);
      } else if (input.kind === "media") {
        return await addMediaBookmark({
          url: input.url,
          tags: input.tags,
          collectionId: input.collectionId,
          kind: input.kind,
          selectedMediaUrls: input.selectedMediaUrls,
        });
      } else if (input.kind === "post") {
        return await addPostBookmark(input);
      }
      throw new Error("Invalid kind");
    },
    onSuccess: (res, variables) => {
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
      if (variables.kind !== "website") {
        toastManager.add({
          title: "Bookmark added",
          type: "success",
        });
      }
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
      queryClient.invalidateQueries({queryKey: homeMetadataKeys.tagsRoot});
      setTimeout(() => {
        reset({
          url: "",
          tags: [...defaultTagNames],
          collectionId: defaultCollectionId,
          type: defaultType,
        });
        setStep(1);
        setMediaItems([]);
        setSelectedMediaUrls([]);
      }, 500);
    },
    onError: (err) => {
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

  const onSubmit = (data: AddBookmarkFormValues) => {
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

  const collectionItems = useMemo(
    () =>
      collections.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    [collections],
  );

  const resetLocalState = () => {
    reset({
      url: "",
      tags: [...defaultTagNames],
      collectionId: defaultCollectionId,
      type: defaultType,
    });
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
    const data = getValues();
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
    register,
    control,
    errors,
    isValid,
    trigger,
    watchedUrl,
    watchedType,
    addItemMutation,
    collectionItems,
    tags,
    handleOpenChange,
    handleOpenDialogClick,
    handleSubmitForm: handleSubmit(onSubmit),
    confirmMediaSelection,
  };
}
