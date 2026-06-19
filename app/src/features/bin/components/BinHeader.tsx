"use client";

import {useState} from "react";
import {SlotTextWithFallback} from "@/components/ui/SlotTextWithFallback";
import Spinner from "@/components/ui/app/spinner";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/coss/alert-dialog";
import {Button} from "@/components/ui/coss/button";
import {cn} from "@/lib/utils";

export type BinHeaderStats = {
  all: number;
  websites: number;
  media: number;
  posts: number;
};

const STAT_ITEMS = [
  {key: "all", label: "All"},
  {key: "websites", label: "Websites"},
  {key: "media", label: "Media"},
  {key: "posts", label: "Posts"},
] as const;

export function BinHeader({
  stats,
  emptyBinPending = false,
  onEmptyBin,
}: {
  stats: BinHeaderStats;
  emptyBinPending?: boolean;
  onEmptyBin: () => void;
}) {
  return (
    <div className="border-b px-6 py-8">
      <HeaderRow stats={stats} emptyBinPending={emptyBinPending} onEmptyBin={onEmptyBin} />
      <CompactStatsRow stats={stats} className="mt-2" />
    </div>
  );
}

function HeaderRow({
  stats,
  emptyBinPending,
  onEmptyBin,
  className,
}: {
  stats: BinHeaderStats;
  emptyBinPending: boolean;
  onEmptyBin: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-foreground text-[22px] font-[550]">Bin</h1>
        <p className="text-muted-foreground text-sm">/</p>
        <p className="text-muted-foreground text-sm">
          Deleted bookmarks you can restore or permanently remove.
        </p>
      </div>
      <EmptyBinButton count={stats.all} pending={emptyBinPending} onConfirm={onEmptyBin} />
    </div>
  );
}

function EmptyBinButton({
  count,
  pending,
  onConfirm,
}: {
  count: number;
  pending: boolean;
  onConfirm: () => void;
}) {
  const disabled = count === 0 || pending;
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="destructive-outline"
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}>
        {pending ? <Spinner className="size-4 animate-spin" /> : <TrashIcon />}
        Empty bin
      </Button>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Empty bin?</AlertDialogTitle>
          <AlertDialogDescription>
            {count === 1
              ? "This permanently deletes 1 bookmark from your bin and cannot be undone."
              : `This permanently deletes ${count} bookmarks from your bin and cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <AlertDialogClose
            render={<Button variant="destructive" disabled={pending} onClick={onConfirm} />}>
            Empty bin
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.24601 3.33334H2.16699C1.89085 3.33334 1.66699 3.5572 1.66699 3.83334C1.66699 4.10948 1.89085 4.33334 2.16699 4.33334H2.66697C2.66699 4.34494 2.6674 4.35662 2.66822 4.36836L3.2281 12.3418C3.32005 13.6513 4.4092 14.6667 5.72196 14.6667H10.2787C11.5915 14.6667 12.6806 13.6513 12.7725 12.3418L13.3325 4.36836C13.3333 4.35662 13.3337 4.34494 13.3337 4.33334H13.8337C14.1098 4.33334 14.3337 4.10948 14.3337 3.83334C14.3337 3.5572 14.1098 3.33334 13.8337 3.33334H10.7547C10.4547 2.09005 9.33573 1.16667 8.00039 1.16667C6.66504 1.16667 5.54599 2.09005 5.24601 3.33334ZM6.29188 3.33334H9.70886C9.44219 2.65056 8.77752 2.16667 8.00039 2.16667C7.22319 2.16667 6.55853 2.65056 6.29188 3.33334ZM6.66699 6.50001C6.94313 6.50001 7.16699 6.72387 7.16699 7.00001V10.8333C7.16699 11.1095 6.94313 11.3333 6.66699 11.3333C6.39085 11.3333 6.16699 11.1095 6.16699 10.8333V7.00001C6.16699 6.72387 6.39085 6.50001 6.66699 6.50001ZM9.33366 6.50001C9.60979 6.50001 9.83366 6.72387 9.83366 7.00001V10.8333C9.83366 11.1095 9.60979 11.3333 9.33366 11.3333C9.05753 11.3333 8.83366 11.1095 8.83366 10.8333V7.00001C8.83366 6.72387 9.05753 6.50001 9.33366 6.50001Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CompactStatsRow({stats, className}: {stats: BinHeaderStats; className?: string}) {
  return (
    <div
      className={cn(
        "border-border flex flex-wrap items-center gap-x-4 gap-y-3 border-t pt-4 xl:border-t-0 xl:pt-0",
        className,
      )}>
      {STAT_ITEMS.map((item, index) => (
        <div key={item.key} className="contents">
          {index > 0 && <div className="bg-border h-5 w-px" aria-hidden />}
          <CompactStat label={item.label} value={String(stats[item.key])} />
        </div>
      ))}
    </div>
  );
}

function CompactStat({label, value}: {label: string; value: string}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-muted-foreground text-[12px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground font-mono text-sm font-medium">
        <SlotTextWithFallback text={value} />
      </span>
    </div>
  );
}
