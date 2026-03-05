"use client";

import {Button} from "@/components/coss-ui/button";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/coss-ui/alert-dialog";
import type {Bookmark} from "@/components/bookmark/Bookmark";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteBookmarks} from "@/app/actions/bookmarks";
import {toastManager} from "@/components/coss-ui/toast";

export function DeleteBookmarkDialog({
  open,
  onOpenChange,
  items,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Bookmark[];
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const count = items.length;

  const deleteMutation = useMutation({
    mutationKey: ["delete-bookmark"],
    mutationFn: async (ids: string | string[]) => {
      return deleteBookmarks(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
      queryClient.invalidateQueries({queryKey: ["tags"]});
    },
    onError: (error) => {
      console.error("Failed to delete bookmark:", error);
      toastManager.add({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete bookmark",
        type: "error",
      });
    },
  });

  const handleDelete = () => {
    if (count === 0) return;

    const ids = items.map((item) => item.id);
    deleteMutation.mutate(ids);

    toastManager.add({
      title: count === 1 ? "Bookmark deleted" : `${count} bookmarks deleted`,
      type: "success",
    });

    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {count <= 1 ? "Delete bookmark?" : `Delete ${count} bookmarks?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {count <= 1
              ? "This bookmark will be removed from your list."
              : `These ${count} bookmarks will be removed from your list.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button variant="destructive" onClick={handleDelete}>
            {count <= 1 ? "Delete Bookmark" : `Delete ${count} Bookmarks`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
