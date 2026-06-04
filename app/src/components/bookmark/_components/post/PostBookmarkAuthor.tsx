"use client";

import type {ReactNode} from "react";
import Image from "next/image";
import Link from "next/link";

import type {FreebirdXPostResponse} from "@/lib/fetch/post";
import {cn} from "@/lib/utils";
import {formatPostFullDate, formatShortPostDate} from "@/lib/utils/dates";
import {Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger} from "@/components/ui/coss/tooltip";

type PostBookmarkUser = FreebirdXPostResponse["user"];

type PostBookmarkAuthorAvatarProps = {
  profileUrl: string;
  size?: "md" | "sm";
  user: PostBookmarkUser;
};

type PostBookmarkAuthorLineProps = {
  className?: string;
  profileUrl: string;
  selectionSlot?: ReactNode;
  showTimestamp?: boolean;
  timestampEpoch?: number;
  user: PostBookmarkUser;
};

export function PostShortTimestamp({epoch, className}: {epoch: number; className?: string}) {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={cn("cursor-point shrink-0 cursor-pointer hover:underline", className)}
            />
          }
          onClick={(e) => e.stopPropagation()}>
          {formatShortPostDate(epoch)}
        </TooltipTrigger>
        <TooltipPopup size="md" sideOffset={4}>
          {formatPostFullDate(epoch)}
        </TooltipPopup>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PostBookmarkAuthorAvatar({
  profileUrl,
  size = "md",
  user,
}: PostBookmarkAuthorAvatarProps) {
  const isSmall = size === "sm";

  return (
    <Link
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn("group/avatar cursor-pointer", isSmall ? "shrink-0" : "size-10")}>
      <div
        className={cn(
          "bg-muted ring-border overflow-hidden rounded-full ring-1",
          isSmall ? "h-6 w-6" : "h-10 w-10 shrink-0",
        )}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.user_profile_image_url}
          alt={user.user_name}
          width={isSmall ? undefined : 40}
          height={isSmall ? undefined : 40}
          className="h-full w-full object-cover transition-all duration-100 group-hover/avatar:brightness-95"
        />
      </div>
    </Link>
  );
}

export function PostBookmarkAuthorLine({
  className,
  profileUrl,
  selectionSlot,
  showTimestamp = false,
  timestampEpoch,
  user,
}: PostBookmarkAuthorLineProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <div className="flex min-w-0 items-center">
        {selectionSlot}

        <Link
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="group/author flex min-w-0 cursor-pointer items-center gap-[3px]">
          <span className="text-foreground truncate font-semibold group-hover/author:underline group-data-[selection-mode=true]/bookmark-row:group-hover/author:no-underline">
            {user.user_name}
          </span>
          <PostBookmarkVerificationBadge user={user} />
          <PostBookmarkAffiliateBadge user={user} />
          <span className="min-w-0 shrink truncate pl-0.5 text-[#536471]!">
            @{user.user_screen_name}
          </span>
        </Link>
      </div>

      {showTimestamp && timestampEpoch != null ? (
        <>
          <span className="text-[#536471]">{"\u00b7"}</span>
          <PostShortTimestamp epoch={timestampEpoch} className="text-[#536471]" />
        </>
      ) : null}
    </div>
  );
}

type PostBookmarkAuthorStackProps = {
  className?: string;
  profileUrl: string;
  selectionSlot?: ReactNode;
  user: PostBookmarkUser;
};

export function PostBookmarkAuthorStack({
  className,
  profileUrl,
  selectionSlot,
  user,
}: PostBookmarkAuthorStackProps) {
  return (
    <div className={cn("flex min-w-0 items-center", className)}>
      {selectionSlot}

      <Link
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="group/author flex w-fit min-w-0 cursor-pointer items-center gap-2">
        <div className="bg-muted ring-border h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.user_profile_image_url}
            alt={user.user_name}
            width={40}
            height={40}
            className="h-full w-full object-cover transition-all duration-100 group-hover/author:brightness-95"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-0 text-[15px] leading-[18px]">
          <div className="flex min-w-0 items-center gap-[3px]">
            <span className="text-foreground truncate font-semibold group-hover/author:underline group-data-[selection-mode=true]/bookmark-row:group-hover/author:no-underline">
              {user.user_name}
            </span>
            <PostBookmarkVerificationBadge user={user} />
            <PostBookmarkAffiliateBadge user={user} />
          </div>
          <span className="truncate text-sm text-[#536471]!">@{user.user_screen_name}</span>
        </div>
      </Link>
    </div>
  );
}

function PostBookmarkVerificationBadge({user}: {user: PostBookmarkUser}) {
  if (user.verification?.verified_type != null) {
    return (
      <div className="h-4.5 w-4.5 shrink-0">
        <Image
          src="/x/yellow_verified.svg"
          alt="Yellow verification badge"
          width={32}
          height={32}
        />
      </div>
    );
  }

  if (user.is_blue_verified) {
    return (
      <div className="h-4.5 w-4.5 shrink-0">
        <Image src="/x/blue_verified.svg" alt="Blue verification badge" width={32} height={32} />
      </div>
    );
  }

  return null;
}

function PostBookmarkAffiliateBadge({user}: {user: PostBookmarkUser}) {
  if (user.affiliates_highlighted_label == null) {
    return null;
  }

  return (
    <div className="h-4 w-4 rounded-[2px] border border-[#CFD9DE]">
      <Image
        src={user.affiliates_highlighted_label.badge_url}
        width={16}
        height={16}
        alt={user.affiliates_highlighted_label.description}
      />
    </div>
  );
}
