"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import {Skeleton} from "@/components/coss-ui/skeleton";
import {formatDateAbsolute} from "@/lib/formatDate";
import type {Bookmark} from "@/components/bookmark/types";
import {useViewOptionsStore} from "@/store/use-view-options";
import {useEffect} from "react";
import {Tag} from "@/components/ui/Tag";

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
    <div className="grid w-full min-w-0 grid-cols-1 items-start *:col-start-1 *:row-start-1">
      <div
        className={cn(
          "w-full min-w-0 transition-all duration-500",
          loaded ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        style={{transitionDelay: `${delay}ms`}}>
        {skeleton}
      </div>
      <div
        className={cn(
          "w-full min-w-0 transition-all duration-500",
          loaded ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{transitionDelay: `${delay}ms`}}>
        {children}
      </div>
    </div>
  );
}

export function NewBookmarkList({
  url,
  bookmark,
  onDone,
  tags,
}: {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
  tags?: string[];
}) {
  const loaded = !!bookmark;
  const {contentToggles} = useViewOptionsStore();

  React.useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [loaded, onDone]);

  return (
    <div className="flex w-full flex-col gap-2 border-b px-6 py-5 pr-16">
      <div className="flex min-w-0 flex-1 items-center gap-5">
        <CrossFade loaded={loaded} delay={0} skeleton={<Skeleton className="size-9 rounded-md" />}>
          <div className="bg-muted size-9 rounded-md border" />
        </CrossFade>
        <div className="min-w-0 flex-1 text-[13px]">
          <CrossFade
            loaded={!!bookmark?.title}
            delay={100}
            skeleton={<Skeleton className="h-[22.5px] w-48 rounded" />}>
            <div className="text-foreground truncate text-[15px] font-semibold">
              {bookmark?.title ?? url}
            </div>
          </CrossFade>
          {(contentToggles.source || contentToggles.savedDate) && (
            <div className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1 whitespace-nowrap">
              <CrossFade
                loaded={loaded}
                delay={200}
                skeleton={<Skeleton className="h-[19.5px] w-64 rounded" />}>
                <div className="flex min-w-0 items-center gap-1">
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
            <div
              className={cn(
                "text-muted-foreground",
                contentToggles.source || contentToggles.savedDate ? "mt-1.5" : "mt-0.5",
              )}>
              <CrossFade
                loaded={!!bookmark?.description}
                delay={300}
                skeleton={<Skeleton className="h-[19.5px] w-40 rounded" />}>
                <div className="line-clamp-1">{bookmark?.description ?? ""}</div>
              </CrossFade>
            </div>
          )}
        </div>
      </div>
      {contentToggles.tags &&
        ((tags && tags.length > 0) || (bookmark?.tags && bookmark.tags.length > 0)) && (
          <div className="pl-14">
            <CrossFade
              loaded={!!(bookmark?.tags && bookmark.tags.length > 0)}
              delay={400}
              skeleton={
                <div className="flex gap-2">
                  <Skeleton className="h-[20.5px] w-16 rounded-[2px]" />
                  <Skeleton className="h-[20.5px] w-20 rounded-[2px]" />
                </div>
              }>
              <div className="flex flex-wrap gap-1">
                {bookmark?.tags?.map((tag) => (
                  <Tag key={tag} className="text-muted-foreground text-[12px]">
                    {tag}
                  </Tag>
                ))}
              </div>
            </CrossFade>
          </div>
        )}
    </div>
  );
}

export function NewBookmarkGridCard({
  url,
  bookmark,
  onDone,
  tags,
}: {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
  tags?: string[];
}) {
  const loaded = !!bookmark;
  const {borderRadius, contentToggles, gridGap} = useViewOptionsStore();
  const zeroGap = gridGap === "none";
  const onlyTitle =
    !contentToggles.source &&
    !contentToggles.savedDate &&
    !contentToggles.description &&
    !(
      contentToggles.tags &&
      ((tags && tags.length > 0) || (bookmark?.tags && bookmark.tags.length > 0))
    );

  const radiusClass =
    borderRadius === "none" || zeroGap
      ? "rounded-none"
      : borderRadius === "sm"
        ? "rounded-sm"
        : borderRadius === "md"
          ? "rounded-md"
          : "rounded-lg";

  React.useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [loaded, onDone]);

  return (
    <div
      className={cn(
        "bg-background relative flex h-full w-full flex-col overflow-hidden text-left",
        zeroGap ? "border-r border-b" : "border",
        radiusClass,
      )}>
      <div className="bg-muted relative aspect-16/10 w-full shrink-0 overflow-hidden">
        <CrossFade
          loaded={loaded}
          delay={0}
          skeleton={<Skeleton className="absolute inset-0 size-full rounded-none" />}>
          <div className="bg-muted aspect-16/10 w-full" />
        </CrossFade>
      </div>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col px-4",
          onlyTitle ? "py-3" : "pt-3 pb-4",
        )}>
        <CrossFade
          loaded={!!bookmark?.title}
          delay={150}
          skeleton={
            <div className="flex flex-col gap-2">
              <Skeleton className="h-[22.5px] w-full max-w-[92%] rounded-sm" />
            </div>
          }>
          <div className="text-foreground line-clamp-1 text-[15px] font-[550]">
            {bookmark?.title ?? url}
          </div>
        </CrossFade>
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="text-muted-foreground mt-1 min-w-0 text-[13px] whitespace-nowrap">
            <CrossFade
              loaded={loaded}
              delay={300}
              skeleton={<Skeleton className="h-[19.5px] w-full rounded-sm" />}>
              <div className="flex min-w-0 items-center gap-1">
                {contentToggles.source && (
                  <span className="min-w-0 flex-1 truncate">{bookmark?.url ?? url}</span>
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
          <div className="text-muted-foreground mt-1.5">
            <CrossFade
              loaded={!!bookmark?.description}
              delay={400}
              skeleton={
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-[19.5px] w-full max-w-full rounded-sm" />
                  <Skeleton className="h-[19.5px] w-full max-w-[58%] rounded-sm" />
                </div>
              }>
              <div className="line-clamp-2 text-[13px]">{bookmark?.description ?? ""}</div>
            </CrossFade>
          </div>
        )}
        {contentToggles.tags &&
          (!loaded ||
            (tags && tags.length > 0) ||
            (bookmark?.tags && bookmark.tags.length > 0)) && (
            <div className="mt-2 flex flex-wrap gap-1">
              <CrossFade
                loaded={
                  !!((bookmark?.tags && bookmark.tags.length > 0) || (tags && tags.length > 0))
                }
                delay={500}
                skeleton={
                  <div className="flex flex-wrap gap-1">
                    <Skeleton className="h-[20.5px] w-14 rounded-[2px]" />
                    <Skeleton className="h-[20.5px] w-18 rounded-[2px]" />
                    <Skeleton className="h-[20.5px] w-12 rounded-[2px]" />
                  </div>
                }>
                <div className="flex flex-wrap gap-1">
                  {(bookmark?.tags ?? tags ?? []).map((tag) => (
                    <Tag key={tag} className="text-muted-foreground text-[12px]">
                      {tag}
                    </Tag>
                  ))}
                </div>
              </CrossFade>
            </div>
          )}
      </div>
    </div>
  );
}

export function NewBookmarkCompact({
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

  const domain = React.useMemo(() => {
    try {
      return new URL(bookmark?.url ?? url).hostname.replace(/^www\./, "");
    } catch {
      return bookmark?.url ?? url;
    }
  }, [bookmark?.url, url]);

  return (
    <div className="flex min-h-[45px] w-full items-center gap-3 border-b px-5 py-2.5 pr-12">
      <div className="flex shrink-0 items-center">
        <CrossFade
          loaded={loaded}
          delay={0}
          skeleton={<Skeleton className="size-[18px] rounded-none" />}>
          <div className="bg-muted size-[18px] rounded-none" />
        </CrossFade>
      </div>

      <div className="min-w-0 flex-1">
        <CrossFade
          loaded={!!bookmark?.title}
          delay={100}
          skeleton={<Skeleton className="h-[20px] w-48 rounded" />}>
          <div className="text-foreground truncate text-[13.5px]">{bookmark?.title ?? url}</div>
        </CrossFade>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {(contentToggles.source || contentToggles.savedDate) && (
          <div className="text-muted-foreground hidden items-center gap-1 text-[12px] sm:flex">
            <CrossFade
              loaded={loaded}
              delay={200}
              skeleton={<Skeleton className="h-[18px] w-24 rounded" />}>
              <div className="flex items-center gap-1">
                {contentToggles.source && <span>{domain}</span>}
                {bookmark && contentToggles.source && contentToggles.savedDate && (
                  <span className="shrink-0">/</span>
                )}
                {bookmark && contentToggles.savedDate && (
                  <span className="shrink-0">{formatDateAbsolute(bookmark.created_at)}</span>
                )}
              </div>
            </CrossFade>
          </div>
        )}

        {contentToggles.tags && (!bookmark || (bookmark.tags && bookmark.tags.length > 0)) && (
          <div className="flex items-center gap-1">
            <CrossFade
              loaded={!!(bookmark?.tags && bookmark.tags.length > 0)}
              delay={300}
              skeleton={
                <div className="flex gap-1">
                  <Skeleton className="h-[18px] w-12 rounded-[2px]" />
                  <Skeleton className="h-[18px] w-16 rounded-[2px]" />
                </div>
              }>
              <div className="flex items-center gap-1">
                {bookmark?.tags?.slice(0, 2).map((tag) => (
                  <Tag key={tag} className="text-muted-foreground text-[12px]">
                    {tag}
                  </Tag>
                ))}
              </div>
            </CrossFade>
          </div>
        )}
      </div>
    </div>
  );
}

export function NewBookmarkMediaCard({
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
