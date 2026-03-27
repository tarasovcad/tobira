"use client";

import NumberFlow from "@number-flow/react";
import {Button} from "@/components/coss-ui/button";
import type {Collection} from "@/app/actions/collections";
import {useCollectionDialogStore} from "@/store/use-collection-dialog-store";
import {useDeleteCollectionDialogStore} from "@/store/use-delete-collection-dialog-store";

interface CollectionHeaderProps {
  activeCollection: Collection;
  currentTotalCount: number;
}

export function CollectionHeader({activeCollection, currentTotalCount}: CollectionHeaderProps) {
  const openDialog = useCollectionDialogStore((state) => state.openDialog);
  const openDeleteDialog = useDeleteCollectionDialogStore((state) => state.openDialog);

  return (
    <div className="border-b px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{activeCollection.name}</h1>
          {activeCollection.description && (
            <p className="text-muted-foreground text-lg">{activeCollection.description}</p>
          )}
          <div className="text-muted-foreground flex items-center gap-4 pt-2 text-sm">
            <span>
              Items: <NumberFlow value={currentTotalCount} />
            </span>

            <span>
              Last updated:{" "}
              {new Date(activeCollection.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => openDialog(activeCollection)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9.69543 2.36216C10.7842 1.27338 12.5494 1.27338 13.6382 2.36216C14.727 3.45094 14.727 5.21619 13.6382 6.30497L5.66683 14.2764C5.41678 14.5264 5.07764 14.6669 4.72402 14.6669H2.00016C1.63198 14.6669 1.3335 14.3684 1.3335 14.0002V11.2764C1.3335 10.9227 1.47397 10.5836 1.72402 10.3335L8.0575 4.00012L12.0002 7.9428L12.943 7L9.0003 3.05731L9.69543 2.36216Z"
                fill="currentColor"
              />
            </svg>
            Edit
          </Button>
          <Button
            variant="destructive-outline"
            onClick={() =>
              openDeleteDialog([{id: activeCollection.id, name: activeCollection.name}])
            }>
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
          </Button>
        </div>
      </div>
    </div>
  );
}
