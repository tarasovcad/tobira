"use client";

import {useState, useMemo, useEffect, useCallback} from "react";
import {Controller} from "react-hook-form";
import {formatDateWithTime} from "@/lib/utils/dates";
import {BookmarkImage} from "@/components/media/bookmark/BookmarkImage";
import {Sheet, SheetContent, SheetHeader, SheetPanel, SheetTitle} from "@/components/coss-ui/sheet";
import {Button} from "@/components/coss-ui/button";
import {Separator} from "@/components/shadcn/separator";
import {Textarea} from "@/components/coss-ui/textarea";
import TagsInput from "@/components/ui/TagsInput";
import {useCollectionsQuery, useTagsQuery} from "@/app/home/_hooks/use-home-metadata-query";
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
} from "@/components/coss-ui/combobox";
import {SelectButton, Select} from "@/components/coss-ui/select";
import {type UpdateBookmarkData} from "@/app/actions/bookmarks";
import {type BookmarkFormValues, normalizeTagsForCompare} from "./_utils/bookmark-schema";
import {useBookmarkForm} from "./_hooks/use-bookmark-form";
import {useBookmarkMutations} from "./_hooks/use-bookmark-mutations";
import {BookmarkPreviewDialog} from "@/components/media/bookmark/BookmarkPreviewDialog";
import {BookmarkMenuActions} from "./_components/BookmarkMenuActions";
import {BookmarkDetails} from "./_components/BookmarkDetails";
import {BookmarkPostMenuPanel} from "@/components/media/bookmark/BookmarkPostMenuPanel";
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";
import type {PostBookmarkMetadata} from "@/app/home/_types/bookmark-metadata";
import Spinner from "../ui/spinner";

export function BookmarkMenu({userId}: {userId: string | null}) {
  const item = useBookmarkMenuStore((state) => state.item);
  const open = useBookmarkMenuStore((state) => state.isOpen);
  const onDelete = useBookmarkMenuStore((state) => state.onDelete);
  const onArchive = useBookmarkMenuStore((state) => state.onArchive);
  const setMenuOpen = useBookmarkMenuStore((state) => state.setMenuOpen);
  const setMenuItem = useBookmarkMenuStore((state) => state.setItem);

  const data = useMemo(() => {
    return {
      title: item?.title,
      description: item?.description,
      source: item?.url,
      type: item?.kind ? item.kind.charAt(0).toUpperCase() + item.kind.slice(1) : undefined,
      saved: formatDateWithTime(item?.created_at ?? ""),
      updated: formatDateWithTime(item?.updated_at ?? ""),
      preview_image: item?.preview_image,
      tags: item?.tags ?? [],
      collections: item?.collections ?? [],
      kind: item?.kind,
      metadata: item?.metadata,
    };
  }, [item]);

  const {form, originalValues, setOriginalValues, currentValues, hasChanges} = useBookmarkForm(
    item,
    open,
  );
  const {
    control,
    handleSubmit,
    getValues,
    reset,
    setValue,
    formState: {errors, isValid},
  } = form;

  const {data: collections = []} = useCollectionsQuery({
    userId,
    enabled: open && !!userId,
  });

  const {data: tags = []} = useTagsQuery({
    userId,
    enabled: open && !!userId,
  });

  const collectionItems = useMemo(
    () =>
      collections.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    [collections],
  );

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<"og" | "preview">("preview");

  // Reset dialog state when menu closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setPreviewDialogOpen(false);
        setSelectedPreview("preview");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const {updateMutation, archiveMutation, resetMutation} = useBookmarkMutations({
    onOpenChange: setMenuOpen,
    originalValues,
    setOriginalValues,
    form,
    onItemReset: ({title, description, updatedAt}) => {
      if (!item) return;
      setMenuItem({
        ...item,
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
      if (!item) return;

      // Only include fields that have actually changed
      const updates: UpdateBookmarkData = {};

      if ((values.title ?? "") !== (originalValues.title ?? "")) {
        updates.title = values.title;
      }

      if ((values.description ?? "") !== (originalValues.description ?? "")) {
        updates.description = values.description;
      }

      if ((values.preview_image ?? "") !== (originalValues.preview_image ?? "")) {
        updates.preview_image = values.preview_image;
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

      updateBookmark({bookmarkId: item.id, updates});
    },
    [item, originalValues, updateBookmark],
  );

  const handleReset = useCallback(() => {
    if (item) {
      resetBookmark(item.id);
    }
  }, [item, resetBookmark]);

  const handleClearChanges = useCallback(() => {
    reset(originalValues);
  }, [originalValues, reset]);

  const handleArchive = useCallback(() => {
    if (item) {
      if (onArchive) {
        onArchive(item);
      } else {
        archiveBookmark(item.id);
      }
    }
  }, [archiveBookmark, item, onArchive]);

  const handleDelete = useCallback(() => {
    if (item && onDelete) {
      onDelete(item);
    }
  }, [item, onDelete]);

  // Derive both OG and Preview URLs from whatever is currently saved
  const currentImageUrl = currentValues.preview_image ?? item?.preview_image ?? "";
  const ogImageUrl = currentImageUrl.replace(/\/(preview|og)\.png$/, "/og.png");
  const previewImageUrl = currentImageUrl.replace(/\/(preview|og)\.png$/, "/preview.png");

  const handlePreviewClick = useCallback(() => {
    const currentUrl = getValues("preview_image");
    setSelectedPreview(currentUrl?.endsWith("og.png") ? "og" : "preview");
    setPreviewDialogOpen(true);
  }, [getValues]);

  const handleSavePreview = useCallback(() => {
    const newUrl = selectedPreview === "og" ? ogImageUrl : previewImageUrl;
    setValue("preview_image", newUrl, {shouldDirty: true, shouldValidate: true});
    setPreviewDialogOpen(false);
  }, [ogImageUrl, previewImageUrl, selectedPreview, setValue]);

  const actionProps = useMemo(
    () => ({
      onArchive: handleArchive,
      isArchiving,
      kind: item?.kind,
      onPreviewClick: handlePreviewClick,
      onReset: handleReset,
      isResetting,
      onDelete: handleDelete,
    }),
    [
      handleArchive,
      isArchiving,
      item?.kind,
      handlePreviewClick,
      handleReset,
      isResetting,
      handleDelete,
    ],
  );

  const disableSubmit = !hasChanges || !isValid || isUpdating || isArchiving || isResetting;

  return (
    <>
      <Sheet open={open} onOpenChange={setMenuOpen}>
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
                {item?.id ? (
                  item.kind === "post" && item.metadata ? (
                    <BookmarkPostMenuPanel meta={item.metadata as PostBookmarkMetadata} />
                  ) : (
                    <div className="bg-muted relative aspect-video w-full overflow-hidden border-b">
                      <BookmarkImage
                        bookmark_id={item.id}
                        item={{...item, preview_image: currentValues.preview_image ?? ""}}
                        type="preview"
                        fill
                        imageClassName="object-cover"
                      />
                    </div>
                  )
                ) : (
                  <div className="bg-muted aspect-video w-full border-b" />
                )}

                <div className="p-6">
                  {item?.kind === "website" && (
                    <SheetHeader className="p-0">
                      <SheetTitle className="contents">
                        <Controller
                          name="title"
                          control={control}
                          render={({field}) => (
                            <Textarea
                              {...field}
                              unstyled
                              spellCheck={false}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              error={errors.title?.message}
                              className="text-foreground flex w-full bg-transparent p-0 text-lg font-[550] outline-none [&_textarea]:min-h-0 [&_textarea]:resize-none [&_textarea]:p-0"
                            />
                          )}
                        />
                      </SheetTitle>
                    </SheetHeader>
                  )}

                  <BookmarkMenuActions {...actionProps} />
                </div>

                {item?.kind !== "post" && (
                  <>
                    <Separator />

                    <div className="p-6">
                      <Controller
                        name="description"
                        control={control}
                        render={({field}) => (
                          <Textarea
                            {...field}
                            unstyled
                            spellCheck={false}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            error={errors.description?.message}
                            className="text-muted-foreground flex w-full bg-transparent p-0 text-[15px] outline-none [&_textarea]:min-h-0 [&_textarea]:resize-none [&_textarea]:p-0"
                          />
                        )}
                      />
                    </div>
                  </>
                )}

                <Separator />

                <BookmarkDetails
                  source={data.source}
                  type={data.type}
                  kind={item?.kind}
                  metadata={item?.metadata}
                  collections={data.collections}
                  saved={data.saved}
                  updated={data.updated}
                  showUpdated={item?.updated_at !== item?.created_at}
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
                          sourceUrl={item?.url}
                          itemType={item?.kind ?? "website"}
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

      <BookmarkPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        ogImageUrl={ogImageUrl}
        previewImageUrl={previewImageUrl}
        selectedPreview={selectedPreview}
        onSelectPreview={setSelectedPreview}
        onSave={handleSavePreview}
      />
    </>
  );
}
