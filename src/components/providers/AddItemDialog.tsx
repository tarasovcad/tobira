"use client";

import React, {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useForm, Controller} from "react-hook-form";
import {AnimatePresence, motion} from "framer-motion";
import {zodResolver} from "@hookform/resolvers/zod";
import Image from "next/image";
import {useRouter} from "next/navigation";
import {cn} from "@/lib/utils";
import Spinner from "@/components/ui/spinner";
import {Button} from "@/components/coss-ui/button";
import {Button as ShadcnButton} from "@/components/shadcn/button";
import {Input} from "@/components/coss-ui/input";
import {toastManager} from "@/components/coss-ui/toast";
import {SearchIcon} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/coss-ui/dialog";
import {
  addWebsiteBookmark,
  addMediaBookmark,
  type AddWebsiteBookmarkResult,
  type AddMediaBookmarkResult,
} from "@/app/actions/bookmarks";
import TagsInput from "../ui/TagsInput";
import {Label} from "../coss-ui/label";
import type {Collection} from "@/app/actions/collections";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/coss-ui/combobox";
import {
  SelectButton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/coss-ui/select";

import {ITEM_TYPES} from "./constants";

import {addItemSchema, type AddItemFormValues} from "./addItemSchema";
import {useAddItemDialogStore} from "@/store/use-add-item-dialog";

export function AddItemDialog({
  collections = [],
  isAuthenticated = false,
}: {
  collections?: Collection[];
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const open = useAddItemDialogStore((state) => state.isOpen);
  const setDialogOpen = useAddItemDialogStore((state) => state.setDialogOpen);
  const closeDialog = useAddItemDialogStore((state) => state.closeDialog);
  const [step, setStep] = useState<1 | 2>(1);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedMediaUrls, setSelectedMediaUrls] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    trigger,
    formState: {errors, isValid},
    watch,
  } = useForm<AddItemFormValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      url: "",
      tags: [],
      collectionId: null,
      type: "website",
    },
    mode: "onChange",
  });

  const addItemMutation = useMutation<
    AddWebsiteBookmarkResult | AddMediaBookmarkResult,
    Error,
    | {url: string; tags: string[]; collectionId?: string; kind: "website"}
    | {
        url: string;
        tags: string[];
        collectionId?: string;
        kind: "media";
        selectedMediaUrls?: string[];
      }
  >({
    mutationKey: ["add-bookmark"],
    mutationFn: async (input) => {
      if (input.kind === "website") {
        return await addWebsiteBookmark(input);
      } else if (input.kind === "media") {
        return await addMediaBookmark(input);
      }
      throw new Error("Invalid kind");
    },
    onSuccess: (res, variables) => {
      if (
        variables.kind === "media" &&
        "media" in res &&
        Array.isArray(res.media) &&
        res.media.length > 1 &&
        !("selectedMediaUrls" in variables && variables.selectedMediaUrls)
      ) {
        setMediaUrls(res.media);
        setSelectedMediaUrls(res.media);
        setStep(2);
        return;
      }

      closeDialog();
      toastManager.add({
        title: "Bookmark added",
        type: "success",
      });
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
      queryClient.invalidateQueries({queryKey: ["tags"]});
      setTimeout(() => {
        reset();
        setStep(1);
        setMediaUrls([]);
        setSelectedMediaUrls([]);
      }, 500);
    },
    onError: (err) => {
      toastManager.add({
        title: "Submit failed",
        description:
          (err instanceof Error ? err.message : "Unknown error")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 160) || "Unknown error",
        type: "error",
      });
    },
  });

  const onSubmit = (data: AddItemFormValues) => {
    switch (data.type) {
      case "website":
        addItemMutation.mutate({
          url: data.url,
          tags: data.tags,
          collectionId: data.collectionId ?? undefined,
          kind: "website",
        });
        closeDialog();
        break;
      case "media":
        addItemMutation.mutate({
          url: data.url,
          tags: data.tags,
          collectionId: data.collectionId ?? undefined,
          kind: "media",
        });
        break;
      // case "article":
      //   addItemMutation.mutate({
      //     url: data.url,
      //     tags: data.tags,
      //     collectionId: data.collectionId ?? undefined,
      //     kind: data.type,
      //   });
      //   break;
      default:
        throw new Error("Invalid item type");
    }
  };

  const collectionItems = React.useMemo(
    () =>
      collections.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    [collections],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !isAuthenticated) {
      closeDialog();
      router.push("/login");
      return;
    }

    setDialogOpen(nextOpen);
    if (!nextOpen) {
      setTimeout(() => {
        reset();
        setStep(1);
        setMediaUrls([]);
        setSelectedMediaUrls([]);
      }, 500);
    }
  };

  const handleOpenDialogClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setDialogOpen(true);
  };

  return (
    <div className="absolute right-6 bottom-6">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <ShadcnButton
          variant="default"
          size="icon-lg"
          className="relative z-100 size-12 rounded-full"
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

        <DialogPopup className="duration-250 ease-in-out data-ending-style:translate-y-2 data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:scale-98 data-starting-style:opacity-0">
          <DialogHeader>
            <DialogTitle>{step === 1 ? "Add item" : "Select Media"}</DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait" initial={false}>
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{opacity: 0, x: -20}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: -20}}
                transition={{duration: 0.2}}>
                <DialogPanel>
                  <form
                    id="add-item-form"
                    className="flex flex-col gap-5"
                    onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com"
                        {...register("url")}
                        aria-invalid={!!errors.url}
                      />
                      {errors.url ? (
                        <div
                          className="text-destructive flex items-center gap-1.5 text-sm"
                          role="alert">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M7.99967 1.33333C11.6815 1.33333 14.6663 4.31809 14.6663 7.99999C14.6663 11.6819 11.6815 14.6667 7.99967 14.6667C4.31777 14.6667 1.33301 11.6819 1.33301 7.99999C1.33301 4.31809 4.31777 1.33333 7.99967 1.33333ZM7.99967 9.73306C7.55787 9.73306 7.19954 10.0914 7.19954 10.5332C7.19961 10.9749 7.55787 11.3333 7.99967 11.3333C8.44147 11.3333 8.79974 10.975 8.79981 10.5332C8.79981 10.0914 8.44147 9.73306 7.99967 9.73306ZM7.99967 4.66666C7.46867 4.66667 7.05821 5.13198 7.12401 5.65885L7.43781 8.17059C7.47327 8.45399 7.71407 8.66666 7.99967 8.66666C8.28527 8.66666 8.52607 8.45399 8.56154 8.17059L8.87601 5.65885C8.94174 5.13201 8.53061 4.66666 7.99967 4.66666Z"
                              fill="currentColor"
                            />
                          </svg>
                          {errors.url.message}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Type</Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({field}) => (
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              trigger("url");
                            }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type">
                                {ITEM_TYPES.find((t) => t.value === field.value)?.label}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectPopup alignItemWithTrigger={false}>
                              {ITEM_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectPopup>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Collection</Label>
                      <Controller
                        name="collectionId"
                        control={control}
                        render={({field}) => {
                          const selectedItem =
                            collectionItems.find((item) => item.value === field.value) ?? null;

                          return (
                            <Combobox
                              items={collectionItems}
                              value={selectedItem}
                              onValueChange={(val) => {
                                field.onChange(val?.value ?? null);
                              }}>
                              <Select>
                                <ComboboxTrigger render={<SelectButton />}>
                                  <ComboboxValue placeholder="Select a collection" />
                                </ComboboxTrigger>
                              </Select>
                              <ComboboxPopup
                                aria-label="Select a collection"
                                className="w-(--anchor-width)">
                                <div className="border-b p-2">
                                  <ComboboxInput
                                    className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
                                    placeholder="Search collections..."
                                    showTrigger={false}
                                    startAddon={<SearchIcon className="size-4" />}
                                  />
                                </div>
                                <ComboboxEmpty>No collections found.</ComboboxEmpty>
                                <ComboboxList>
                                  {(item) => (
                                    <ComboboxItem key={item.value} value={item}>
                                      {item.label}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxPopup>
                            </Combobox>
                          );
                        }}
                      />
                    </div>

                    <Controller
                      name="tags"
                      control={control}
                      render={({field}) => (
                        <TagsInput
                          value={field.value}
                          onValueChange={field.onChange}
                          name="tags"
                          sortOnAdd={false}
                        />
                      )}
                    />
                  </form>
                </DialogPanel>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{opacity: 0, x: 20}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: 20}}
                transition={{duration: 0.2}}
                className="grid grid-cols-2 gap-4 px-6 pt-4 pb-6">
                {mediaUrls.map((url, i) => {
                  const isSelected = selectedMediaUrls.includes(url);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedMediaUrls((prev) =>
                          prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
                        );
                      }}
                      className={cn(
                        "group/preview border-border relative cursor-pointer overflow-hidden rounded-lg border transition-all duration-200",
                        isSelected
                          ? "border-primary"
                          : "border-transparent opacity-50 hover:opacity-75",
                      )}>
                      <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-md">
                        <Image
                          src={url}
                          alt={`Media ${i}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            {step === 1 ? (
              <Button
                type="submit"
                form="add-item-form"
                disabled={addItemMutation.isPending || !isValid}>
                {addItemMutation.isPending && <Spinner className="mx-auto size-4 animate-spin" />}
                Submit
              </Button>
            ) : (
              <Button
                type="button"
                disabled={selectedMediaUrls.length === 0 || addItemMutation.isPending}
                onClick={() => {
                  const data = watch();
                  addItemMutation.mutate({
                    url: data.url,
                    tags: data.tags,
                    collectionId: data.collectionId ?? undefined,
                    kind: "media",
                    selectedMediaUrls,
                  });
                  closeDialog();
                }}>
                {addItemMutation.isPending && <Spinner className="mx-auto size-4 animate-spin" />}
                Confirm
              </Button>
            )}
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
