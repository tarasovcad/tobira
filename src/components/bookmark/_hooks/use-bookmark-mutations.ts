import {useMutation, useQueryClient} from "@tanstack/react-query";
import {
  updateBookmark,
  archiveBookmarks,
  resetBookmark,
  UpdateBookmarkData,
} from "@/app/actions/bookmarks";
import {toastManager} from "@/components/coss-ui/toast";
import {UseFormReturn} from "react-hook-form";
import {BookmarkFormValues} from "../_utils/bookmark-schema";
import {getErrorMessage} from "@/lib/errors";

export function useBookmarkMutations({
  onOpenChange,
  originalValues,
  setOriginalValues,
  form,
}: {
  onOpenChange: (open: boolean) => void;
  originalValues: BookmarkFormValues;
  setOriginalValues?: (values: BookmarkFormValues) => void;
  form: UseFormReturn<BookmarkFormValues>;
}) {
  const queryClient = useQueryClient();

  const invalidateBookmarkQueries = () => {
    queryClient.invalidateQueries({queryKey: ["bookmarks"]});
    queryClient.invalidateQueries({queryKey: ["tags"]});
  };

  const updateMutation = useMutation({
    mutationFn: (input: {bookmarkId: string; updates: UpdateBookmarkData}) =>
      updateBookmark(input.bookmarkId, input.updates),
    onMutate: async () => {
      // Close immediately, don't wait for response
      onOpenChange(false);

      //  lock in the latest form values so close/reset doesn't revert them
      const prev = originalValues;
      const nextValues = form.getValues();
      if (setOriginalValues) {
        setOriginalValues(nextValues);
      }
      form.reset(nextValues);

      return {prev};
    },
    onSuccess: () => {
      invalidateBookmarkQueries();
      toastManager.add({
        title: "Bookmark updated",
        type: "success",
      });
    },
    onError: (error, vars, ctx) => {
      console.error("[useBookmarkMutations] updateBookmark failed", {
        bookmarkId: vars.bookmarkId,
        updates: vars.updates,
        error,
      });

      if (ctx?.prev) {
        if (setOriginalValues) {
          setOriginalValues(ctx.prev);
        }
        form.reset(ctx.prev);
      }

      toastManager.add({
        title: "Update failed",
        description: getErrorMessage(error, "Failed to update bookmark"),
        type: "error",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveBookmarks(id),
    onSuccess: () => {
      invalidateBookmarkQueries();
      onOpenChange(false);
      toastManager.add({
        title: "Bookmark archived",
        type: "success",
      });
    },
    onError: (error, id) => {
      console.error("[useBookmarkMutations] archiveBookmark failed", {id, error});
      toastManager.add({
        title: "Archive failed",
        description: getErrorMessage(error, "Failed to archive bookmark"),
        type: "error",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => resetBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
      toastManager.add({
        title: "Bookmark reset",
        description: "Metadata and images are being refreshed.",
        type: "success",
      });
    },
    onError: (error, id) => {
      console.error("[useBookmarkMutations] resetBookmark failed", {id, error});
      toastManager.add({
        title: "Reset failed",
        description: getErrorMessage(error, "Failed to reset bookmark"),
        type: "error",
      });
    },
  });

  return {updateMutation, archiveMutation, resetMutation};
}
