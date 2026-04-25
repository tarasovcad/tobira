"use client";

import React, {useEffect, useState} from "react";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogPanel,
} from "@/components/ui/coss/dialog";
import {Button} from "@/components/ui/coss/button";
import {Input} from "@/components/ui/coss/input";
import {Textarea} from "@/components/ui/coss/textarea";
import {Label} from "@/components/ui/coss/label";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {createCollection, updateCollection} from "@/app/actions/collections";
import {toastManager} from "@/components/ui/coss/toast";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";
import * as z from "zod";
import {useCollectionDialogStore} from "@/store/use-collection-dialog-store";
import Spinner from "@/components/ui/app/spinner";
import {homeMetadataKeys} from "@/features/home/hooks/use-home-metadata-query";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  description: z.string().max(200, "Description is too long").optional(),
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

interface CollectionDialogProps {
  isAuthenticated?: boolean;
}

/** Reset success label after close so it doesn't flash back to "Save Changes" during exit. */
const SUCCESS_LABEL_RESET_MS = 400;

export function CollectionDialog({isAuthenticated = false}: CollectionDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {isOpen, collection, closeDialog} = useCollectionDialogStore();
  const [submitSuccess, setSubmitSuccess] = useState<"save" | "create" | null>(null);

  const onOpenChange = (val: boolean) => {
    if (!val) closeDialog();
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isValid, isDirty},
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name || "",
      description: collection?.description || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: collection?.name || "",
        description: collection?.description || "",
      });
    } else {
      const t = setTimeout(() => {
        reset({name: "", description: ""});
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isOpen, collection, reset]);

  const mutation = useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      setSubmitSuccess("create");
      queryClient.invalidateQueries({queryKey: homeMetadataKeys.collectionsRoot});
      toastManager.add({title: "Collection created", type: "success"});
      onOpenChange(false);
      window.setTimeout(() => setSubmitSuccess(null), SUCCESS_LABEL_RESET_MS);
    },
    onError: (err) => {
      toastManager.add({
        title: "Failed to create collection",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (variables: {id: string; data: {name: string; description?: string}}) =>
      updateCollection(variables.id, variables.data),
    onSuccess: () => {
      setSubmitSuccess("save");
      queryClient.invalidateQueries({queryKey: homeMetadataKeys.collectionsRoot});
      toastManager.add({title: "Collection updated", type: "success"});
      onOpenChange(false);
      window.setTimeout(() => setSubmitSuccess(null), SUCCESS_LABEL_RESET_MS);
    },
    onError: (err) => {
      toastManager.add({
        title: "Failed to update collection",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    },
  });

  const onSubmit = (data: CollectionFormValues) => {
    if (!collection && !isAuthenticated) {
      onOpenChange(false);
      router.push("/login");
      return;
    }

    if (collection) {
      updateMutation.mutate({
        id: collection.id,
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
        },
      });
      return;
    }

    mutation.mutate({
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
    });
  };

  const submitButtonLabel =
    submitSuccess === "save"
      ? "Saved"
      : submitSuccess === "create"
        ? "Created"
        : collection
          ? "Save Changes"
          : "Create";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(val) => {
        if (val) {
          setSubmitSuccess(null);
        }
        if (val && !collection && !isAuthenticated) {
          onOpenChange(false);
          router.push("/login");
          return;
        }
        onOpenChange(val);
      }}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{collection ? "Edit Collection" : "Create Collection"}</DialogTitle>
          <DialogDescription>
            {collection
              ? "Update your collection details."
              : "Organize your bookmarks into collections."}
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <form id="create-collection-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Project Alpha"
                {...register("name")}
                autoFocus
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What's this collection for?"
                className="resize-none"
                {...register("description")}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>
            {collection && (
              <div className="space-y-2">
                <Label htmlFor="created_at">Created at</Label>
                <Input
                  id="created_at"
                  className="text-muted-foreground opacity-90"
                  value={new Date(collection.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  readOnly
                />
              </div>
            )}
          </form>
        </DialogPanel>
        <DialogFooter>
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-collection-form"
            disabled={
              mutation.isPending ||
              updateMutation.isPending ||
              submitSuccess !== null ||
              !isValid ||
              (!!collection && !isDirty)
            }>
            {(mutation.isPending || updateMutation.isPending) && (
              <Spinner className="mx-auto size-4 animate-spin" />
            )}
            {submitButtonLabel}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
