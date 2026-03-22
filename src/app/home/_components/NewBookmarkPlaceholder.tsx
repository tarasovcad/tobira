"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import {Skeleton} from "@/components/coss-ui/skeleton";
import {formatDateAbsolute} from "@/lib/formatDate";
import type {Bookmark} from "@/components/bookmark/Bookmark";
import {useViewOptionsStore} from "@/store/use-view-options";
import {useEffect} from "react";

function CrossFade({
  loaded,
  delay = 0,
  skeleton,
  children,
}: {
  loaded: boolean;
  delay?: number;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-start *:col-start-1 *:row-start-1">
      <div
        className={cn(
          "transition-all duration-500",
          loaded ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        style={{transitionDelay: `${delay}ms`}}>
        {skeleton}
      </div>
      <div
        className={cn(
          "transition-all duration-500",
          loaded ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{transitionDelay: `${delay}ms`}}>
        {children}
      </div>
    </div>
  );
}

export function NewBookmarkRow({
  url,
  bookmark,
  onDone,
}: {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
}) {
  const loaded = !!bookmark;
  const {contentToggles} = useViewOptionsStore();

  React.useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [loaded, onDone]);

  return (
    <div className="flex w-full items-center gap-5 border-b px-6 py-5 pr-16">
      <CrossFade loaded={loaded} delay={0} skeleton={<Skeleton className="size-9 rounded-md" />}>
        <div className="bg-muted size-9 rounded-md border" />
      </CrossFade>
      <div className="min-w-0 flex-1">
        <CrossFade
          loaded={!!bookmark?.title}
          delay={100}
          skeleton={<Skeleton className="h-[22.5px] w-48 rounded" />}>
          <div className="text-foreground truncate text-[15px] font-semibold">
            {bookmark?.title ?? url}
          </div>
        </CrossFade>
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="mt-0.5">
            <CrossFade
              loaded={loaded}
              delay={200}
              skeleton={<Skeleton className="h-[19.5px] w-64 rounded" />}>
              <div className="text-muted-foreground flex min-w-0 items-center gap-1 text-[13px] whitespace-nowrap">
                {contentToggles.source && (
                  <span className="min-w-0 truncate">{bookmark?.url ?? url}</span>
                )}
                {bookmark && contentToggles.source && contentToggles.savedDate ? (
                  <span className="shrink-0">-</span>
                ) : null}
                {bookmark && contentToggles.savedDate ? (
                  <span className="shrink-0">{formatDateAbsolute(bookmark.created_at)}</span>
                ) : null}
              </div>
            </CrossFade>
          </div>
        )}
        {contentToggles.description && (
          <div className="mt-2">
            <CrossFade
              loaded={!!bookmark?.description}
              delay={300}
              skeleton={<Skeleton className="h-[19.5px] w-40 rounded" />}>
              <div className="text-muted-foreground line-clamp-2 text-[13px]">
                {bookmark?.description ?? ""}
              </div>
            </CrossFade>
          </div>
        )}
      </div>
    </div>
  );
}

export function NewBookmarkGridCard({
  url,
  bookmark,
  onDone,
}: {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
}) {
  const loaded = !!bookmark;
  const {contentToggles} = useViewOptionsStore();

  React.useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [loaded, onDone]);

  return (
    <div className="bg-background w-full overflow-hidden rounded-md border">
      <CrossFade loaded={loaded} delay={0} skeleton={<Skeleton className="aspect-16/10 w-full" />}>
        <div className="bg-muted aspect-16/10 w-full" />
      </CrossFade>
      <div className="min-h-[92px] p-4">
        <CrossFade
          loaded={!!bookmark?.title}
          delay={150}
          skeleton={<Skeleton className="h-4 w-3/4 rounded" />}>
          <div className="text-foreground line-clamp-2 text-sm font-semibold">
            {bookmark?.title ?? url}
          </div>
        </CrossFade>
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="mt-1">
            <CrossFade
              loaded={loaded}
              delay={300}
              skeleton={<Skeleton className="h-3 w-1/2 rounded" />}>
              <div className="text-muted-foreground flex min-w-0 items-center gap-1 text-xs whitespace-nowrap">
                {contentToggles.source && (
                  <span className="min-w-0 truncate">{bookmark?.url ?? url}</span>
                )}
                {bookmark && contentToggles.source && contentToggles.savedDate ? (
                  <span className="shrink-0">-</span>
                ) : null}
                {bookmark && contentToggles.savedDate ? (
                  <span className="shrink-0">{formatDateAbsolute(bookmark.created_at)}</span>
                ) : null}
              </div>
            </CrossFade>
          </div>
        )}
      </div>
    </div>
  );
}

export function NewBookmarkMediaCard({
  url,
  bookmark,
  onDone,
}: {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
}) {
  const loaded = !!bookmark;
  const {borderRadius, gridGap} = useViewOptionsStore();

  const radiusClass =
    borderRadius === "none"
      ? "rounded-none"
      : borderRadius === "sm"
        ? "rounded-sm"
        : borderRadius === "md"
          ? "rounded-md"
          : "rounded-lg";

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [loaded, onDone]);

  const hasDimensions = bookmark?.metadata?.width && bookmark?.metadata?.height;
  const aspectRatio = hasDimensions
    ? `${bookmark.metadata!.width} / ${bookmark.metadata!.height}`
    : "16/9";

  return (
    <div
      className={cn(
        "bg-background relative block w-full overflow-hidden text-left",
        gridGap !== "none" && "border",
        radiusClass,
      )}
      style={{
        aspectRatio,
      }}>
      <CrossFade loaded={loaded} delay={0} skeleton={<Skeleton className="h-full w-full" />}>
        <div className="bg-muted h-full w-full" />
      </CrossFade>
    </div>
  );
}
