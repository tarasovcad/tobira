"use client";
import Spinner from "@/components/ui/app/spinner";
import {Button} from "@/components/ui/coss/button";
import {Button as ShadcnButton} from "@/components/ui/legacy-shadcn/button";
import {parseAsStringLiteral, useQueryState} from "nuqs";
import {FormProvider} from "react-hook-form";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/coss/dialog";
import {User as AuthUser} from "@/lib/auth/auth-client";
import {cn} from "@/lib/utils";
import {AddBookmarkStep2MediaGrid} from "./_components/AddBookmarkStep2MediaGrid";
import {useAddBookmarkFlow} from "./_hooks/use-add-bookmark-flow";
import {AddBookmarkStep1Form} from "./_components/AddBookmarkStep1Form";

const typeParamParser = parseAsStringLiteral(["website", "media", "post"] as const);

export type AddBookmarkDialogUser = AuthUser & {
  aiContext?: string | null;
  enableAiOptimization?: boolean;
};

export function AddBookmarkDialog({
  isAuthenticated = false,
  user,
  defaultCollectionId,
  defaultTagNames,
}: {
  isAuthenticated?: boolean;
  user?: AddBookmarkDialogUser | null;
  defaultCollectionId?: string | null;
  defaultTagNames?: string[];
}) {
  const [typeParam] = useQueryState("type", typeParamParser);
  const userId = user?.id;
  const userAiContext = user?.enableAiOptimization ? user?.aiContext : null;
  const defaultType = typeParam ?? "website";

  const {
    open,
    step,
    mediaItems,
    selectedMediaUrls,
    toggleMediaUrl,
    form,
    addItemMutation,
    collectionItems,
    tags,
    handleOpenChange,
    handleOpenDialogClick,
    handleSubmitForm,
    confirmMediaSelection,
  } = useAddBookmarkFlow({
    userId,
    isAuthenticated,
    defaultType,
    defaultCollectionId,
    defaultTagNames,
  });

  const tagNames = tags.map((t) => t.name);

  return (
    <div className="absolute right-6 bottom-6">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <ShadcnButton
          variant="default"
          size="icon-lg"
          className="relative z-40 size-12 rounded-full hover:bg-[#454545] dark:bg-white dark:hover:bg-[#D0D0D0]"
          onClick={handleOpenDialogClick}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 1C10.4142 1 10.75 1.33579 10.75 1.75V9.25H18.25C18.6642 9.25 19 9.5858 19 10C19 10.4142 18.6642 10.75 18.25 10.75H10.75V18.25C10.75 18.6642 10.4142 19 10 19C9.5858 19 9.25 18.6642 9.25 18.25V10.75H1.75C1.33579 10.75 1 10.4142 1 10C1 9.5858 1.33579 9.25 1.75 9.25H9.25V1.75C9.25 1.33579 9.5858 1 10 1Z"
              fill="currentColor"
            />
          </svg>
        </ShadcnButton>

        <DialogPopup
          className={cn(
            "overflow-hidden transition-[max-width,height,scale,opacity,translate] duration-250 ease-in-out [interpolate-size:allow-keywords] data-ending-style:translate-y-2 data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:scale-98 data-starting-style:opacity-0 motion-reduce:transition-none",
            step === 2 && mediaItems.length > 2 && "max-w-2xl",
          )}>
          <DialogHeader>
            <DialogTitle>{step === 1 ? "Add Bookmark" : "Select Media"}</DialogTitle>
          </DialogHeader>

          <FormProvider {...form}>
            {step === 1 ? (
              <div key="step1">
                <AddBookmarkStep1Form
                  collectionItems={collectionItems}
                  tagNames={tagNames}
                  userAiContext={userAiContext ?? null}
                  onValidSubmit={handleSubmitForm}
                />
              </div>
            ) : (
              <div key="step2">
                <AddBookmarkStep2MediaGrid
                  mediaItems={mediaItems}
                  selectedMediaUrls={selectedMediaUrls}
                  onToggleMediaUrl={toggleMediaUrl}
                />
              </div>
            )}

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
              {step === 1 ? (
                <Button
                  type="submit"
                  form="add-item-form"
                  disabled={addItemMutation.isPending || !form.formState.isValid}>
                  {addItemMutation.isPending ? (
                    <Spinner className="mx-auto size-4 animate-spin" />
                  ) : null}
                  Submit
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={selectedMediaUrls.length === 0 || addItemMutation.isPending}
                  onClick={confirmMediaSelection}>
                  {addItemMutation.isPending ? (
                    <Spinner className="mx-auto size-4 animate-spin" />
                  ) : null}
                  Confirm
                </Button>
              )}
            </DialogFooter>
          </FormProvider>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
