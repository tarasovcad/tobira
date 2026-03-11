"use client";
import * as React from "react";
import Link from "next/link";
import {formatDateAbsolute} from "@/lib/formatDate";
import {useEffect, useState} from "react";
import {cn} from "@/lib/utils";
import {Checkbox} from "@/components/coss-ui/checkbox";
import {useMediaLayoutStore} from "@/store/use-media-layout";
import MediaPreview from "../ui/MediaPreview";

export type Bookmark = {
  id: string;
  kind: "website" | "article" | "video" | "image" | "social" | "other";
  title: string;
  description: string;
  created_at: string;
  url: string;
  user_id: string;
  preview_image: string;
  updated_at: string;
  archived_at: string;
  deleted_at: string;
  notes: string;
  tags?: string[];
  collections?: {id: string; name: string}[];
};

function BookmarkHoverActions({
  className,
  onOptions,
  onDelete,
}: {
  className?: string;
  onOptions?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete?: () => void;
}) {
  const baseButtonClassName = cn(
    "pointer-events-auto inline-flex size-8 items-center justify-center rounded-md border",
    "bg-background text-foreground/90",
    "hover:bg-muted focus-visible:ring-ring/50 outline-none focus-visible:ring-2 cursor-pointer",
  );

  const stopNav = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-2 right-2 z-10 flex items-center gap-1",
        "opacity-0 transition-opacity duration-75 ease-out",
        "group-hover:pointer-events-auto group-hover:opacity-100",
        "group-focus-visible:pointer-events-auto group-focus-visible:opacity-100",
        className,
      )}>
      <button
        type="button"
        aria-label="Delete"
        className={baseButtonClassName}
        onClick={(e) => {
          stopNav(e);
          onDelete?.();
        }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.24552 3.33317H2.1665C1.89036 3.33317 1.6665 3.55703 1.6665 3.83317C1.6665 4.10931 1.89036 4.33317 2.1665 4.33317H2.66648C2.6665 4.34477 2.66691 4.35645 2.66773 4.36819L3.22761 12.3416C3.31956 13.6512 4.40871 14.6665 5.72147 14.6665H10.2782C11.591 14.6665 12.6801 13.6512 12.772 12.3416L13.332 4.36819C13.3328 4.35645 13.3332 4.34477 13.3332 4.33317H13.8332C14.1093 4.33317 14.3332 4.10931 14.3332 3.83317C14.3332 3.55703 14.1093 3.33317 13.8332 3.33317H10.7542C10.4542 2.08988 9.33524 1.1665 7.9999 1.1665C6.66455 1.1665 5.5455 2.08988 5.24552 3.33317ZM6.2914 3.33317H9.70837C9.4417 2.65039 8.77704 2.1665 7.9999 2.1665C7.2227 2.1665 6.55804 2.65039 6.2914 3.33317ZM6.6665 6.49984C6.94264 6.49984 7.1665 6.7237 7.1665 6.99984V10.8332C7.1665 11.1093 6.94264 11.3332 6.6665 11.3332C6.39036 11.3332 6.1665 11.1093 6.1665 10.8332V6.99984C6.1665 6.7237 6.39036 6.49984 6.6665 6.49984ZM9.33317 6.49984C9.6093 6.49984 9.83317 6.7237 9.83317 6.99984V10.8332C9.83317 11.1093 9.6093 11.3332 9.33317 11.3332C9.05704 11.3332 8.83317 11.1093 8.83317 10.8332V6.99984C8.83317 6.7237 9.05704 6.49984 9.33317 6.49984Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Options"
        className={baseButtonClassName}
        onClick={(e) => {
          stopNav(e);
          onOptions?.(e);
        }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.50016 6.8335C1.85583 6.8335 1.3335 7.35583 1.3335 8.00016C1.3335 8.6445 1.85583 9.16683 2.50016 9.16683C3.1445 9.16683 3.66683 8.6445 3.66683 8.00016C3.66683 7.35583 3.1445 6.8335 2.50016 6.8335Z"
            fill="currentColor"
          />
          <path
            d="M8.00016 6.8335C7.35583 6.8335 6.8335 7.35583 6.8335 8.00016C6.8335 8.6445 7.35583 9.16683 8.00016 9.16683C8.6445 9.16683 9.16683 8.6445 9.16683 8.00016C9.16683 7.35583 8.6445 6.8335 8.00016 6.8335Z"
            fill="currentColor"
          />
          <path
            d="M13.5002 6.8335C12.8558 6.8335 12.3335 7.35583 12.3335 8.00016C12.3335 8.6445 12.8558 9.16683 13.5002 9.16683C14.1445 9.16683 14.6668 8.6445 14.6668 8.00016C14.6668 7.35583 14.1445 6.8335 13.5002 6.8335Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

const BookmarkImage = ({
  bookmark_id,
  item,
  type,
  divClassName,
  imageClassName,
  height,
  width,
  fallbackClassName,
  fill,
}: {
  bookmark_id: string;
  item: Bookmark;
  type: "preview" | "favicon" | "og";
  divClassName?: string;
  imageClassName?: string;
  height?: number;
  width?: number;
  fallbackClassName?: string;
  fill?: boolean;
}) => {
  let BASE_SRC = "";

  switch (type) {
    case "preview":
      BASE_SRC = item.preview_image ?? "";
      break;
    case "favicon":
      BASE_SRC = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bookmark-favicons/${bookmark_id}/favicon.png`;
      break;
  }
  const MAX_RETRIES = 12; // ~24s at 2s interval
  const RETRY_MS = 2000;

  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  const isVideo =
    BASE_SRC.toLowerCase().endsWith(".mp4") || BASE_SRC.toLowerCase().endsWith(".mov");

  // If the image 404s (still uploading), retry with a cache-busting query param.
  useEffect(() => {
    if (status !== "error") return;
    if (attempt >= MAX_RETRIES) return;

    const t = window.setTimeout(() => {
      setAttempt((a) => a + 1);
      setStatus("loading");
    }, RETRY_MS);

    return () => window.clearTimeout(t);
  }, [attempt, status]);

  return (
    <div
      className={cn(
        fill ? "absolute inset-0" : "relative",
        "grid place-items-center",
        divClassName,
      )}>
      {status !== "loaded" ? (
        <div className={cn("text-muted-foreground", fallbackClassName)}>
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
      ) : null}

      {/* Cache-busted favicon attempts. Keep hidden until loaded to avoid alt text flashes. */}
      <div className={cn(fill ? "absolute inset-0" : "relative h-full w-full")}>
        <MediaPreview
          src={`${BASE_SRC}?v=${attempt}`}
          alt={`${bookmark_id} ${type}`}
          width={width ?? 1200}
          height={height ?? 1200}
          addZoom={!isVideo}
          type={isVideo ? "video" : "image"}
          className={cn(status === "loaded" ? "opacity-100" : "opacity-0", imageClassName)}
          unoptimized={!isVideo ? true : undefined}
          onLoad={!isVideo ? () => setStatus("loaded") : undefined}
          onCanPlay={isVideo ? () => setStatus("loaded") : undefined}
          onError={() => setStatus("error")}
        />
      </div>
    </div>
  );
};

export const ItemRow = ({
  item,
  onOpenMenu,
  onDelete,
  className,
  selectionMode,
  selectionIndex = 0,
  selectedIds,
  setSelected,
}: {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  className?: string;
  selectionMode?: boolean;
  selectionIndex?: number;
  selectedIds?: Set<string>;
  setSelected?: (id: string, checked: boolean) => void;
}) => {
  return (
    <Link
      href={item.url}
      target="_blank"
      className={cn(
        "group relative flex w-full cursor-pointer gap-5 border-b px-6 py-5 pr-16 text-left",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        selectionMode && selectedIds?.has(item.id) && "bg-muted",
        className,
      )}>
      {!selectionMode && (
        <BookmarkHoverActions
          className="top-4 right-4"
          onOptions={() => {
            onOpenMenu?.(item);
          }}
          onDelete={() => {
            onDelete?.(item);
          }}
        />
      )}

      <div className="flex items-center">
        {/* Animated checkbox slot — always rendered, width animated via grid-cols */}
        <div
          className={cn(
            "grid shrink-0 items-center transition-[grid-template-columns,opacity] duration-200 ease-out",
            selectionMode ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
          )}
          style={{
            transitionDelay: selectionMode ? `${Math.min(selectionIndex * 20, 120)}ms` : "0ms",
          }}>
          <div className="min-w-0 overflow-hidden">
            <div className="pr-3">
              <Checkbox
                checked={selectedIds?.has(item.id)}
                onCheckedChange={(next) => setSelected?.(item.id, next === true)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${item.title}`}
              />
            </div>
          </div>
        </div>
        <div className="relative size-9 shrink-0 overflow-hidden rounded-md border">
          <BookmarkImage
            bookmark_id={item.id}
            item={item}
            type="favicon"
            divClassName="absolute inset-0 grid grid-cols-1 grid-rows-1 place-items-center"
            imageClassName="col-start-1 row-start-1 h-full max-h-6 w-full max-w-6 object-cover"
            fallbackClassName="text-muted-foreground col-start-1 row-start-1"
            height={24}
            width={24}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1 text-[13px]">
        <div className="text-foreground truncate text-[15px] font-semibold">{item.title}</div>
        <div className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1 whitespace-nowrap">
          <span className="min-w-0 truncate">{item.url}</span>
          <span className="shrink-0">-</span>
          <span className="shrink-0">{formatDateAbsolute(item.created_at)}</span>
        </div>
        {item.description ? (
          <div className="text-muted-foreground mt-2 line-clamp-2">{item.description}</div>
        ) : null}
      </div>
    </Link>
  );
};

export const GridCard = ({
  item,
  onOpenMenu,
  onDelete,
  selectionMode,
  selectionIndex = 0,
  selectedIds,
  setSelected,
}: {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  selectionMode?: boolean;
  selectionIndex?: number;
  selectedIds?: Set<string>;
  setSelected?: (id: string, checked: boolean) => void;
}) => {
  return (
    <Link
      href={item.url}
      className={cn(
        "group bg-background relative block w-full cursor-pointer overflow-hidden rounded-md border text-left",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! outline-none",
        selectionMode && selectedIds?.has(item.id) && "bg-muted",
      )}>
      <div className="bg-muted relative aspect-16/10 w-full">
        {!selectionMode && (
          <BookmarkHoverActions
            onOptions={() => {
              onOpenMenu?.(item);
            }}
            onDelete={() => {
              onDelete?.(item);
            }}
          />
        )}

        <div
          className={cn(
            "absolute top-2 left-2 z-20",
            selectionMode ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0",
          )}
          style={{
            transitionDelay: selectionMode ? `${Math.min(selectionIndex * 15, 120)}ms` : "0ms",
          }}>
          <Checkbox
            checked={selectedIds?.has(item.id)}
            onCheckedChange={(next) => setSelected?.(item.id, next === true)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${item.title}`}
          />
        </div>

        <BookmarkImage
          bookmark_id={item.id}
          item={item}
          type="preview"
          fill={true}
          imageClassName="rounded-md object-cover rounded-b-none overflow-hidden"
        />
      </div>

      <div className="p-4 pt-3">
        <div className="text-foreground line-clamp-1 text-sm text-[15px] font-semibold">
          {item.title}
        </div>
        <div className="text-muted-foreground mt-1 flex min-w-0 items-center gap-1 text-[13px] whitespace-nowrap">
          <span className="min-w-0 truncate">{item.url}</span>
          <span className="shrink-0">-</span>
          <span className="shrink-0">{formatDateAbsolute(item.created_at)}</span>
        </div>
      </div>
    </Link>
  );
};

export const MediaCard = ({
  item,
  onOpenMenu,
  onDelete,
  selectionMode,
  selectionIndex = 0,
  selectedIds,
  setSelected,
}: {
  item: Bookmark;
  onOpenMenu?: (item: Bookmark) => void;
  onDelete?: (item: Bookmark) => void;
  selectionMode?: boolean;
  selectionIndex?: number;
  selectedIds?: Set<string>;
  setSelected?: (id: string, checked: boolean) => void;
}) => {
  const {borderRadius, gapSize} = useMediaLayoutStore();
  const radiusClass =
    borderRadius === "sharp"
      ? "rounded-none"
      : borderRadius === "pill"
        ? "rounded-2xl"
        : "rounded-md";

  return (
    <div
      className={cn(
        "group bg-background relative block w-full cursor-pointer overflow-hidden text-left",
        gapSize !== "none" && "border",
        "hover:bg-muted/80",
        "focus-visible:bg-muted! focus-visible:outline-none",
        selectionMode && selectedIds?.has(item.id) && "bg-muted",
        radiusClass,
      )}>
      {!selectionMode && (
        <BookmarkHoverActions
          onOptions={() => {
            onOpenMenu?.(item);
          }}
          onDelete={() => {
            onDelete?.(item);
          }}
        />
      )}

      <div
        className={cn(
          "absolute top-2 left-2 z-20",
          selectionMode ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0",
        )}
        style={{
          transitionDelay: selectionMode ? `${Math.min(selectionIndex * 15, 120)}ms` : "0ms",
        }}>
        <Checkbox
          checked={selectedIds?.has(item.id)}
          onCheckedChange={(next) => setSelected?.(item.id, next === true)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${item.title}`}
        />
      </div>

      <BookmarkImage
        bookmark_id={item.id}
        item={item}
        type="preview"
        width={1200}
        height={1200}
        imageClassName="w-full h-auto object-cover"
      />

      {/* <div className="p-3">
        <div className="text-foreground line-clamp-2 text-[14px] font-medium leading-tight">
          {item.title}
        </div>
        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[12px]">
          <div className="relative size-4 overflow-hidden rounded-full border">
             <BookmarkImage
               bookmark_id={item.id}
               item={item}
               type="favicon"
               fill={true}
               imageClassName="object-cover"
             />
          </div>
          <span className="truncate">{item.url ? (() => { try { return new URL(item.url).hostname } catch(e) { return item.url } })() : "Unknown"}</span>
        </div>
      </div> */}
    </div>
  );
};
