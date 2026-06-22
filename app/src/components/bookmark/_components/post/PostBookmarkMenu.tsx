"use client";

import {useMemo, useCallback} from "react";
import {Controller} from "react-hook-form";
import {SearchIcon} from "lucide-react";
import {cn} from "@/lib/utils";
import {formatDateWithTime} from "@/lib/utils/dates";
import MediaPreview from "@/features/media/components/MediaPreview";
import {FallbackImage} from "@/features/media/components/preview/FallbackImage";
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
import {type UpdateBookmarkData} from "@/app/actions/bookmarks/update";
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
  getPostBookmarkArticleCoverPreviewItem,
  getPostBookmarkCardPreviewItem,
  getPostBookmarkMediaPreviewItems,
  type PostBookmarkPreviewItem,
} from "../../_utils/post-bookmark-preview";
import {useBookmarkMenuPreviewClick} from "../../_hooks/use-bookmark-menu-preview-click";
import {
  PostBookmarkText,
  preparePostBookmarkText,
  preparePostBookmarkTranslationText,
} from "./PostBookmarkText";
import {useTranslationToggle, PostTranslationLabel} from "./PostBookmarkTranslation";

const POST_TEXT_PREVIEW_MAX_LENGTH = 280;
const MAX_MENU_PREVIEW_ITEMS = 4;

// ── 0 images ──────────────────────────────────────────────────────────────────

function NoMediaPanel({meta}: {meta: PostBookmarkMetadata}) {
  const post = meta.tweet.post;
  const preparedText = preparePostBookmarkText(post, {
    expanded: false,
    maxLength: POST_TEXT_PREVIEW_MAX_LENGTH,
  });
  const translationToggle = useTranslationToggle(post);
  const preparedTranslationText = preparePostBookmarkTranslationText(post, {
    expanded: translationToggle.isTranslationExpanded,
  });

  return (
    <div className="bg-muted relative flex aspect-video w-full items-center justify-center overflow-hidden border-b px-8">
      <div className="flex w-full max-w-[400px] flex-col gap-3">
        <NoMediaPanelAuthor meta={meta} />
        <NoMediaPanelText
          preparedText={preparedText}
          preparedTranslationText={preparedTranslationText}
          translationToggle={translationToggle}
        />
      </div>
    </div>
  );
}

function NoMediaPanelAuthor({meta}: {meta: PostBookmarkMetadata}) {
  const user = meta.tweet.user;

  return (
    <div className="flex items-center gap-2.5">
      <div className="bg-background ring-border h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1">
        <FallbackImage
          src={user.user_profile_image_url}
          alt={user.user_name}
          width={32}
          height={32}
          className="h-full w-full object-cover"
          avatar
          unoptimized
        />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-foreground truncate text-[13px] font-semibold">{user.user_name}</span>
        <span className="text-muted-foreground text-[12px]">@{user.user_screen_name}</span>
      </div>
    </div>
  );
}

function NoMediaPanelText({
  preparedText,
  preparedTranslationText,
  translationToggle,
}: {
  preparedText: ReturnType<typeof preparePostBookmarkText>;
  preparedTranslationText: ReturnType<typeof preparePostBookmarkTranslationText>;
  translationToggle: ReturnType<typeof useTranslationToggle>;
}) {
  return (
    <>
      {translationToggle.hasTranslation ? (
        <PostTranslationLabel
          sourceLanguage={translationToggle.sourceLanguage}
          showOriginal={translationToggle.showOriginal}
          provider={translationToggle.provider}
          onToggle={translationToggle.toggleOriginal}
        />
      ) : null}
      {translationToggle.isTranslated ? (
        <p
          className={cn(
            "text-foreground text-[15px] leading-[20px] whitespace-pre-wrap",
            !translationToggle.isTranslationExpanded && "line-clamp-5",
          )}>
          <PostBookmarkText preparedText={preparedTranslationText} />
        </p>
      ) : (
        <p className="text-foreground line-clamp-5 text-[15px] leading-[20px] whitespace-pre-wrap">
          <PostBookmarkText preparedText={preparedText} />
        </p>
      )}
      {translationToggle.isTranslated &&
      preparedTranslationText.isLongText &&
      !translationToggle.isTranslationExpanded ? (
        <button
          type="button"
          onClick={translationToggle.expandTranslation}
          className="-mt-2 block cursor-pointer text-left text-[15px] leading-[18px] text-[#1D9BF0] hover:underline focus:outline-none">
          Show more
        </button>
      ) : null}
    </>
  );
}

// ── 1–4 images ────────────────────────────────────────────────────────────────

function MediaPanel({
  media,
  disableClickToOpen,
}: {
  media: PostBookmarkPreviewItem[];
  disableClickToOpen: boolean;
}) {
  const items = media.slice(0, MAX_MENU_PREVIEW_ITEMS);
  const count = items.length;

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden border-b",
        disableClickToOpen && "pointer-events-none",
      )}>
      <div className={getMenuPreviewGridClassName(count)}>
        {items.map((item, index) => (
          <MediaPanelTile
            key={item.key}
            item={item}
            index={index}
            count={count}
            disableClickToOpen={disableClickToOpen}
          />
        ))}
      </div>
    </div>
  );
}

function getMenuPreviewGridClassName(count: number) {
  return cn("grid h-full w-full gap-[2px]", count === 1 ? "grid-cols-1" : "grid-cols-2");
}

function MediaPanelTile({
  count,
  disableClickToOpen,
  index,
  item,
}: {
  count: number;
  disableClickToOpen: boolean;
  index: number;
  item: PostBookmarkPreviewItem;
}) {
  const isVideo = item.type === "video";

  return (
    <div
      className={cn(
        "bg-muted relative h-full w-full overflow-hidden",
        count === 3 && index === 0 && "row-span-2",
      )}>
      <MediaPreview
        src={item.src}
        fullSizeSrc={isVideo ? undefined : item.fullSizeSrc}
        alt={item.alt}
        width={item.width}
        height={item.height}
        poster={item.poster}
        type={isVideo ? "video" : "image"}
        className="h-full w-full object-cover"
        loading="lazy"
        disableClickToOpen={disableClickToOpen}
      />
    </div>
  );
}

function getPostBookmarkMenuPreviewItems(
  item: PostBookmark,
  meta: PostBookmarkMetadata,
): PostBookmarkPreviewItem[] {
  const post = meta.tweet.post;
  const mainMedia = getPostBookmarkMediaPreviewItems(item, "main", "menu");
  if (mainMedia.length > 0) {
    return mainMedia;
  }

  const cardPreviewItem = post.card
    ? getPostBookmarkCardPreviewItem(item, post.tweetID, post.card, "menu")
    : null;
  if (cardPreviewItem) {
    return [cardPreviewItem];
  }

  const articleCoverPreviewItem = post.article
    ? getPostBookmarkArticleCoverPreviewItem(item, "menu", 0)
    : null;
  if (articleCoverPreviewItem) {
    return [articleCoverPreviewItem];
  }

  const quotedMedia = getPostBookmarkMediaPreviewItems(item, "qrt", "menu");
  if (quotedMedia.length > 0) {
    return quotedMedia;
  }

  const quotedArticleCoverPreviewItem = post.qrt?.post.article
    ? getPostBookmarkArticleCoverPreviewItem(item, "menu", post.article ? 1 : 0)
    : null;
  if (quotedArticleCoverPreviewItem) {
    return [quotedArticleCoverPreviewItem];
  }

  return [];
}

function PostBookmarkMenuPreview({
  item,
  meta,
  disableClickToOpen,
}: {
  item: PostBookmark;
  meta: PostBookmarkMetadata;
  disableClickToOpen: boolean;
}) {
  const media = getPostBookmarkMenuPreviewItems(item, meta);
  return media.length > 0 ? (
    <MediaPanel media={media} disableClickToOpen={disableClickToOpen} />
  ) : (
    <NoMediaPanel meta={meta} />
  );
}

export function PostBookmarkMenu({userId}: {userId: string | null}) {
  const item = useBookmarkMenuStore((state) => state.item);
  const open = useBookmarkMenuStore((state) => state.isOpen);
  const onDelete = useBookmarkMenuStore((state) => state.onDelete);
  const onArchive = useBookmarkMenuStore((state) => state.onArchive);
  const setMenuOpen = useBookmarkMenuStore((state) => state.setMenuOpen);
  const postItem = item?.kind === "post" ? item : undefined;
  const isOpen = open && !!postItem;
  const canClickMediaPreview = useBookmarkMenuPreviewClick(isOpen, postItem?.id);

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
      onDelete: handleDelete,
    }),
    [handleArchive, isArchiving, handleDelete],
  );

  const disableSubmit = !hasChanges || !isValid || isUpdating || isArchiving;

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
                <PostBookmarkMenuPreview
                  item={postItem}
                  meta={postItem.metadata}
                  disableClickToOpen={!canClickMediaPreview}
                />
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
  );
}
