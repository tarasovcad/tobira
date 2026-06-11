"use client";

import {useState, useMemo, useCallback} from "react";
import {cn} from "@/lib/utils";
import {Controller} from "react-hook-form";
import {formatDateWithTime} from "@/lib/utils/dates";
import MediaPreview from "@/features/media/components/MediaPreview";
import {Sheet, SheetContent, SheetPanel} from "@/components/ui/coss/sheet";
import {Button} from "@/components/ui/coss/button";
import {Separator} from "@/components/ui/legacy-shadcn/separator";
import {Textarea} from "@/components/ui/coss/textarea";
import TagsInput from "@/components/ui/app/tags-input";
import {useCollectionsQuery, useTagsQuery} from "@/features/home/hooks/use-home-metadata-query";
import {SearchIcon} from "lucide-react";
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
import {type UpdateBookmarkData} from "@/app/actions/bookmarks/update";
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";
import Spinner from "@/components/ui/app/spinner";
import {useBookmarkForm} from "../../_hooks/use-bookmark-form";
import {BookmarkFormValues, normalizeTagsForCompare} from "../../_utils/bookmark-schema";
import {useBookmarkMutations} from "../../_hooks/use-bookmark-mutations";
import {BookmarkMenuActions} from "../shared/BookmarkMenuActions";
import BookmarkMenuDetails from "../shared/BookmarkMenuDetails";
import {getMediaBookmarkMenuPreviewItem} from "@/components/bookmark/_utils/media-bookmark-preview";
import {useBookmarkMenuPreviewClick} from "../../_hooks/use-bookmark-menu-preview-click";

const MAX_DESCRIPTION_LENGTH = 280;

function BookmarkDescriptionField({
  control,
  error,
}: {
  control: ReturnType<typeof useBookmarkForm>["form"]["control"];
  error?: string;
}) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  return (
    <Controller
      name="description"
      control={control}
      render={({field}) => {
        const description = field.value ?? "";
        const isLongDescription = description.length > MAX_DESCRIPTION_LENGTH;
        const displayedDescription = (() => {
          if (isDescriptionExpanded || !isLongDescription) return description;
          const truncated = description.slice(0, MAX_DESCRIPTION_LENGTH);
          const lastSpace = truncated.lastIndexOf(" ");
          return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
        })();

        if (!isDescriptionExpanded && isLongDescription) {
          return (
            <div>
              <p className="text-muted-foreground text-[15px] whitespace-pre-wrap">
                {displayedDescription}
              </p>
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded(true)}
                className="cursor-pointer text-[15px] text-[#1D9BF0] hover:underline focus:outline-none">
                Show more
              </button>
            </div>
          );
        }

        return (
          <Textarea
            {...field}
            unstyled
            spellCheck={false}
            value={description}
            onChange={(e) => field.onChange(e.target.value)}
            error={error}
            className="text-muted-foreground flex w-full bg-transparent p-0 text-[15px] outline-none [&_textarea]:min-h-0 [&_textarea]:resize-none [&_textarea]:p-0"
          />
        );
      }}
    />
  );
}

export function MediaBookmarkMenu({userId}: {userId: string | null}) {
  const item = useBookmarkMenuStore((state) => state.item);
  const open = useBookmarkMenuStore((state) => state.isOpen);
  const onDelete = useBookmarkMenuStore((state) => state.onDelete);
  const onArchive = useBookmarkMenuStore((state) => state.onArchive);
  const setMenuOpen = useBookmarkMenuStore((state) => state.setMenuOpen);
  const setMenuItem = useBookmarkMenuStore((state) => state.setItem);
  const mediaItem = item?.kind === "media" ? item : undefined;
  const isOpen = open && !!mediaItem;
  const canClickMediaPreview = useBookmarkMenuPreviewClick(isOpen, mediaItem?.id);

  const data = useMemo(() => {
    return {
      source: mediaItem?.url,
      type: mediaItem?.kind
        ? mediaItem.kind.charAt(0).toUpperCase() + mediaItem.kind.slice(1)
        : undefined,
      saved: formatDateWithTime(mediaItem?.created_at ?? ""),
      updated: formatDateWithTime(mediaItem?.updated_at ?? ""),
      metadata: mediaItem?.metadata,
    };
  }, [mediaItem]);

  const {form, originalValues, setOriginalValues, hasChanges} = useBookmarkForm(mediaItem, isOpen);
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
      if (!mediaItem) return;
      setMenuItem({
        ...mediaItem,
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
      if (!mediaItem) return;

      const updates: UpdateBookmarkData = {};

      if ((values.description ?? "") !== (originalValues.description ?? "")) {
        updates.description = values.description;
      }

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

      updateBookmark({bookmarkId: mediaItem.id, updates});
    },
    [mediaItem, originalValues, updateBookmark],
  );

  const handleReset = useCallback(() => {
    if (mediaItem) {
      resetBookmark(mediaItem.id);
    }
  }, [mediaItem, resetBookmark]);

  const handleClearChanges = useCallback(() => {
    reset(originalValues);
  }, [originalValues, reset]);

  const handleArchive = useCallback(() => {
    if (mediaItem) {
      if (onArchive) {
        onArchive(mediaItem);
      } else {
        archiveBookmark(mediaItem.id);
      }
    }
  }, [archiveBookmark, mediaItem, onArchive]);

  const handleDelete = useCallback(() => {
    if (mediaItem && onDelete) {
      onDelete(mediaItem);
    }
  }, [mediaItem, onDelete]);

  const mediaPreviewItem = useMemo(() => {
    if (!mediaItem) return null;
    return getMediaBookmarkMenuPreviewItem(mediaItem, 0);
  }, [mediaItem]);

  const actionProps = useMemo(
    () => ({
      onArchive: handleArchive,
      isArchiving,
      kind: "media" as const,
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
              {mediaItem?.id && mediaPreviewItem ? (
                <div
                  className={cn(
                    "bg-muted relative aspect-video w-full overflow-hidden border-b",
                    !canClickMediaPreview && "pointer-events-none",
                  )}>
                  <MediaPreview
                    src={mediaPreviewItem.src}
                    fullSizeSrc={mediaPreviewItem.fullSizeSrc}
                    alt={mediaPreviewItem.alt}
                    width={mediaPreviewItem.width}
                    height={mediaPreviewItem.height}
                    type={mediaPreviewItem.type}
                    sizes="100vw"
                    quality={60}
                    loading="lazy"
                    addZoom
                    className="h-full w-full object-cover"
                    buttonClassName="h-full w-full"
                    disableClickToOpen={!canClickMediaPreview}
                  />
                </div>
              ) : (
                <div className="bg-muted aspect-video w-full border-b" />
              )}

              <div className="p-6">
                <BookmarkMenuActions {...actionProps} />
              </div>

              <Separator />

              <div className="p-6">
                <BookmarkDescriptionField
                  key={`${mediaItem?.id ?? "none"}:${isOpen ? "open" : "closed"}`}
                  control={control}
                  error={errors.description?.message}
                />
              </div>

              <Separator />

              <BookmarkMenuDetails
                source={data.source}
                type={data.type}
                kind="media"
                metadata={data.metadata}
                saved={data.saved}
                updated={data.updated}
                showUpdated={mediaItem?.updated_at !== mediaItem?.created_at}
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
                        sourceUrl={mediaItem?.url}
                        itemType="media"
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
