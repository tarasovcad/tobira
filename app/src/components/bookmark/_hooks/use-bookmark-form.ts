import {useState, useMemo, useCallback} from "react";
import {useForm, useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {
  bookmarkFormSchema,
  BookmarkFormValues,
  normalizeTagsForCompare,
} from "../_utils/bookmark-schema";
import type {Bookmark} from "@/components/bookmark/types";
import {isWebsiteImages} from "@/components/bookmark/_utils/bookmark-image-guards";

const EMPTY_VALUES: BookmarkFormValues = {
  kind: "website",
  title: "",
  description: "",
  selected_image: undefined,
  notes: "",
  tags: [],
  collectionId: null,
};

function itemToFormValues(item: Bookmark): BookmarkFormValues {
  const websiteImages = isWebsiteImages(item.images) ? item.images : undefined;
  return {
    kind: item.kind,
    title: item.title,
    description: item.description,
    selected_image: websiteImages?.selected ?? undefined,
    notes: item.notes ?? "",
    tags: item.tags ?? [],
    collectionId: item.collections?.[0]?.id ?? null,
  };
}

function valuesHaveChanged(current: BookmarkFormValues, original: BookmarkFormValues): boolean {
  const scalarChanged =
    (current.title ?? "") !== (original.title ?? "") ||
    (current.description ?? "") !== (original.description ?? "") ||
    (current.selected_image ?? "") !== (original.selected_image ?? "") ||
    (current.notes ?? "") !== (original.notes ?? "") ||
    (current.collectionId ?? "") !== (original.collectionId ?? "");

  const tagsChanged =
    normalizeTagsForCompare(current.tags) !== normalizeTagsForCompare(original.tags);
  return scalarChanged || tagsChanged;
}

export function useBookmarkForm(item: Bookmark | undefined, open: boolean) {
  const itemValues = useMemo(() => (item ? itemToFormValues(item) : EMPTY_VALUES), [item]);
  const [savedSession, setSavedSession] = useState<{
    itemId: string;
    values: BookmarkFormValues;
  } | null>(null);

  if (!open && savedSession) {
    setSavedSession(null);
  }

  const originalValues =
    open && item && savedSession?.itemId === item.id ? savedSession.values : itemValues;

  const form = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkFormSchema),
    values: open && item ? itemValues : undefined,
    resetOptions: {keepDirtyValues: true},
    mode: "onChange",
  });

  const setOriginalValues = useCallback(
    (values: BookmarkFormValues) => {
      if (!item) return;
      setSavedSession({itemId: item.id, values});
    },
    [item],
  );

  const currentValues =
    (useWatch({control: form.control}) as BookmarkFormValues | undefined) ?? originalValues;
  const hasChanges = useMemo(
    () => !!item && open && valuesHaveChanged(currentValues, originalValues),
    [currentValues, item, open, originalValues],
  );

  return {form, originalValues, setOriginalValues, currentValues, hasChanges};
}
