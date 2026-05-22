"use client";

import {useMemo, useCallback} from "react";
import {Controller} from "react-hook-form";
import Image from "next/image";
import {SearchIcon} from "lucide-react";
import {cn} from "@/lib/utils";
import {formatDateWithTime} from "@/lib/utils/dates";
import MediaPreview from "@/features/media/components/MediaPreview";
import {Sheet, SheetContent, SheetPanel} from "@/components/ui/coss/sheet";
import {Button} from "@/components/ui/coss/button";
import {Separator} from "@/components/ui/legacy-shadcn/separator";
import {Textarea} from "@/components/ui/coss/textarea";
import TagsInput from "@/components/ui/app/tags-input";
import {useCollectionsQuery, useTagsQuery} from "@/features/home/hooks/use-home-metadata-query";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/coss/combobox";
import {SelectButton, Select} from "@/components/ui/coss/select";
import {type UpdateBookmarkData} from "@/app/actions/bookmarks";
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";
import Spinner from "@/components/ui/app/spinner";
import {useBookmarkForm} from "../../_hooks/use-bookmark-form";
import {BookmarkFormValues, normalizeTagsForCompare} from "../../_utils/bookmark-schema";
import {useBookmarkMutations} from "../../_hooks/use-bookmark-mutations";
import {BookmarkMenuActions} from "../shared/BookmarkMenuActions";
import BookmarkMenuDetails from "../shared/BookmarkMenuDetails";
import type {PostBookmarkMetadata} from "@/components/bookmark/types/metadata";
import type {PostBookmark} from "@/components/bookmark/types";
import {
  getPostBookmarkMediaPreviewItems,
  type PostBookmarkPreviewItem,
} from "../../_utils/post-bookmark-preview";

// ── 0 images ──────────────────────────────────────────────────────────────────

function NoMediaPanel({meta}: {meta: PostBookmarkMetadata}) {
  return (
    <div className="bg-muted relative flex aspect-video w-full items-center justify-center overflow-hidden border-b px-8">
      <div className="flex w-full max-w-[400px] flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-background ring-border h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1">
            <Image
              src={meta.user_profile_image_url}
              alt={meta.user_name}
              width={32}
              height={32}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-foreground truncate text-[13px] font-semibold">
              {meta.user_name}
            </span>
            <span className="text-muted-foreground text-[12px]">@{meta.user_screen_name}</span>
          </div>
        </div>

        <p className="text-foreground line-clamp-5 text-[14px] leading-snug whitespace-pre-wrap">
          {meta.text}
        </p>
      </div>
    </div>
  );
}

// ── 1–4 images ────────────────────────────────────────────────────────────────

function MediaPanel({media}: {media: PostBookmarkPreviewItem[]}) {
  const count = Math.min(media.length, 4);
  const items = media.slice(0, count);

  return (
    <div className="relative aspect-video w-full overflow-hidden border-b">
      <div
        className={cn("grid h-full w-full gap-[2px]", count === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {items.map((m, i) => {
          const isFirstOfThree = count === 3 && i === 0;
          const isVideo = m.type === "video";

          return (
            <div
              key={m.key}
              className={cn(
                "bg-muted relative h-full w-full overflow-hidden",
                isFirstOfThree && "row-span-2",
              )}>
              <MediaPreview
                src={m.src}
                fullSizeSrc={isVideo ? undefined : m.fullSizeSrc}
                alt={m.alt}
                width={m.width}
                height={m.height}
                poster={m.poster}
                type={isVideo ? "video" : "image"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostBookmarkMenuPreview({item, meta}: {item: PostBookmark; meta: PostBookmarkMetadata}) {
  const media = getPostBookmarkMediaPreviewItems(item, "main", "menu");
  return media.length > 0 ? <MediaPanel media={media} /> : <NoMediaPanel meta={meta} />;
}

export function PostBookmarkMenu({userId}: {userId: string | null}) {
  const item = useBookmarkMenuStore((state) => state.item);
  const open = useBookmarkMenuStore((state) => state.isOpen);
  const onDelete = useBookmarkMenuStore((state) => state.onDelete);
  const onArchive = useBookmarkMenuStore((state) => state.onArchive);
  const setMenuOpen = useBookmarkMenuStore((state) => state.setMenuOpen);
  const setMenuItem = useBookmarkMenuStore((state) => state.setItem);
  const postItem = item?.kind === "post" ? item : undefined;
  const isOpen = open && !!postItem;

  const data = useMemo(() => {
    return {
      source: postItem?.url,
      type: postItem?.kind
        ? postItem.kind.charAt(0).toUpperCase() + postItem.kind.slice(1)
        : undefined,
      saved: formatDateWithTime(postItem?.created_at ?? ""),
      updated: formatDateWithTime(postItem?.updated_at ?? ""),
      metadata: postItem?.metadata,
    };
  }, [postItem]);

  const {form, originalValues, setOriginalValues, hasChanges} = useBookmarkForm(postItem, isOpen);
  const {
    control,
    handleSubmit,
    reset,
    formState: {errors, isValid},
  } = form;

  const {data: collections = []} = useCollectionsQuery({
    userId,
    enabled: isOpen && !!userId,
  });

  const {data: tags = []} = useTagsQuery({
    userId,
    enabled: isOpen && !!userId,
  });

  const collectionItems = useMemo(
    () =>
      collections.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    [collections],
  );

  const {updateMutation, archiveMutation, resetMutation} = useBookmarkMutations({
    onOpenChange: setMenuOpen,
    originalValues,
    setOriginalValues,
    form,
    onItemReset: ({title, description, updatedAt}) => {
      if (!postItem) return;
      setMenuItem({
        ...postItem,
        title,
        description,
        updated_at: updatedAt,
      });
    },
  });
  const {mutate: updateBookmark, isPending: isUpdating} = updateMutation;
  const {mutate: archiveBookmark, isPending: isArchiving} = archiveMutation;
  const {mutate: resetBookmark, isPending: isResetting} = resetMutation;

  const onSubmit = useCallback(
    (values: BookmarkFormValues) => {
      if (!postItem) return;

      const updates: UpdateBookmarkData = {};

      if ((values.notes ?? "") !== (originalValues.notes ?? "")) {
        updates.notes = values.notes ?? "";
      }

      if (normalizeTagsForCompare(values.tags) !== normalizeTagsForCompare(originalValues.tags)) {
        updates.tags = values.tags ?? [];
      }

      if ((values.collectionId ?? null) !== (originalValues.collectionId ?? null)) {
        updates.collectionId = values.collectionId ?? null;
      }

      if (Object.keys(updates).length === 0) {
        return;
      }

      updateBookmark({bookmarkId: postItem.id, updates});
    },
    [originalValues, postItem, updateBookmark],
  );

  const handleReset = useCallback(() => {
    if (postItem) {
      resetBookmark(postItem.id);
    }
  }, [postItem, resetBookmark]);

  const handleClearChanges = useCallback(() => {
    reset(originalValues);
  }, [originalValues, reset]);

  const handleArchive = useCallback(() => {
    if (postItem) {
      if (onArchive) {
        onArchive(postItem);
      } else {
        archiveBookmark(postItem.id);
      }
    }
  }, [archiveBookmark, onArchive, postItem]);

  const handleDelete = useCallback(() => {
    if (postItem && onDelete) {
      onDelete(postItem);
    }
  }, [onDelete, postItem]);

  const actionProps = useMemo(
    () => ({
      onArchive: handleArchive,
      isArchiving,
      kind: "post" as const,
      onPreviewClick: () => {},
      onReset: handleReset,
      isResetting,
      onDelete: handleDelete,
    }),
    [handleArchive, isArchiving, handleReset, isResetting, handleDelete],
  );

  const disableSubmit = !hasChanges || !isValid || isUpdating || isArchiving || isResetting;

  return (
    <Sheet open={isOpen} onOpenChange={setMenuOpen}>
      <SheetContent
        side="right"
        className="max-w-[560px]"
        scrollFadeTop={false}
        scrollFadeBottom={false}
        scrollFadeLeft={false}
        scrollFadeRight={false}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col overflow-hidden">
          <div className="min-h-0 flex-1">
            <SheetPanel className="p-0 pt-0!">
              {postItem?.metadata ? (
                <PostBookmarkMenuPreview item={postItem} meta={postItem.metadata} />
              ) : (
                <div className="bg-muted aspect-video w-full border-b" />
              )}

              <div className="p-6">
                <BookmarkMenuActions {...actionProps} />
              </div>

              <Separator />

              <BookmarkMenuDetails
                source={data.source}
                type={data.type}
                kind="post"
                metadata={data.metadata}
                saved={data.saved}
                updated={data.updated}
                showUpdated={postItem?.updated_at !== postItem?.created_at}
              />

              <Separator />

              <div className="p-6 text-sm">
                <div className="text-foreground mb-3 text-[15px] font-[550]">Collection</div>
                <Controller
                  name="collectionId"
                  control={control}
                  render={({field}) => {
                    const selectedCollection =
                      collectionItems.find((ci) => ci.value === field.value) ?? null;

                    return (
                      <Combobox
                        items={collectionItems}
                        value={selectedCollection}
                        onValueChange={(val) => field.onChange(val?.value ?? null)}>
                        <Select>
                          <ComboboxTrigger render={<SelectButton />}>
                            <ComboboxValue placeholder="Select a collection" />
                          </ComboboxTrigger>
                        </Select>
                        <ComboboxPopup
                          aria-label="Select a collection"
                          className="w-(--anchor-width)">
                          <div className="border-b p-2">
                            <ComboboxInput
                              className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
                              placeholder="Search collections..."
                              showTrigger={false}
                              startAddon={<SearchIcon className="size-4" />}
                            />
                          </div>
                          <ComboboxEmpty>No collections found.</ComboboxEmpty>
                          <ComboboxList>
                            {(ci) => (
                              <ComboboxItem key={ci.value} value={ci}>
                                {ci.label}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxPopup>
                      </Combobox>
                    );
                  }}
                />
              </div>

              <Separator />

              <div className="p-6 text-[15px]">
                <Controller
                  name="tags"
                  control={control}
                  render={({field}) => (
                    <>
                      <TagsInput
                        value={field.value ?? []}
                        onValueChange={field.onChange}
                        label="Tags"
                        placeholder="Add tags..."
                        availableTags={tags.map((t) => t.name)}
                        userTags={tags.map((t) => t.name)}
                        sourceUrl={postItem?.url}
                        itemType="post"
                        labelClassName="text-[15px]! font-[550]"
                        containerClassName="max-w-full gap-3"
                      />
                      {errors.tags?.message ? (
                        <div className="text-destructive mt-2 text-sm">{errors.tags.message}</div>
                      ) : null}
                    </>
                  )}
                />
              </div>

              <Separator />

              <div className="p-6 text-[14px]">
                <div className="text-foreground text-[15px] font-[550]">Notes</div>
                <div className="mt-3">
                  <Controller
                    name="notes"
                    control={control}
                    render={({field}) => (
                      <Textarea
                        {...field}
                        placeholder="Write personal notes..."
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        error={errors.notes?.message}
                        className="sm:text-[15px]"
                      />
                    )}
                  />
                </div>
              </div>
            </SheetPanel>
          </div>

          <div className="bg-background sticky bottom-0 border-t px-6 py-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={handleClearChanges}
                disabled={isResetting || !hasChanges}>
                Cancel
              </Button>
              <Button variant="default" type="submit" disabled={disableSubmit || isResetting}>
                {isUpdating && <Spinner className="size-4" />}
                Save
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
