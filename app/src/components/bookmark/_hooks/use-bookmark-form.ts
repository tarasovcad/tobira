import {useState, useMemo, useRef, useEffect, useCallback} from "react";
import {useForm, useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {
  bookmarkFormSchema,
  BookmarkFormValues,
  normalizeTagsForCompare,
} from "../_utils/bookmark-schema";
import type {Bookmark} from "@/components/bookmark/types";
import {isWebsiteImages} from "@/features/media/components/bookmark/bookmark-images";

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_VALUES: BookmarkFormValues = {
  kind: "website",
  title: "",
  description: "",
  selected_image: undefined,
  notes: "",
  tags: [],
  collectionId: null,
};

const CLOSE_RESET_DELAY_MS = 500;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBookmarkForm(item: Bookmark | undefined, open: boolean) {
  const itemId = item?.id ?? null;
  const initialValues = item ? itemToFormValues(item) : EMPTY_VALUES;

  const form = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkFormSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  const [originalState, setOriginalState] = useState(() => ({
    itemId,
    values: initialValues,
  }));
  const closeTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevItemId = useRef(itemId);

  useEffect(() => {
    if (prevItemId.current !== itemId) {
      prevItemId.current = itemId;
      form.reset(initialValues);
    }
  }, [form, initialValues, item, itemId]);

  const originalValues = originalState.itemId === itemId ? originalState.values : initialValues;
  const setOriginalValues = useCallback(
    (values: BookmarkFormValues) => {
      setOriginalState({itemId, values});
    },
    [itemId],
  );

  // Reset form after dialog closes (delayed to allow close animation)
  useEffect(() => {
    if (!open) {
      if (closeTimerId.current) clearTimeout(closeTimerId.current);
      closeTimerId.current = setTimeout(() => {
        form.reset(originalValues);
        closeTimerId.current = null;
      }, CLOSE_RESET_DELAY_MS);
    }

    return () => {
      if (closeTimerId.current) {
        clearTimeout(closeTimerId.current);
      }
    };
  }, [open, form, originalValues]);

  const currentValues =
    (useWatch({control: form.control}) as BookmarkFormValues | undefined) ?? originalValues;
  const hasChanges = useMemo(
    () => !!item && valuesHaveChanged(currentValues, originalValues),
    [currentValues, item, originalValues],
  );

  return {form, originalValues, setOriginalValues, currentValues, hasChanges};
}
