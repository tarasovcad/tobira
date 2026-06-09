"use client";

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
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteTags} from "@/app/actions/tags";
import {useDeleteTagDialogStore} from "@/store/use-delete-tag-dialog-store";
import {useEffect, useState} from "react";
import Spinner from "@/components/ui/app/spinner";
import {usePathname} from "next/navigation";
import {useQueryState} from "nuqs";
import {homeMetadataKeys} from "@/features/home/hooks/use-home-metadata-query";
import {homeFilterParsers} from "@/lib/query-params";

export function DeleteTagDialog() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [tagParam, setTagParam] = useQueryState("tag", homeFilterParsers.tag);
  const {isOpen: open, tags, onDeleted, closeDialog} = useDeleteTagDialogStore();

  const [displayTags, setDisplayTags] = useState(tags);

  if (tags.length > 0 && tags !== displayTags) {
    setDisplayTags(tags);
  }

  const count = displayTags.length;

  const deleteMutation = useMutation({
    mutationKey: ["delete-tag"],
    mutationFn: async (ids: string | string[]) => {
      return deleteTags(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: homeMetadataKeys.tagsRoot});
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
    },
    onError: (error) => {
      console.error("Failed to delete tag:", error);
      toastManager.add({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete tag",
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
    if (tags.length === 0) return;

    const ids = tags.map((t) => t.id);

    deleteMutation.mutate(ids, {
      onSuccess: () => {
        toastManager.add({
          title: count === 1 ? "Tag deleted" : `${count} tags deleted`,
          type: "success",
        });

        const activeTagParam = tagParam?.trim() || null;
        if (pathname === "/home" && activeTagParam && ids.includes(activeTagParam)) {
          void setTagParam(null, {history: "push"});
        }

        closeDialog();
        onDeleted?.();
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(val) => !val && closeDialog()}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {count <= 1 ? "Delete tag?" : `Delete ${count} tags?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {count <= 1
              ? `The tag "${displayTags[0]?.name}" will be permanently removed. This won't delete the bookmarks associated with it.`
              : `These ${count} tags will be permanently removed. This won't delete the bookmarks associated with them.`}
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
                ? "Delete Tag"
                : `Delete ${count} Tags`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
