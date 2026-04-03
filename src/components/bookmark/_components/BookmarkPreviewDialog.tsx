"use client";

import * as React from "react";
import Image from "next/image";
import {cn} from "@/lib/utils/classnames";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/coss-ui/dialog";
import {Button} from "@/components/coss-ui/button";
import {Button as ShadcnButton} from "@/components/shadcn/button";

interface BookmarkPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ogImageUrl: string;
  previewImageUrl: string;
  selectedPreview: "og" | "preview";
  onSelectPreview: (val: "og" | "preview") => void;
  onSave: () => void;
}

export function BookmarkPreviewDialog({
  open,
  onOpenChange,
  ogImageUrl,
  previewImageUrl,
  selectedPreview,
  onSelectPreview,
  onSave,
}: BookmarkPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Change Preview Image</DialogTitle>
          <DialogDescription>Choose which image to use as the bookmark preview.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 px-6 pb-6">
          {/* OG Image option */}
          <button
            type="button"
            onClick={() => onSelectPreview("og")}
            className={cn(
              "group/preview border-border relative cursor-pointer overflow-hidden rounded-lg border transition-all duration-200",
              selectedPreview === "og"
                ? "border-primary"
                : "border-transparent opacity-50 hover:opacity-75",
            )}>
            <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-md">
              <Image src={ogImageUrl} alt="OG Image" fill className="object-cover" unoptimized />
            </div>
            <div className="text-foreground/90 my-3 text-center text-sm font-medium">OG Image</div>
          </button>

          {/* Preview Image option */}
          <button
            type="button"
            onClick={() => onSelectPreview("preview")}
            className={cn(
              "group/preview border-border relative cursor-pointer overflow-hidden rounded-lg border transition-all duration-200",
              selectedPreview === "preview"
                ? "border-primary"
                : "border-transparent opacity-50 hover:opacity-75",
            )}>
            <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-md">
              <Image
                src={previewImageUrl}
                alt="Preview Image"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="text-foreground/90 my-3 text-center text-sm font-medium">
              Screenshot
            </div>
          </button>
        </div>

        <DialogFooter variant="default">
          <DialogClose render={<ShadcnButton variant="ghost" />}>Cancel</DialogClose>
          <Button variant="default" onClick={onSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
