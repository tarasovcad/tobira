"use client";

import type {BaseSyntheticEvent} from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormTrigger,
} from "react-hook-form";
import {SearchIcon} from "lucide-react";
import TagsInput from "@/components/ui/app/tags-input";
import {Input} from "@/components/ui/coss/input";
import {Label} from "@/components/ui/coss/label";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/coss/combobox";
import {
  SelectButton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/coss/select";
import {DialogPanel} from "@/components/ui/coss/dialog";
import {ITEM_TYPES} from "../add-item-constants";
import type {AddItemFormValues} from "../add-item-schema";

type CollectionOption = {label: string; value: string};

type AddItemStep1FormProps = {
  register: UseFormRegister<AddItemFormValues>;
  control: Control<AddItemFormValues>;
  errors: FieldErrors<AddItemFormValues>;
  trigger: UseFormTrigger<AddItemFormValues>;
  collectionItems: CollectionOption[];
  tagNames: string[];
  userAiContext: string | null;
  watchedUrl: string;
  watchedType: AddItemFormValues["type"];
  onValidSubmit: (e?: BaseSyntheticEvent) => Promise<void>;
};

export function AddItemStep1Form({
  register,
  control,
  errors,
  trigger,
  collectionItems,
  tagNames,
  userAiContext,
  watchedUrl,
  watchedType,
  onValidSubmit,
}: AddItemStep1FormProps) {
  return (
    <DialogPanel>
      <form id="add-item-form" className="flex flex-col gap-5" onSubmit={onValidSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://example.com"
            {...register("url")}
            error={errors.url?.message}
          />
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
                  <ComboboxPopup aria-label="Select a collection" className="w-(--anchor-width)">
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
              label="Tags"
              sortOnAdd={false}
              availableTags={tagNames}
              userTags={tagNames}
              userAiContext={userAiContext}
              sourceUrl={watchedUrl}
              itemType={watchedType}
            />
          )}
        />
      </form>
    </DialogPanel>
  );
}
