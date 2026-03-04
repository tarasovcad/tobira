"use client";

import React, {useEffect} from "react";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogPanel,
} from "@/components/coss-ui/dialog";
import {Button} from "@/components/coss-ui/button";
import {Input} from "@/components/coss-ui/input";
import {Textarea} from "@/components/coss-ui/textarea";
import {Label} from "@/components/coss-ui/label";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {createCollection, updateCollection, type Collection} from "@/app/actions/collections";
import {toastManager} from "@/components/coss-ui/toast";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  description: z.string().max(200, "Description is too long").optional(),
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection | null;
}

export function CollectionDialog({open, onOpenChange, collection}: CollectionDialogProps) {
  const queryClient = useQueryClient();

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
    if (open) {
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
  }, [open, collection, reset]);

  const mutation = useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["collections"]});
      toastManager.add({title: "Collection created", type: "success"});
      onOpenChange(false);
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
      queryClient.invalidateQueries({queryKey: ["collections"]});
      toastManager.add({title: "Collection updated", type: "success"});
      onOpenChange(false);
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

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
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
              !isValid ||
              (!!collection && !isDirty)
            }>
            {collection ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
