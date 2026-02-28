"use client";

import React from "react";
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
import {createCollection} from "@/app/actions/collections";
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
}

export function CollectionDialog({open, onOpenChange}: CollectionDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isValid},
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["collections"]});
      toastManager.add({title: "Collection created", type: "success"});
      onOpenChange(false);
      reset();
    },
    onError: (err) => {
      toastManager.add({
        title: "Failed to create collection",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    },
  });

  const onSubmit = (data: CollectionFormValues) => {
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
        if (!val) reset();
      }}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
          <DialogDescription>Organize your bookmarks into collections.</DialogDescription>
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
            disabled={mutation.isPending || !isValid}>
            Create
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
