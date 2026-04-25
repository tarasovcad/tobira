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
import {toastManager} from "@/components/coss-ui/toast";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteCollections} from "@/app/actions/collections";
import Spinner from "../ui/spinner";
import {useEffect, useState} from "react";
import {useDeleteCollectionDialogStore} from "@/store/use-delete-collection-dialog-store";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {homeMetadataKeys} from "@/features/home/hooks/use-home-metadata-query";

export function DeleteCollectionDialog() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {isOpen: open, collections, onDeleted, closeDialog} = useDeleteCollectionDialogStore();

  const [displayCollections, setDisplayCollections] = useState(collections);

  if (collections.length > 0 && collections !== displayCollections) {
    setDisplayCollections(collections);
  }

  const count = displayCollections.length;

  const deleteMutation = useMutation({
    mutationKey: ["delete-collection"],
    mutationFn: async (ids: string | string[]) => {
      return deleteCollections(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: homeMetadataKeys.collectionsRoot});
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
    },
    onError: (error) => {
      console.error("Failed to delete collection:", error);
      toastManager.add({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete collection",
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
    if (collections.length === 0) return;

    const ids = collections.map((c) => c.id);
    deleteMutation.mutate(ids, {
      onSuccess: () => {
        toastManager.add({
          title:
            collections.length === 1
              ? "Collection deleted"
              : `${collections.length} collections deleted`,
          type: "success",
        });

        const activeCollectionId = searchParams.get("collection");
        if (pathname === "/home" && activeCollectionId && ids.includes(activeCollectionId)) {
          router.push("/home");
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
            {count <= 1 ? "Delete collection?" : `Delete ${count} collections?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {count <= 1
              ? `The collection "${displayCollections[0]?.name}" will be permanently removed. This won't delete the bookmarks associated with it.`
              : `These ${count} collections will be permanently removed. This won't delete the bookmarks associated with them.`}
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
                ? "Delete Collection"
                : `Delete ${count} Collections`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
