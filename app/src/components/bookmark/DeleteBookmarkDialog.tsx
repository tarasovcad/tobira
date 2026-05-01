"use client";

import {useEffect, useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteBookmarks} from "@/app/actions/bookmarks";
import {Button} from "@/components/ui/coss/button";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/coss/alert-dialog";
import {toastManager} from "@/components/ui/coss/toast";
import Spinner from "@/components/ui/app/spinner";
import {useDeleteBookmarkDialogStore} from "@/store/use-delete-bookmark-dialog-store";

export function DeleteBookmarkDialog() {
  const queryClient = useQueryClient();
  const {isOpen: open, items, onDeleted, closeDialog} = useDeleteBookmarkDialogStore();

  const [displayItems, setDisplayItems] = useState(items);

  if (items.length > 0 && items !== displayItems) {
    setDisplayItems(items);
  }

  const count = displayItems.length;

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

  useEffect(() => {
    if (open) {
      deleteMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDelete = () => {
    if (items.length === 0) return;

    const ids = items.map((item) => item.id);

    deleteMutation.mutate(ids, {
      onSuccess: () => {
        toastManager.add({
          title: count === 1 ? "Bookmark deleted" : `${count} bookmarks deleted`,
          type: "success",
        });

        closeDialog();
        onDeleted?.();
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeDialog()}>
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
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || deleteMutation.isSuccess}>
            {deleteMutation.isPending && <Spinner className="mx-auto size-4 animate-spin" />}
            {deleteMutation.isSuccess
              ? "Deleted"
              : count <= 1
                ? "Delete Bookmark"
                : `Delete ${count} Bookmarks`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
