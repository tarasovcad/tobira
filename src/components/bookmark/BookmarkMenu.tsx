"use client";

import * as React from "react";
import {useRef, useState, useMemo, useEffect} from "react";
import Image from "next/image";
import {formatDateWithTime} from "@/lib/formatDate";
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
import {BookmarkPreviewDialog} from "./_components/BookmarkPreviewDialog";
import {BookmarkMenuActions} from "./_components/BookmarkMenuActions";
import {BookmarkDetails} from "./_components/BookmarkDetails";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";

export function BookmarkMenu({userId}: {userId: string | null}) {
  const item = useBookmarkMenuStore((state) => state.item);
  const open = useBookmarkMenuStore((state) => state.isOpen);
  const onDelete = useBookmarkMenuStore((state) => state.onDelete);
  const onArchive = useBookmarkMenuStore((state) => state.onArchive);
  const setMenuOpen = useBookmarkMenuStore((state) => state.setMenuOpen);

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

  const titleElRef = useRef<HTMLHeadingElement | null>(null);
  const descriptionElRef = useRef<HTMLDivElement | null>(null);

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
  });

  const onSubmit = (values: BookmarkFormValues) => {
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

    if (Object.keys(updates).length === 0) {
      setMenuOpen(false);
      return;
    }

    updateMutation.mutate({bookmarkId: item.id, updates});
  };

  const handleReset = () => {
    if (item) {
      resetMutation.mutate(item.id);
    }
  };

  const handleArchive = () => {
    if (item) {
      if (onArchive) {
        onArchive(item);
      } else {
        archiveMutation.mutate(item.id);
      }
    }
  };

  const handleDelete = () => {
    if (item && onDelete) {
      onDelete(item);
    }
  };

  // Derive both OG and Preview URLs from whatever is currently saved
  const currentImageUrl = item?.preview_image ?? "";
  const ogImageUrl = currentImageUrl.replace(/\/(preview|og)\.png$/, "/og.png");
  const previewImageUrl = currentImageUrl.replace(/\/(preview|og)\.png$/, "/preview.png");

  const isMedia = item?.kind === "media";
  const headerSrc = currentValues.preview_image ?? "";
  const isVideoHeader =
    isMedia &&
    (headerSrc.toLowerCase().endsWith(".mp4") || headerSrc.toLowerCase().endsWith(".mov"));

  const handleSavePreview = () => {
    const newUrl = selectedPreview === "og" ? ogImageUrl : previewImageUrl;
    form.setValue("preview_image", newUrl, {shouldDirty: true});
    setPreviewDialogOpen(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="max-w-[560px]">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full flex-col overflow-hidden">
            <div className="min-h-0 flex-1">
              <SheetPanel className="p-0 pt-0!">
                {item?.id ? (
                  <div className="bg-muted relative aspect-video w-full border-b">
                    {isVideoHeader ? (
                      <CustomVideoPlayer
                        src={headerSrc}
                        poster={item?.metadata?.thumbnail_url}
                        className="h-full w-full"
                        videoClassName="h-full w-full object-cover"
                        loop
                        muted
                        playsInline
                        minimal
                        showMainPlayIcon
                      />
                    ) : (
                      <Image
                        src={headerSrc}
                        alt={currentValues.title ?? "Bookmark preview"}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="bg-muted aspect-video w-full border-b" />
                )}

                <div className="p-6">
                  {item?.kind === "website" && (
                    <SheetHeader className="p-0">
                      <SheetTitle
                        key={`title-${item?.id}`}
                        ref={titleElRef}
                        contentEditable
                        spellCheck={false}
                        suppressContentEditableWarning
                        onInput={(e) => {
                          const newTitle = e.currentTarget.textContent ?? "";
                          form.setValue("title", newTitle, {shouldDirty: true});
                        }}
                        onBlur={(e) => {
                          const newTitle = e.currentTarget.textContent ?? "";
                          form.setValue("title", newTitle, {shouldDirty: true});
                        }}
                        className="text-foreground/95 text-lg font-semibold focus:ring-0 focus:ring-offset-0 focus:outline-none">
                        {item?.title}
                      </SheetTitle>
                    </SheetHeader>
                  )}

                  <BookmarkMenuActions
                    onArchive={handleArchive}
                    isArchiving={archiveMutation.isPending}
                    kind={item?.kind}
                    onPreviewClick={() => {
                      const currentUrl = form.getValues("preview_image");
                      setSelectedPreview(currentUrl?.endsWith("og.png") ? "og" : "preview");
                      setPreviewDialogOpen(true);
                    }}
                    onReset={handleReset}
                    isResetting={resetMutation.isPending}
                    onDelete={handleDelete}
                  />
                </div>

                <Separator />

                <div className="p-6">
                  <div
                    key={`description-${item?.id}`}
                    ref={descriptionElRef}
                    contentEditable
                    spellCheck={false}
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const newDescription = e.currentTarget.textContent ?? "";
                      form.setValue("description", newDescription, {shouldDirty: true});
                    }}
                    onBlur={(e) => {
                      const newDescription = e.currentTarget.textContent ?? "";
                      form.setValue("description", newDescription, {shouldDirty: true});
                    }}
                    className="text-muted-foreground text-[15px] focus:ring-0 focus:ring-offset-0 focus:outline-none">
                    {item?.description}
                  </div>
                </div>

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

                <div className="p-6 text-[15px]">
                  <div className="mb-3 font-semibold">Collection</div>
                  <Combobox
                    items={collectionItems}
                    value={
                      collectionItems.find((ci) => ci.value === currentValues.collectionId) ?? null
                    }
                    onValueChange={(val) =>
                      form.setValue("collectionId", val?.value ?? null, {shouldDirty: true})
                    }>
                    <Select>
                      <ComboboxTrigger render={<SelectButton />}>
                        <ComboboxValue placeholder="Select a collection" />
                      </ComboboxTrigger>
                    </Select>
                    <ComboboxPopup aria-label="Select a collection" className="w-(--anchor-width)">
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
                </div>

                <Separator />

                <div className="p-6 text-[15px]">
                  <TagsInput
                    value={currentValues.tags ?? []}
                    onValueChange={(next) => form.setValue("tags", next, {shouldDirty: true})}
                    label="Tags"
                    placeholder="Add tags..."
                    availableTags={tags.map((t) => t.name)}
                    labelClassName="text-[15px] font-semibold"
                    containerClassName="max-w-full gap-3"
                  />
                </div>

                <Separator />

                <div className="p-6 text-[15px]">
                  <div className="font-semibold">Notes</div>
                  <div className="mt-3">
                    <Textarea
                      placeholder="Write personal notes..."
                      value={currentValues.notes ?? ""}
                      onChange={(e) => form.setValue("notes", e.target.value, {shouldDirty: true})}
                      className="sm:text-[15px]"
                    />
                  </div>
                </div>
              </SheetPanel>
            </div>
            {hasChanges ? (
              <div className="bg-background sticky bottom-0 border-t px-6 py-4">
                <div className="flex justify-end">
                  <Button variant="default" type="submit">
                    Submit
                  </Button>
                </div>
              </div>
            ) : null}
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
