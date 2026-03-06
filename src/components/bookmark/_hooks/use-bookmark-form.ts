import {useState, useMemo, useRef, useEffect} from "react";
import {useForm, useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {
  bookmarkFormSchema,
  BookmarkFormValues,
  normalizeTagsForCompare,
} from "../_utils/bookmark-schema";
import {type Bookmark} from "@/components/bookmark/Bookmark";

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_VALUES: BookmarkFormValues = {
  title: "",
  description: "",
  preview_image: "",
  notes: "",
  tags: [],
  collectionId: null,
};

const CLOSE_RESET_DELAY_MS = 500;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function itemToFormValues(item: Bookmark): BookmarkFormValues {
  return {
    title: item.title,
    description: item.description,
    preview_image: item.preview_image,
    notes: item.notes ?? "",
    tags: item.tags ?? [],
    collectionId: item.collections?.[0]?.id ?? null,
  };
}

function valuesHaveChanged(current: BookmarkFormValues, original: BookmarkFormValues): boolean {
  const scalarChanged =
    (current.title ?? "") !== (original.title ?? "") ||
    (current.description ?? "") !== (original.description ?? "") ||
    (current.preview_image ?? "") !== (original.preview_image ?? "") ||
    (current.notes ?? "") !== (original.notes ?? "") ||
    (current.collectionId ?? "") !== (original.collectionId ?? "");

  const tagsChanged =
    normalizeTagsForCompare(current.tags) !== normalizeTagsForCompare(original.tags);
  return scalarChanged || tagsChanged;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBookmarkForm(item: Bookmark | undefined, open: boolean) {
  const initialValues = item ? itemToFormValues(item) : EMPTY_VALUES;

  const form = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkFormSchema),
    defaultValues: initialValues,
  });

  const originalValuesRef = useRef<BookmarkFormValues>(initialValues);
  const [prevItemId, setPrevItemId] = useState(item?.id);
  const closeTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form when the edited item changes
  if (item && item.id !== prevItemId) {
    const values = itemToFormValues(item);
    form.reset(values);

    // eslint-disable-next-line react-hooks/refs
    originalValuesRef.current = values;
    setPrevItemId(item.id);
  }

  // Reset form after dialog closes (delayed to allow close animation)
  useEffect(() => {
    if (!open) {
      if (closeTimerId.current) clearTimeout(closeTimerId.current);
      closeTimerId.current = setTimeout(() => {
        form.reset(originalValuesRef.current);
        closeTimerId.current = null;
      }, CLOSE_RESET_DELAY_MS);
    }

    return () => {
      if (closeTimerId.current) {
        clearTimeout(closeTimerId.current);
      }
    };
  }, [open, form]);

  const currentValues = useWatch({control: form.control});
  const hasChanges = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      !!item && valuesHaveChanged(currentValues as BookmarkFormValues, originalValuesRef.current),
    [currentValues, item],
  );

  return {form, originalValuesRef, currentValues, hasChanges};
}
