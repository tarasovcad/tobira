"use client";

import {useState} from "react";
import Image from "next/image";
import {cn} from "@/lib/utils";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/coss/dialog";
import {Button} from "@/components/ui/coss/button";
import {Button as ShadcnButton} from "@/components/ui/legacy-shadcn/button";

interface BookmarkPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ogImageUrl: string;
  previewImageUrl: string;
  selectedPreview: "og" | "preview";
  onSelectPreview: (val: "og" | "preview") => void;
  onSave: () => void;
}

function BookmarkImageFallback() {
  return (
    <div className="text-muted-foreground/30 z-10 col-start-1 row-start-1">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.375 2.5C16.1009 2.5 17.5 3.89911 17.5 5.625V14.375C17.5 16.1009 16.1009 17.5 14.375 17.5H5.625C3.89911 17.5 2.5 16.1009 2.5 14.375V5.625C2.5 3.89911 3.89911 2.5 5.625 2.5H14.375ZM7.99235 11.3257C7.26015 10.5937 6.07318 10.5937 5.34098 11.3257L3.75 12.9167V14.375C3.75 15.4105 4.58947 16.25 5.625 16.25H12.9167L7.99235 11.3257ZM12.5 5.41667C11.3494 5.41667 10.4167 6.34941 10.4167 7.5C10.4167 8.65058 11.3494 9.58333 12.5 9.58333C13.6506 9.58333 14.5833 8.65058 14.5833 7.5C14.5833 6.34941 13.6506 5.41667 12.5 5.41667Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

function PreviewOptionImage({src, alt}: {src: string; alt: string}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");

  const hasSrc = !!src;
  const isLoaded = hasSrc && status === "loaded";

  return (
    <div className="bg-muted relative grid aspect-video w-full place-items-center overflow-hidden rounded-md">
      {!isLoaded ? <BookmarkImageFallback /> : null}

      {hasSrc ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "col-start-1 row-start-1 object-cover transition-opacity duration-300 ease-in-out",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          unoptimized
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      ) : null}
    </div>
  );
}

export default function BookmarkPreviewDialog({
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
      <DialogPopup className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Change Preview Image</DialogTitle>
          <DialogDescription>Choose which image to use as the bookmark preview.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 px-6 pb-6">
          {/* OG Image option */}
          <button
            type="button"
            onClick={() => onSelectPreview("og")}
            className={cn(
              "group/preview focus-visible:ring-ring relative cursor-pointer rounded-xl border-2 p-1.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              selectedPreview === "og"
                ? "border-highlight ring-highlight/20"
                : "hover:bg-accent/50 border-transparent opacity-70 hover:opacity-100",
            )}>
            <div className="relative overflow-hidden rounded-lg shadow-sm">
              <PreviewOptionImage src={ogImageUrl} alt="OG Image" />
              <div
                className={cn(
                  "bg-primary/10 absolute inset-0 transition-opacity duration-200",
                  selectedPreview === "og" ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                className={cn(
                  "bg-primary text-primary-foreground absolute top-2 right-2 flex h-6 w-6 scale-50 items-center justify-center rounded-full opacity-0 shadow-sm transition-all duration-200",
                  selectedPreview === "og" && "scale-100 opacity-100",
                )}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5.16699 8.6154L7.04199 10.5L10.167 5.83333"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div
              className={cn(
                "my-2.5 text-center text-sm font-[450] transition-colors",
                selectedPreview === "og"
                  ? "text-primary"
                  : "text-muted-foreground group-hover/preview:text-foreground",
              )}>
              OG Image
            </div>
          </button>

          {/* Preview Image option */}
          <button
            type="button"
            onClick={() => onSelectPreview("preview")}
            className={cn(
              "group/preview focus-visible:ring-ring relative cursor-pointer rounded-xl border-2 p-1.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              selectedPreview === "preview"
                ? "border-highlight ring-highlight/20"
                : "hover:bg-accent/50 border-transparent opacity-70 hover:opacity-100",
            )}>
            <div className="relative overflow-hidden rounded-lg">
              <PreviewOptionImage src={previewImageUrl} alt="Preview Image" />
              <div
                className={cn(
                  "bg-primary/10 absolute inset-0 transition-opacity duration-200",
                  selectedPreview === "preview" ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                className={cn(
                  "bg-primary text-primary-foreground absolute top-2 right-2 flex h-6 w-6 scale-50 items-center justify-center rounded-full opacity-0 shadow-sm transition-all duration-200",
                  selectedPreview === "preview" && "scale-100 opacity-100",
                )}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5.16699 8.6154L7.04199 10.5L10.167 5.83333"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div
              className={cn(
                "my-2.5 text-center text-sm font-medium transition-colors",
                selectedPreview === "preview"
                  ? "text-primary"
                  : "text-muted-foreground group-hover/preview:text-foreground",
              )}>
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
