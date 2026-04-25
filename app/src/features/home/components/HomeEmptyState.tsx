"use client";

import {Button} from "@/components/ui/coss/button";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {useAddItemDialogStore} from "@/store/use-add-item-dialog";

export function HomeEmptyState({userId}: {userId: string | null}) {
  const router = useRouter();
  const openDialog = useAddItemDialogStore((state) => state.openDialog);

  const handleAddBookmark = () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    openDialog();
  };

  return (
    <div className="mx-auto flex min-h-0 max-w-[310px] flex-1 items-center justify-center px-6 py-10">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-1.5 h-[67.5px] w-[45px]">
          <Image
            src="/icons/bookmark.webp"
            alt="No bookmarks yet"
            width={45}
            height={45}
            unoptimized
          />
        </div>
        <h2 className="text-foreground text-xl font-medium tracking-tight">No bookmarks yet</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Add your first bookmark to start building your collection
        </p>
        <Button className="mt-5" onClick={handleAddBookmark} variant="default">
          Add bookmark
        </Button>
      </div>
    </div>
  );
}
