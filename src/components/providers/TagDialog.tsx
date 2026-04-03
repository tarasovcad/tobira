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
} from "@/components/coss-ui/dialog";
import {Button} from "@/components/coss-ui/button";
import {Input} from "@/components/coss-ui/input";
import {Textarea} from "@/components/coss-ui/textarea";
import {Label} from "@/components/coss-ui/label";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {updateTag} from "@/app/actions/tags";
import {toastManager} from "@/components/coss-ui/toast";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {useTagDialogStore} from "@/store/use-tag-dialog-store";
import Spinner from "../ui/spinner";
import {homeMetadataKeys} from "@/app/home/_hooks/use-home-metadata-query";

const tagSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  description: z.string().max(200, "Description is too long").optional(),
});

type TagFormValues = z.infer<typeof tagSchema>;

/** Reset success label after close so it doesn't flash back to "Save Changes" during exit. */
const SUCCESS_LABEL_RESET_MS = 400;

export function TagDialog() {
  const queryClient = useQueryClient();
  const {isOpen, tag, closeDialog} = useTagDialogStore();
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const onOpenChange = (val: boolean) => {
    if (!val) closeDialog();
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isValid, isDirty},
  } = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: tag?.name || "",
      description: tag?.description || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: tag?.name || "",
        description: tag?.description || "",
      });
    } else {
      const t = setTimeout(() => {
        reset({name: "", description: ""});
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isOpen, tag, reset]);

  const updateMutation = useMutation({
    mutationFn: (variables: {id: string; data: {name: string; description?: string}}) =>
      updateTag(variables.id, variables.data),
    onSuccess: () => {
      setSubmitSuccess(true);
      queryClient.invalidateQueries({queryKey: homeMetadataKeys.tagsRoot});
      queryClient.invalidateQueries({queryKey: ["active-tag"]});
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});

      toastManager.add({title: "Tag updated", type: "success"});
      onOpenChange(false);
      window.setTimeout(() => setSubmitSuccess(false), SUCCESS_LABEL_RESET_MS);
    },
    onError: (err) => {
      toastManager.add({
        title: "Failed to update tag",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    },
  });

  const onSubmit = (data: TagFormValues) => {
    if (!tag) return;

    updateMutation.mutate({
      id: tag.id,
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
      },
    });
  };

  const submitButtonLabel = submitSuccess ? "Saved" : "Save Changes";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>Update your tag details.</DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <form id="edit-tag-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                placeholder="e.g. design"
                {...register("name")}
                autoFocus
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-description">Description</Label>
              <Textarea
                id="tag-description"
                placeholder="What's this tag for?"
                className="resize-none"
                {...register("description")}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>
            {tag && (
              <div className="space-y-2">
                <Label htmlFor="tag-created-at">Created at</Label>
                <Input
                  id="tag-created-at"
                  className="text-muted-foreground opacity-90"
                  value={new Date(tag.created_at).toLocaleDateString(undefined, {
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
            form="edit-tag-form"
            disabled={updateMutation.isPending || submitSuccess || !isValid || !isDirty}>
            {updateMutation.isPending && <Spinner className="mx-auto size-4 animate-spin" />}
            {submitButtonLabel}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
