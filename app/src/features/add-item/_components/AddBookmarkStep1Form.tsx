"use client";

import {useId, useMemo, useRef, useState, type BaseSyntheticEvent, type ChangeEvent} from "react";
import {Controller, useFormContext, useWatch} from "react-hook-form";
import {SearchIcon} from "lucide-react";
import TagsInput from "@/components/ui/app/tags-input";
import {Input} from "@/components/ui/coss/input";
import {Label} from "@/components/ui/coss/label";
import {Textarea} from "@/components/ui/coss/textarea";
import {Toggle} from "@/components/ui/coss/toggle";
import {extractUrls} from "../_utils/extract-urls";
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
import {BOOKMARK_TYPES} from "../add-bookmark-constants";
import type {AddBookmarkFormValues} from "../add-bookmark-schema";

type CollectionOption = {label: string; value: string};

type AddBookmarkStep1FormProps = {
  collectionItems: CollectionOption[];
  tagNames: string[];
  userAiContext: string | null;
  onValidSubmit: (e?: BaseSyntheticEvent) => Promise<void>;
};

export function AddBookmarkStep1Form({
  collectionItems,
  tagNames,
  userAiContext,
  onValidSubmit,
}: AddBookmarkStep1FormProps) {
  const [isBulk, setIsBulk] = useState(false);
  const bulkTextRef = useRef<string>("");
  const isUserDisabledBulkRef = useRef<boolean>(false);
  const urlHelpId = useId();

  const {
    register,
    control,
    trigger,
    setValue,
    clearErrors,
    formState: {errors},
  } = useFormContext<AddBookmarkFormValues>();
  const watchedUrl = useWatch({control, name: "url"});
  const watchedType = useWatch({control, name: "type"});

  const detectedUrls = useMemo(() => extractUrls(watchedUrl ?? ""), [watchedUrl]);
  const sourceUrl = isBulk ? (detectedUrls[0] ?? "") : (watchedUrl ?? "");
  const urlField = register("url");

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    void urlField.onChange(event);

    const nextUrls = extractUrls(event.target.value);
    if (nextUrls.length > 1 && !isBulk && !isUserDisabledBulkRef.current) {
      setIsBulk(true);
      const formatted = nextUrls.join("\n");
      bulkTextRef.current = formatted;
      if (event.target.value !== formatted) {
        setValue("url", formatted, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    }
  };

  const handleToggleBulk = (nextBulk: boolean) => {
    if (!nextBulk) {
      isUserDisabledBulkRef.current = true;
      bulkTextRef.current = watchedUrl ?? "";
      const firstUrl =
        detectedUrls[0] ??
        (watchedUrl ?? "")
          .split(/[\r\n]+/)
          .map((line) => line.trim())
          .find(Boolean) ??
        "";
      if (!firstUrl) {
        clearErrors("url");
      }
      setValue("url", firstUrl, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: Boolean(firstUrl),
      });
      setIsBulk(false);
    } else {
      isUserDisabledBulkRef.current = false;
      setIsBulk(true);
      const restoredText =
        bulkTextRef.current ||
        (detectedUrls.length > 0 ? detectedUrls.join("\n") : (watchedUrl ?? ""));
      if (!restoredText) {
        clearErrors("url");
      }
      setValue("url", restoredText, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: Boolean(restoredText),
      });
    }
  };

  return (
    <DialogPanel>
      <form
        id="add-item-form"
        className="flex flex-col gap-5"
        data-rybbit-event=""
        onSubmit={onValidSubmit}
        noValidate>
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between">
            <Label htmlFor="url" className="flex items-center gap-1">
              {isBulk ? (
                <>
                  URLs
                  <span className="text-muted-foreground font-medium">{detectedUrls.length}</span>
                </>
              ) : (
                "URL"
              )}
            </Label>
            {/*<Label htmlFor={inputId} className={cn("flex items-center gap-1", labelClassName)}>
              {label} <span className="text-muted-foreground font-medium">(max {maxTags})</span>
              <InfoIcon />
            </Label>*/}
            <Toggle
              size="sm"
              pressed={isBulk}
              aria-label={isBulk ? "Switch to single URL mode" : "Switch to bulk URL mode"}
              onPressedChange={handleToggleBulk}
              className="text-muted-foreground data-pressed:text-foreground -mb-1 rounded-md">
              Bulk
            </Toggle>
          </div>
          {isBulk ? (
            <Textarea
              id="url"
              placeholder={`https://example.com`}
              data-rybbit-event=""
              aria-describedby={urlHelpId}
              autoFocus
              className="[&_textarea]:max-h-56 [&_textarea]:min-h-13 [&_textarea]:overflow-y-auto [&_textarea]:max-sm:min-h-14"
              {...urlField}
              onChange={handleUrlChange}
              error={errors.url?.message}
            />
          ) : (
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              data-rybbit-event=""
              aria-describedby={urlHelpId}
              autoFocus
              {...urlField}
              onChange={handleUrlChange}
              error={errors.url?.message}
            />
          )}
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
                    {BOOKMARK_TYPES.find((t) => t.value === field.value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup alignItemWithTrigger={false}>
                  {BOOKMARK_TYPES.map((type) => (
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
              sourceUrl={sourceUrl}
              itemType={watchedType}
            />
          )}
        />
      </form>
    </DialogPanel>
  );
}
