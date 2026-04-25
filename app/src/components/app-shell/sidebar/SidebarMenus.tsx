"use client";

import React from "react";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/shadcn/context-menu";
import Link from "next/link";
import {useCollectionDialogStore} from "@/store/use-collection-dialog-store";
import {useTagDialogStore} from "@/store/use-tag-dialog-store";
import type {Collection} from "@/app/actions/collections";
import type {SidebarTag} from "@/features/home/types";
import {getTagById, toggleTagPin} from "@/app/actions/tags";
import {toggleCollectionPin} from "@/app/actions/collections";
import {toastManager} from "@/components/coss-ui/toast";

async function handleToggleCollectionPin(
  collectionId: string,
  isPinned: boolean,
  onSuccess?: () => void,
) {
  try {
    await toggleCollectionPin(collectionId, !isPinned);
    onSuccess?.();
    toastManager.add({
      title: isPinned ? "Collection unpinned" : "Collection pinned",
      type: "success",
    });
  } catch (error) {
    toastManager.add({
      title: "Action failed",
      description: error instanceof Error ? error.message : "Something went wrong",
      type: "error",
    });
  }
}

async function handleToggleTagPin(tagId: string, isPinned: boolean, onSuccess?: () => void) {
  try {
    await toggleTagPin(tagId, !isPinned);
    onSuccess?.();
    toastManager.add({
      title: isPinned ? "Tag unpinned" : "Tag pinned",
      type: "success",
    });
  } catch (error) {
    toastManager.add({
      title: "Action failed",
      description: error instanceof Error ? error.message : "Something went wrong",
      type: "error",
    });
  }
}

async function handleOpenTagDialog(
  tagId: string,
  openTagDialog: (tag: NonNullable<Awaited<ReturnType<typeof getTagById>>>) => void,
) {
  try {
    const tag = await getTagById(tagId);
    if (!tag) {
      throw new Error("Tag not found");
    }
    openTagDialog(tag);
  } catch (error) {
    toastManager.add({
      title: "Failed to load tag",
      description: error instanceof Error ? error.message : "Something went wrong",
      type: "error",
    });
  }
}

interface CollectionContextMenuContentProps {
  collection: Collection;
  onCopy: () => void;
  onDelete: () => void;
}

export function CollectionContextMenuContent({
  collection,
  onCopy,
  onDelete,
}: CollectionContextMenuContentProps) {
  const openCollectionDialog = useCollectionDialogStore((state) => state.openDialog);

  return (
    <ContextMenuContent>
      <Link href={`/home?collection=${collection.id}`}>
        <ContextMenuItem>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.00039 2.66667C10.4959 2.66669 12.9312 4.10717 14.6101 6.8632C15.0346 7.56 15.0346 8.44 14.6101 9.1368C12.9312 11.8929 10.4959 13.3333 8.00039 13.3333C5.50483 13.3333 3.06951 11.8928 1.39061 9.13673C0.966152 8.43993 0.966146 7.55993 1.39062 6.86313C3.06951 4.10709 5.50483 2.66665 8.00039 2.66667ZM5.5837 8C5.5837 6.66531 6.66568 5.58333 8.00039 5.58333C9.33506 5.58333 10.4171 6.66531 10.4171 8C10.4171 9.33467 9.33506 10.4167 8.00039 10.4167C6.66568 10.4167 5.5837 9.33467 5.5837 8Z"
              fill="currentColor"
            />
          </svg>
          Open
        </ContextMenuItem>
      </Link>

      <ContextMenuItem onClick={() => openCollectionDialog(collection)}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.66699 3.83333C2.66699 2.45262 3.78628 1.33333 5.16699 1.33333H10.8337C12.2144 1.33333 13.3337 2.45262 13.3337 3.83333V8.44493C12.4141 8.11113 11.3438 8.31293 10.6063 9.0504L8.10633 11.5504C7.82506 11.8317 7.66699 12.2133 7.66699 12.6111V14.1666C7.66699 14.3419 7.69706 14.5103 7.75239 14.6667H5.16699C3.78628 14.6667 2.66699 13.5474 2.66699 12.1667V3.83333ZM5.33366 4.5C5.33366 4.22386 5.55752 4 5.83366 4H10.167C10.4431 4 10.667 4.22386 10.667 4.5C10.667 4.77614 10.4431 5 10.167 5H5.83366C5.55752 5 5.33366 4.77614 5.33366 4.5ZM5.83366 6.66667C5.55752 6.66667 5.33366 6.89053 5.33366 7.16667C5.33366 7.4428 5.55752 7.66667 5.83366 7.66667H7.50033C7.77646 7.66667 8.00033 7.4428 8.00033 7.16667C8.00033 6.89053 7.77646 6.66667 7.50033 6.66667H5.83366Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.869 10.4646C12.6347 10.2303 12.2549 10.2303 12.0205 10.4646L9.66699 12.8182V13.6666H10.5155L12.869 11.3131C13.1033 11.0788 13.1033 10.6989 12.869 10.4646ZM11.3135 9.75753C11.9383 9.13267 12.9513 9.13267 13.5761 9.75753C14.2009 10.3823 14.2009 11.3953 13.5761 12.0202L11.0761 14.5202C10.9823 14.6139 10.8551 14.6666 10.7225 14.6666H9.16699C8.89086 14.6666 8.66699 14.4427 8.66699 14.1666V12.6111C8.66699 12.4785 8.71966 12.3513 8.81346 12.2575L11.3135 9.75753Z"
            fill="currentColor"
          />
        </svg>
        Edit
      </ContextMenuItem>

      <ContextMenuItem onClick={onCopy}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.3787 2.66667H10.8337C12.2144 2.66667 13.3337 3.78595 13.3337 5.16667V12.1667C13.3337 13.5474 12.2144 14.6667 10.8337 14.6667H5.16699C3.78628 14.6667 2.66699 13.5474 2.66699 12.1667V5.16667C2.66699 3.78595 3.78628 2.66667 5.16699 2.66667H5.62201C6.04117 1.8737 6.87433 1.33333 7.83366 1.33333H8.16699C9.12633 1.33333 9.95946 1.8737 10.3787 2.66667ZM9.66699 3.83333C9.66699 3.00491 8.99539 2.33333 8.16699 2.33333H7.83366C7.00526 2.33333 6.33366 3.00491 6.33366 3.83333V4.16667C6.33366 4.25871 6.40828 4.33333 6.50033 4.33333H9.50033C9.59239 4.33333 9.66699 4.25871 9.66699 4.16667V3.83333Z"
            fill="currentColor"
          />
        </svg>
        Copy
      </ContextMenuItem>

      <ContextMenuItem
        onClick={() => handleToggleCollectionPin(collection.id, collection.is_pinned)}>
        {collection.is_pinned ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1.87621 1.18107C2.14427 0.928813 2.56657 0.941759 2.81892 1.20971L4.76553 3.27807L4.76619 3.27677L11.7212 10.6667H11.72L13.4856 12.5431C13.7379 12.8111 13.725 13.2334 13.4569 13.4857C13.1888 13.7381 12.7666 13.7252 12.5142 13.4571L9.88791 10.6667H8.66657V13.4213C8.66657 13.4729 8.6545 13.5242 8.63144 13.5704L8.14897 14.5353C8.08757 14.658 7.91224 14.658 7.85084 14.5353L7.36837 13.5704C7.3453 13.5241 7.33324 13.4729 7.33324 13.4213V10.6667H3.99991C3.29379 10.6666 2.60161 10.0711 2.71996 9.24093L2.76749 8.963C3.01556 7.7056 3.70633 6.61008 4.66657 5.83992L5.06175 5.53914L1.84757 2.12377C1.59541 1.85565 1.60817 1.43335 1.87621 1.18107Z"
                fill="currentColor"
              />
              <path
                d="M8.6665 1.3334C10.1391 1.33356 11.3331 2.52748 11.3332 4.00007V5.83991C12.3636 6.66634 13.0838 7.86746 13.2798 9.24092C13.3297 9.59106 13.2338 9.89852 13.0552 10.1381L5.47705 2.086C5.95713 1.62051 6.61172 1.33348 7.33317 1.3334H8.6665Z"
                fill="currentColor"
              />
            </svg>
            Unpin
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.83366 1.33334C5.45295 1.33334 4.33366 2.45262 4.33366 3.83334V4.66464C4.33366 5.81391 3.87711 6.91614 3.06446 7.72874L2.81344 7.9798C2.71967 8.07354 2.66699 8.20074 2.66699 8.33334V10.1667C2.66699 10.2993 2.71967 10.4265 2.81344 10.5202C2.90721 10.614 3.03439 10.6667 3.16699 10.6667H7.50033V14.1667C7.50033 14.4428 7.72419 14.6667 8.00033 14.6667C8.27646 14.6667 8.50033 14.4428 8.50033 14.1667V10.6667H12.8337C13.1098 10.6667 13.3337 10.4428 13.3337 10.1667V8.33334C13.3337 8.20074 13.281 8.07354 13.1872 7.9798L12.9362 7.72874C12.1235 6.91614 11.667 5.81391 11.667 4.66464V3.83334C11.667 2.45262 10.5477 1.33334 9.16699 1.33334H6.83366Z"
                fill="currentColor"
              />
            </svg>
            Pin
          </>
        )}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onClick={onDelete}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.24601 3.33334H2.16699C1.89085 3.33334 1.66699 3.5572 1.66699 3.83334C1.66699 4.10948 1.89085 4.33334 2.16699 4.33334H2.66697C2.66699 4.34494 2.6674 4.35662 2.66822 4.36836L3.2281 12.3418C3.32005 13.6513 4.4092 14.6667 5.72196 14.6667H10.2787C11.5915 14.6667 12.6806 13.6513 12.7725 12.3418L13.3325 4.36836C13.3333 4.35662 13.3337 4.34494 13.3337 4.33334H13.8337C14.1098 4.33334 14.3337 4.10948 14.3337 3.83334C14.3337 3.5572 14.1098 3.33334 13.8337 3.33334H10.7547C10.4547 2.09005 9.33573 1.16667 8.00039 1.16667C6.66504 1.16667 5.54599 2.09005 5.24601 3.33334ZM6.29188 3.33334H9.70886C9.44219 2.65056 8.77752 2.16667 8.00039 2.16667C7.22319 2.16667 6.55853 2.65056 6.29188 3.33334ZM6.66699 6.50001C6.94313 6.50001 7.16699 6.72387 7.16699 7.00001V10.8333C7.16699 11.1095 6.94313 11.3333 6.66699 11.3333C6.39085 11.3333 6.16699 11.1095 6.16699 10.8333V7.00001C6.16699 6.72387 6.39085 6.50001 6.66699 6.50001ZM9.33366 6.50001C9.60979 6.50001 9.83366 6.72387 9.83366 7.00001V10.8333C9.83366 11.1095 9.60979 11.3333 9.33366 11.3333C9.05753 11.3333 8.83366 11.1095 8.83366 10.8333V7.00001C8.83366 6.72387 9.05753 6.50001 9.33366 6.50001Z"
            fill="currentColor"
          />
        </svg>
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

interface TagContextMenuContentProps {
  tag: SidebarTag;
  onCopy: () => void;
  onDelete: () => void;
}

export function TagContextMenuContent({tag, onCopy, onDelete}: TagContextMenuContentProps) {
  const openTagDialog = useTagDialogStore((state) => state.openDialog);

  return (
    <ContextMenuContent>
      <Link href={`/home?tag=${tag.id}`}>
        <ContextMenuItem>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.00039 2.66667C10.4959 2.66669 12.9312 4.10717 14.6101 6.8632C15.0346 7.56 15.0346 8.44 14.6101 9.1368C12.9312 11.8929 10.4959 13.3333 8.00039 13.3333C5.50483 13.3333 3.06951 11.8928 1.39061 9.13673C0.966152 8.43993 0.966146 7.55993 1.39062 6.86313C3.06951 4.10709 5.50483 2.66665 8.00039 2.66667ZM5.5837 8C5.5837 6.66531 6.66568 5.58333 8.00039 5.58333C9.33506 5.58333 10.4171 6.66531 10.4171 8C10.4171 9.33467 9.33506 10.4167 8.00039 10.4167C6.66568 10.4167 5.5837 9.33467 5.5837 8Z"
              fill="currentColor"
            />
          </svg>
          Open
        </ContextMenuItem>
      </Link>

      <ContextMenuItem onClick={() => void handleOpenTagDialog(tag.id, openTagDialog)}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.66699 3.83333C2.66699 2.45262 3.78628 1.33333 5.16699 1.33333H10.8337C12.2144 1.33333 13.3337 2.45262 13.3337 3.83333V8.44493C12.4141 8.11113 11.3438 8.31293 10.6063 9.0504L8.10633 11.5504C7.82506 11.8317 7.66699 12.2133 7.66699 12.6111V14.1666C7.66699 14.3419 7.69706 14.5103 7.75239 14.6667H5.16699C3.78628 14.6667 2.66699 13.5474 2.66699 12.1667V3.83333ZM5.33366 4.5C5.33366 4.22386 5.55752 4 5.83366 4H10.167C10.4431 4 10.667 4.22386 10.667 4.5C10.667 4.77614 10.4431 5 10.167 5H5.83366C5.55752 5 5.33366 4.77614 5.33366 4.5ZM5.83366 6.66667C5.55752 6.66667 5.33366 6.89053 5.33366 7.16667C5.33366 7.4428 5.55752 7.66667 5.83366 7.66667H7.50033C7.77646 7.66667 8.00033 7.4428 8.00033 7.16667C8.00033 6.89053 7.77646 6.66667 7.50033 6.66667H5.83366Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.869 10.4646C12.6347 10.2303 12.2549 10.2303 12.0205 10.4646L9.66699 12.8182V13.6666H10.5155L12.869 11.3131C13.1033 11.0788 13.1033 10.6989 12.869 10.4646ZM11.3135 9.75753C11.9383 9.13267 12.9513 9.13267 13.5761 9.75753C14.2009 10.3823 14.2009 11.3953 13.5761 12.0202L11.0761 14.5202C10.9823 14.6139 10.8551 14.6666 10.7225 14.6666H9.16699C8.89086 14.6666 8.66699 14.4427 8.66699 14.1666V12.6111C8.66699 12.4785 8.71966 12.3513 8.81346 12.2575L11.3135 9.75753Z"
            fill="currentColor"
          />
        </svg>
        Edit
      </ContextMenuItem>
      <ContextMenuItem onClick={onCopy}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.3787 2.66667H10.8337C12.2144 2.66667 13.3337 3.78595 13.3337 5.16667V12.1667C13.3337 13.5474 12.2144 14.6667 10.8337 14.6667H5.16699C3.78628 14.6667 2.66699 13.5474 2.66699 12.1667V5.16667C2.66699 3.78595 3.78628 2.66667 5.16699 2.66667H5.62201C6.04117 1.8737 6.87433 1.33333 7.83366 1.33333H8.16699C9.12633 1.33333 9.95946 1.8737 10.3787 2.66667ZM9.66699 3.83333C9.66699 3.00491 8.99539 2.33333 8.16699 2.33333H7.83366C7.00526 2.33333 6.33366 3.00491 6.33366 3.83333V4.16667C6.33366 4.25871 6.40828 4.33333 6.50033 4.33333H9.50033C9.59239 4.33333 9.66699 4.25871 9.66699 4.16667V3.83333Z"
            fill="currentColor"
          />
        </svg>
        Copy
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleToggleTagPin(tag.id, tag.is_pinned)}>
        {tag.is_pinned ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1.87621 1.18107C2.14427 0.928813 2.56657 0.941759 2.81892 1.20971L4.76553 3.27807L4.76619 3.27677L11.7212 10.6667H11.72L13.4856 12.5431C13.7379 12.8111 13.725 13.2334 13.4569 13.4857C13.1888 13.7381 12.7666 13.7252 12.5142 13.4571L9.88791 10.6667H8.66657V13.4213C8.66657 13.4729 8.6545 13.5242 8.63144 13.5704L8.14897 14.5353C8.08757 14.658 7.91224 14.658 7.85084 14.5353L7.36837 13.5704C7.3453 13.5241 7.33324 13.4729 7.33324 13.4213V10.6667H3.99991C3.29379 10.6666 2.60161 10.0711 2.71996 9.24093L2.76749 8.963C3.01556 7.7056 3.70633 6.61008 4.66657 5.83992L5.06175 5.53914L1.84757 2.12377C1.59541 1.85565 1.60817 1.43335 1.87621 1.18107Z"
                fill="currentColor"
              />
              <path
                d="M8.6665 1.3334C10.1391 1.33356 11.3331 2.52748 11.3332 4.00007V5.83991C12.3636 6.66634 13.0838 7.86746 13.2798 9.24092C13.3297 9.59106 13.2338 9.89852 13.0552 10.1381L5.47705 2.086C5.95713 1.62051 6.61172 1.33348 7.33317 1.3334H8.6665Z"
                fill="currentColor"
              />
            </svg>
            Unpin
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.83366 1.33334C5.45295 1.33334 4.33366 2.45262 4.33366 3.83334V4.66464C4.33366 5.81391 3.87711 6.91614 3.06446 7.72874L2.81344 7.9798C2.71967 8.07354 2.66699 8.20074 2.66699 8.33334V10.1667C2.66699 10.2993 2.71967 10.4265 2.81344 10.5202C2.90721 10.614 3.03439 10.6667 3.16699 10.6667H7.50033V14.1667C7.50033 14.4428 7.72419 14.6667 8.00033 14.6667C8.27646 14.6667 8.50033 14.4428 8.50033 14.1667V10.6667H12.8337C13.1098 10.6667 13.3337 10.4428 13.3337 10.1667V8.33334C13.3337 8.20074 13.281 8.07354 13.1872 7.9798L12.9362 7.72874C12.1235 6.91614 11.667 5.81391 11.667 4.66464V3.83334C11.667 2.45262 10.5477 1.33334 9.16699 1.33334H6.83366Z"
                fill="currentColor"
              />
            </svg>
            Pin
          </>
        )}
      </ContextMenuItem>
      <ContextMenuSeparator />

      <ContextMenuItem variant="destructive" onClick={onDelete}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.24601 3.33334H2.16699C1.89085 3.33334 1.66699 3.5572 1.66699 3.83334C1.66699 4.10948 1.89085 4.33334 2.16699 4.33334H2.66697C2.66699 4.34494 2.6674 4.35662 2.66822 4.36836L3.2281 12.3418C3.32005 13.6513 4.4092 14.6667 5.72196 14.6667H10.2787C11.5915 14.6667 12.6806 13.6513 12.7725 12.3418L13.3325 4.36836C13.3333 4.35662 13.3337 4.34494 13.3337 4.33334H13.8337C14.1098 4.33334 14.3337 4.10948 14.3337 3.83334C14.3337 3.5572 14.1098 3.33334 13.8337 3.33334H10.7547C10.4547 2.09005 9.33573 1.16667 8.00039 1.16667C6.66504 1.16667 5.54599 2.09005 5.24601 3.33334ZM6.29188 3.33334H9.70886C9.44219 2.65056 8.77752 2.16667 8.00039 2.16667C7.22319 2.16667 6.55853 2.65056 6.29188 3.33334ZM6.66699 6.50001C6.94313 6.50001 7.16699 6.72387 7.16699 7.00001V10.8333C7.16699 11.1095 6.94313 11.3333 6.66699 11.3333C6.39085 11.3333 6.16699 11.1095 6.16699 10.8333V7.00001C6.16699 6.72387 6.39085 6.50001 6.66699 6.50001ZM9.33366 6.50001C9.60979 6.50001 9.83366 6.72387 9.83366 7.00001V10.8333C9.83366 11.1095 9.60979 11.3333 9.33366 11.3333C9.05753 11.3333 8.83366 11.1095 8.83366 10.8333V7.00001C8.83366 6.72387 9.05753 6.50001 9.33366 6.50001Z"
            fill="currentColor"
          />
        </svg>
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );
}
