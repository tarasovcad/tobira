"use client";

import {useState, useMemo, useEffect, useCallback} from "react";
import {Controller} from "react-hook-form";
import {cn} from "@/lib/utils";
import {formatDateWithTime} from "@/lib/utils/dates";
import {Sheet, SheetContent, SheetHeader, SheetPanel, SheetTitle} from "@/components/ui/coss/sheet";
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
import {isWebsiteImages} from "@/components/bookmark/_utils/bookmark-image-guards";
import {buildR2PublicUrl} from "@/lib/storage/r2-public";
import WebsiteBookmarkPreviewDialog from "./WebsiteBookmarkPreviewDialog";
import Spinner from "@/components/ui/app/spinner";
import {useBookmarkForm} from "../../_hooks/use-bookmark-form";
import {useBookmarkMenuPreviewClick} from "../../_hooks/use-bookmark-menu-preview-click";
import {BookmarkFormValues, normalizeTagsForCompare} from "../../_utils/bookmark-schema";
import {useBookmarkMutations} from "../../_hooks/use-bookmark-mutations";
import {BookmarkMenuActions} from "../shared/BookmarkMenuActions";
import BookmarkMenuDetails from "../shared/BookmarkMenuDetails";
import WebsiteBookmarkMenuImage from "./WebsiteBookmarkMenuImage";

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

export function WebsiteBookmarkMenu({userId}: {userId: string | null}) {
  const item = useBookmarkMenuStore((state) => state.item);
  const open = useBookmarkMenuStore((state) => state.isOpen);
  const onDelete = useBookmarkMenuStore((state) => state.onDelete);
  const onArchive = useBookmarkMenuStore((state) => state.onArchive);
  const setMenuOpen = useBookmarkMenuStore((state) => state.setMenuOpen);
  const websiteItem = item?.kind === "website" ? item : undefined;
  const isOpen = open && !!websiteItem;
  const canClickMediaPreview = useBookmarkMenuPreviewClick(isOpen, websiteItem?.id);

  const data = useMemo(() => {
    return {
      title: websiteItem?.title,
      description: websiteItem?.description,
      source: websiteItem?.url,
      type: websiteItem?.kind
        ? websiteItem.kind.charAt(0).toUpperCase() + websiteItem.kind.slice(1)
        : undefined,
      saved: formatDateWithTime(websiteItem?.created_at ?? ""),
      updated: formatDateWithTime(websiteItem?.updated_at ?? ""),
      tags: websiteItem?.tags ?? [],
      collections: websiteItem?.collections ?? [],
      kind: websiteItem?.kind,
      metadata: websiteItem?.metadata,
    };
  }, [websiteItem]);

  const {form, originalValues, setOriginalValues, currentValues, hasChanges} = useBookmarkForm(
    websiteItem,
    isOpen,
  );
  const {
    control,
    handleSubmit,
    reset,
    setValue,
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

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<"og" | "preview">("preview");

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setPreviewDialogOpen(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const {updateMutation, archiveMutation} = useBookmarkMutations({
    onOpenChange: setMenuOpen,
    originalValues,
    setOriginalValues,
    form,
  });
  const {mutate: updateBookmark, isPending: isUpdating} = updateMutation;
  const {mutate: archiveBookmark, isPending: isArchiving} = archiveMutation;

  const onSubmit = useCallback(
    (values: BookmarkFormValues) => {
      if (!websiteItem) return;

      const updates: UpdateBookmarkData = {};

      if ((values.title ?? "") !== (originalValues.title ?? "")) {
        updates.title = values.title;
      }

      if ((values.description ?? "") !== (originalValues.description ?? "")) {
        updates.description = values.description;
      }

      if ((values.selected_image ?? "") !== (originalValues.selected_image ?? "")) {
        updates.selected_image = values.selected_image;
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

      updateBookmark({bookmarkId: websiteItem.id, updates});
    },
    [originalValues, updateBookmark, websiteItem],
  );

  const handleClearChanges = useCallback(() => {
    reset(originalValues);
  }, [originalValues, reset]);

  const handleArchive = useCallback(() => {
    if (websiteItem) {
      if (onArchive) {
        onArchive(websiteItem);
      } else {
        archiveBookmark(websiteItem.id);
      }
    }
  }, [archiveBookmark, onArchive, websiteItem]);

  const handleDelete = useCallback(() => {
    if (websiteItem && onDelete) {
      onDelete(websiteItem);
    }
  }, [onDelete, websiteItem]);

  const websiteImages = isWebsiteImages(websiteItem?.images) ? websiteItem.images : undefined;

  const ogImageUrl = websiteImages?.og?.key
    ? `${buildR2PublicUrl(websiteImages.og.key)}?size=medium`
    : "";

  const previewImageUrl = websiteImages?.preview?.key
    ? `${buildR2PublicUrl(websiteImages.preview.key)}?size=medium`
    : "";

  const handlePreviewClick = useCallback(() => {
    setSelectedPreview(currentValues.selected_image === "og" ? "og" : "preview");
    setPreviewDialogOpen(true);
  }, [currentValues.selected_image]);

  const handleSavePreview = useCallback(() => {
    setValue("selected_image", selectedPreview, {shouldDirty: true, shouldValidate: true});
    setPreviewDialogOpen(false);
  }, [selectedPreview, setValue]);

  const actionProps = useMemo(
    () => ({
      onArchive: handleArchive,
      isArchiving,
      kind: "website" as const,
      onPreviewClick: handlePreviewClick,
      onDelete: handleDelete,
    }),
    [handleArchive, isArchiving, handlePreviewClick, handleDelete],
  );

  const disableSubmit = !hasChanges || !isValid || isUpdating || isArchiving;

  return (
    <>
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
                {websiteItem?.id ? (
                  <div
                    className={cn(
                      "bg-muted relative aspect-video w-full overflow-hidden border-b",
                      !canClickMediaPreview && "pointer-events-none",
                    )}>
                    <WebsiteBookmarkMenuImage
                      item={websiteItem}
                      type={currentValues.selected_image ?? "preview"}
                      fill
                      imageClassName="object-cover"
                      disablePreviewOnClick={!canClickMediaPreview}
                    />
                  </div>
                ) : (
                  <div className="bg-muted aspect-video w-full border-b" />
                )}

                <div className="p-6">
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

                  <BookmarkMenuActions {...actionProps} />
                </div>

                <Separator />

                <div className="p-6">
                  <BookmarkDescriptionField
                    key={`${websiteItem?.id ?? "none"}:${isOpen ? "open" : "closed"}`}
                    control={control}
                    error={errors.description?.message}
                  />
                </div>

                <Separator />

                <BookmarkMenuDetails
                  source={data.source}
                  type={data.type}
                  kind="website"
                  metadata={data.metadata}
                  saved={data.saved}
                  updated={data.updated}
                  showUpdated={websiteItem?.updated_at !== websiteItem?.created_at}
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
                          sourceUrl={websiteItem?.url}
                          itemType="website"
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
                  disabled={!hasChanges}>
                  Cancel
                </Button>
                <Button variant="default" type="submit" disabled={disableSubmit}>
                  {isUpdating && <Spinner className="size-4" />}
                  Save
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <WebsiteBookmarkPreviewDialog
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
