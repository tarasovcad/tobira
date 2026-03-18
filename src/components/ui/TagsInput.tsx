"use client";

import {useCallback, useId, useMemo, useRef, useState} from "react";
import type {ClipboardEvent, CSSProperties, KeyboardEvent} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/coss-ui/input-group";
import {Button} from "@/components/coss-ui/button";
import {Badge} from "@/components/coss-ui/badge";
import {Skeleton} from "@/components/coss-ui/skeleton";
import {useMutation} from "@tanstack/react-query";
import {generateAiSuggestions as generateAiSuggestionsAction} from "@/app/actions/tags";
import {Tooltip, TooltipTrigger, TooltipPopup} from "@/components/coss-ui/tooltip";
import {cn} from "@/lib/utils";
import {Label} from "../coss-ui/label";
export type TagsInputProps = {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  maxTags?: number;
  /** Max characters per tag after normalization (trim + collapse spaces). */
  maxTagLength?: number;
  /** If true, keeps tags sorted A→Z whenever a tag is added. */
  sortOnAdd?: boolean;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  /** If provided, a hidden input will be rendered (comma-separated). */
  name?: string;
  labelClassName?: string;
  containerClassName?: string;
};

const DEFAULT_MAX_TAGS = 10;
const DEFAULT_MAX_TAG_LENGTH = 64;

type Tag = string;

const FAKE_SUGGESTIONS = ["banana", "apple", "appear", "hello world"] as const;

function sortTagsAZ(input: Tag[]) {
  return [...input].sort(
    (a, b) =>
      a.localeCompare(b, undefined, {sensitivity: "base"}) ||
      a.localeCompare(b, undefined, {sensitivity: "variant"}),
  );
}

function clampString(input: string, maxLen: number) {
  return input.length > maxLen ? input.slice(0, maxLen) : input;
}

function normalizeTag(raw: string, maxTagLength: number): Tag {
  // Allow multi-word tags. Users can type/paste commas or newlines; we strip those defensively here.
  const normalized = raw
    .replace(/[,|\n|\r]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  return clampString(normalized, maxTagLength);
}

function splitRawTags(raw: string, maxTagLength: number): Tag[] {
  // Split on commas/newlines; keep it intentionally simple and predictable.
  return raw
    .split(/[,|\n|\r]/g)
    .map((t) => normalizeTag(t, maxTagLength))
    .filter(Boolean);
}

function buildInlineSuggestion({
  inputValue,
  tags,
}: {
  inputValue: string;
  tags: Tag[];
}): string | null {
  // Suggest based on the *typed* prefix (including spaces).
  // Example: "hello " suggests "hello world" (suffix "world"), but "hel " suggests nothing.
  const q = inputValue.toLowerCase();
  if (!q.trim()) return null;

  const match = FAKE_SUGGESTIONS.find((w) => w.startsWith(q));
  if (!match) return null;
  if (match.toLowerCase() === q) return null;

  const existing = new Set(tags.map((t) => t.toLowerCase()));
  if (existing.has(match.toLowerCase())) return null;
  return match;
}

function useControllableTags({
  value,
  defaultValue,
  onValueChange,
}: Pick<TagsInputProps, "value" | "defaultValue" | "onValueChange">) {
  const isControlled = value !== undefined;
  const [uncontrolledTags, setUncontrolledTags] = useState<Tag[]>(defaultValue ?? []);
  const tags = (isControlled ? value : uncontrolledTags) ?? [];

  const setTags = useCallback(
    (next: Tag[]) => {
      if (!isControlled) setUncontrolledTags(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  return {tags, setTags};
}

const TagsInput = ({
  value,
  defaultValue = [],
  onValueChange,
  maxTags = DEFAULT_MAX_TAGS,
  maxTagLength = DEFAULT_MAX_TAG_LENGTH,
  sortOnAdd = true,
  placeholder = "Add tags...",
  label = "Add Tags",
  disabled = false,
  name,
  labelClassName,
  containerClassName,
}: TagsInputProps) => {
  const {tags, setTags} = useControllableTags({value, defaultValue, onValueChange});

  const [inputValue, setInputValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const helpId = useId();

  // this
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [aiSuggestions, setAiSuggestions] = useState<Tag[]>([]);

  const suggestion = useMemo(() => buildInlineSuggestion({inputValue, tags}), [inputValue, tags]);
  const canAddMore = tags.length < maxTags;

  const maybeSort = useCallback(
    (next: Tag[]) => (sortOnAdd ? sortTagsAZ(next) : next),
    [sortOnAdd],
  );

  const commitRawInput = useCallback(
    (raw: string) => {
      const parts = splitRawTags(raw, maxTagLength);
      if (parts.length === 0) return;
      if (!canAddMore) return;

      const existing = new Set(tags.map((t) => t.toLowerCase()));
      const toAdd: Tag[] = [];
      let sawDuplicate = false;
      for (const t of parts) {
        const key = t.toLowerCase();
        if (existing.has(key)) {
          sawDuplicate = true;
          continue;
        }
        toAdd.push(t);
        existing.add(key);
        if (tags.length + toAdd.length >= maxTags) break;
      }

      if (toAdd.length === 0) {
        // If user tried to add a duplicate (e.g. "ascii" vs "AScii"),
        // treat it as a no-op submit but clear the input.
        if (sawDuplicate) {
          setInputValue("");
          inputRef.current?.focus();
        }
        return;
      }
      setTags(maybeSort([...tags, ...toAdd]));
      setInputValue("");

      // Keep typing flow smooth.
      inputRef.current?.focus();
    },
    [canAddMore, maxTagLength, maxTags, maybeSort, setTags, tags],
  );

  const removeTagAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= tags.length) return;
      const next = tags.slice(0, index).concat(tags.slice(index + 1));
      setTags(next);
      inputRef.current?.focus();
    },
    [setTags, tags],
  );

  const ghostVisible = !disabled && Boolean(suggestion) && inputValue.trim().length > 0;
  const normalizedForSubmit = normalizeTag(inputValue, maxTagLength);
  const canSubmit = !disabled && canAddMore && normalizedForSubmit.length > 0;

  const acceptSuggestion = useCallback(() => {
    if (!suggestion) return;
    const next = suggestion;
    setInputValue(next);
    // Ensure caret lands at the end after state update.
    requestAnimationFrame(() => inputRef.current?.setSelectionRange(next.length, next.length));
  }, [suggestion]);

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      // Allow accepting the "ghost" suggestion with Tab / ArrowRight when the caret is at the end.
      if (
        ghostVisible &&
        (e.key === "Tab" || e.key === "ArrowRight") &&
        e.currentTarget.selectionStart === inputValue.length &&
        e.currentTarget.selectionEnd === inputValue.length
      ) {
        e.preventDefault();
        acceptSuggestion();
        return;
      }

      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        commitRawInput(inputValue);
        return;
      }

      if (e.key === "Backspace" && inputValue.length === 0 && tags.length > 0) {
        e.preventDefault();
        removeTagAt(tags.length - 1);
      }
    },
    [
      acceptSuggestion,
      commitRawInput,
      disabled,
      ghostVisible,
      inputValue,
      removeTagAt,
      tags.length,
    ],
  );

  const onInputPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      const text = e.clipboardData?.getData("text");
      if (!text) return;
      if (!/[,\n\r]/.test(text)) return;
      e.preventDefault();
      commitRawInput(text);
    },
    [commitRawInput, disabled],
  );

  // below

  const aiPanelOpen = aiStatus !== "idle";
  const aiMutation = useMutation({
    mutationKey: ["generate-tag-suggestions"],
    mutationFn: async () => {
      return generateAiSuggestionsAction();
    },
    onMutate: () => {
      setAiStatus("loading");
      setAiSuggestions([]);
    },
    onSuccess: (data) => {
      setAiSuggestions(data.suggestions ?? []);
      setAiStatus("ready");
    },
    onError: (error) => {
      console.error("Failed to generate tag suggestions:", error);
      setAiSuggestions([]);
      setAiStatus("ready");
    },
  });

  const aiCanGenerate = !disabled && canAddMore && !aiMutation.isPending;

  const dismissAi = useCallback(() => {
    setAiStatus("idle");
    setAiSuggestions([]);
    aiMutation.reset();
  }, [aiMutation]);

  const addNormalizedTag = useCallback(
    (raw: string) => {
      const next = normalizeTag(raw, maxTagLength);
      if (!next) return false;
      if (!canAddMore) return false;
      const exists = new Set(tags.map((t) => t.toLowerCase()));
      if (exists.has(next.toLowerCase())) return false;
      setTags(maybeSort([...tags, next]));
      return true;
    },
    [canAddMore, maxTagLength, maybeSort, setTags, tags],
  );

  const addAiSuggestion = useCallback(
    (raw: string) => {
      const added = addNormalizedTag(raw);
      if (!added) return;
      setAiSuggestions((prev) => prev.filter((t) => t.toLowerCase() !== raw.toLowerCase()));
      inputRef.current?.focus();
    },
    [addNormalizedTag],
  );

  const addAllAiSuggestions = useCallback(() => {
    if (disabled) return;
    if (!canAddMore) return;

    const existing = new Set(tags.map((t) => t.toLowerCase()));
    const remaining = Math.max(0, maxTags - tags.length);
    const toAdd: Tag[] = [];

    for (const raw of aiSuggestions) {
      const next = normalizeTag(raw, maxTagLength);
      if (!next) continue;
      const key = next.toLowerCase();
      if (existing.has(key)) continue;
      toAdd.push(next);
      existing.add(key);
      if (toAdd.length >= remaining) break;
    }

    if (toAdd.length === 0) return;
    setTags(maybeSort([...tags, ...toAdd]));
    setAiSuggestions((prev) =>
      prev.filter((t) => !toAdd.some((a) => a.toLowerCase() === t.toLowerCase())),
    );
    inputRef.current?.focus();
  }, [aiSuggestions, canAddMore, disabled, maxTagLength, maxTags, maybeSort, setTags, tags]);

  return (
    <div className={cn("flex w-full max-w-[460px] flex-col gap-2", containerClassName)}>
      <Label htmlFor={inputId} className="flex items-center gap-1">
        {label} <span className="text-muted-foreground font-medium">(max {maxTags})</span>
        <InfoIcon />
      </Label>
      <div className="space-y-3">
        <InputGroup>
          <div className="relative w-full">
            {ghostVisible ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center px-[calc(--spacing(3)-1px)] text-base leading-8.5 whitespace-pre sm:text-sm sm:leading-7.5">
                {/* Ghost suggestion overlay:
                    We render "typed" + "suggested suffix" behind the input while making the input
                    text transparent. This keeps caret/selection behavior native & consistent. */}
                <span className="text-foreground">{inputValue}</span>
                <span className="text-muted-foreground/72">
                  {suggestion!.slice(inputValue.length)}
                </span>
              </div>
            ) : null}
            <InputGroupInput
              id={inputId}
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={onInputKeyDown}
              onPaste={onInputPaste}
              placeholder={placeholder}
              type="text"
              className="w-full"
              disabled={disabled}
              aria-disabled={disabled}
              aria-describedby={helpId}
              style={
                ghostVisible
                  ? ({
                      // When ghost is visible we hide the real text (keeping caret visible).
                      color: "transparent",
                      caretColor: "var(--foreground)",
                    } as CSSProperties)
                  : undefined
              }
            />
          </div>
          <InputGroupAddon align="inline-end">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon-xs"
                    variant="outline"
                    disabled={!aiCanGenerate}
                    onClick={() => aiMutation.mutate()}
                    aria-label="Generate tag suggestions (mock AI)"
                  />
                }>
                <SparklesIcon />
              </TooltipTrigger>
              <TooltipPopup sideOffset={8}>AI suggestions</TooltipPopup>
            </Tooltip>
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <Button
              size="icon-xs"
              variant="outline"
              disabled={!canSubmit}
              onClick={() => commitRawInput(inputValue)}>
              <AddIcon />
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <div id={helpId} className="sr-only">
          Type a tag and press Enter or comma to add. Paste comma/newline-separated tags to add
          multiple.
        </div>
        {name ? <input type="hidden" name={name} value={tags.join(",")} /> : null}

        <AnimatePresence initial={false}>
          {aiPanelOpen ? (
            <motion.div
              key="ai-suggestions"
              className="bg-muted/30 overflow-hidden rounded-lg border p-2.5"
              initial={{opacity: 0, height: 0}}
              animate={{
                opacity: 1,
                height: "auto",
                boxShadow:
                  aiStatus === "loading"
                    ? [
                        "0 0 0 1.5px rgba(168,85,247,0.7), 0 0 16px rgba(168,85,247,0.25)",
                        "0 0 0 1.5px rgba(59,130,246,0.7), 0 0 16px rgba(59,130,246,0.25)",
                        "0 0 0 1.5px rgba(6,182,212,0.7), 0 0 16px rgba(6,182,212,0.25)",
                        "0 0 0 1.5px rgba(168,85,247,0.7), 0 0 16px rgba(168,85,247,0.25)",
                      ]
                    : "0 0 0 0px transparent, 0 0 0px transparent",
              }}
              exit={{opacity: 0, height: 0}}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
                boxShadow:
                  aiStatus === "loading"
                    ? {duration: 3, repeat: Infinity, ease: "linear"}
                    : {duration: 0.4},
              }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <SparklesIcon className="text-muted-foreground" />
                  AI suggestions
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={
                      disabled || aiStatus !== "ready" || aiSuggestions.length === 0 || !canAddMore
                    }
                    onClick={addAllAiSuggestions}>
                    Add all
                  </Button>
                  <Button size="xs" variant="outline" onClick={dismissAi}>
                    Dismiss
                  </Button>
                </div>
              </div>

              <AnimatePresence initial={false} mode="wait">
                {aiStatus === "loading" ? (
                  <motion.div
                    key="ai-loading"
                    className="mt-4 flex flex-wrap gap-1.5 overflow-hidden"
                    initial={{opacity: 0, y: -4, filter: "blur(4px)"}}
                    animate={{opacity: 1, y: 0, filter: "blur(0px)"}}
                    exit={{opacity: 0, y: 4, filter: "blur(4px)"}}
                    transition={{duration: 0.16, ease: "easeOut"}}>
                    <Skeleton className="rounded-rounded h-6 w-18" />
                    <Skeleton className="rounded-rounded h-6 w-16" />
                    <Skeleton className="rounded-rounded h-6 w-12" />
                    <Skeleton className="rounded-rounded h-5.5 w-20" />
                    <Skeleton className="rounded-rounded h-6 w-10" />
                    <Skeleton className="rounded-rounded h-6 w-18" />
                    <Skeleton className="rounded-rounded h-6 w-14" />
                    <Skeleton className="rounded-rounded h-6 w-20" />
                  </motion.div>
                ) : aiSuggestions.length > 0 ? (
                  <motion.div
                    key="ai-ready"
                    className="mt-4 flex flex-wrap gap-1.5"
                    initial={{opacity: 0, y: -4, filter: "blur(4px)"}}
                    animate={{opacity: 1, y: 0, filter: "blur(0px)"}}
                    exit={{opacity: 0, y: 4, filter: "blur(4px)"}}
                    transition={{duration: 0.16, ease: "easeOut"}}>
                    <AnimatePresence initial={false} mode="popLayout">
                      {aiSuggestions.map((t) => (
                        <motion.button
                          key={t.toLowerCase()}
                          layout
                          disabled={disabled || !canAddMore}
                          onClick={() => addAiSuggestion(t)}
                          className="cursor-pointer"
                          initial={{opacity: 0, scale: 0.92, y: -2, filter: "blur(3px)"}}
                          animate={{opacity: 1, scale: 1, y: 0, filter: "blur(0px)"}}
                          exit={{opacity: 0, scale: 0.92, y: -2, filter: "blur(3px)"}}
                          transition={{duration: 0.16, ease: "easeOut"}}>
                          <Badge
                            size="md"
                            variant="outline"
                            className="border-muted-foreground/30 hover:bg-muted gap-1 border-dashed transition-colors duration-100">
                            <PlusIcon />
                            {t}
                          </Badge>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ai-empty"
                    className="text-muted-foreground mt-4 text-sm"
                    initial={{opacity: 0, y: -2}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: 2}}
                    transition={{duration: 0.14, ease: "easeOut"}}>
                    No suggestions available{canAddMore ? "." : " (max tags reached)."}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {tags.length > 0 ? (
            <motion.div
              className="flex flex-wrap gap-1"
              layout
              initial={{opacity: 0, height: 0}}
              animate={{opacity: 1, height: "auto"}}
              exit={{opacity: 0, height: 0}}
              transition={{duration: 0.2, ease: "easeInOut"}}>
              <AnimatePresence initial={false} mode="popLayout">
                {tags.map((tag, idx) => (
                  <motion.div
                    key={tag.toLowerCase()}
                    layout
                    initial={{opacity: 0, scale: 0.8, filter: "blur(4px)"}}
                    animate={{opacity: 1, scale: 1, filter: "blur(0px)"}}
                    exit={{opacity: 0, scale: 0.8, filter: "blur(4px)"}}
                    transition={{duration: 0.2, ease: "easeOut"}}>
                    <Badge size="md" variant="outline" className="bg-muted gap-0!">
                      {tag}
                      <button
                        type="button"
                        className="text-foreground/70 hover:text-foreground cursor-pointer p-1"
                        onClick={() => removeTagAt(idx)}
                        aria-label={`Remove tag ${tag}`}
                        disabled={disabled}>
                        <RemoveIcon />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

function AddIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2C8.27613 2 8.5 2.22386 8.5 2.5V7.5H13.5C13.7761 7.5 14 7.72387 14 8C14 8.27613 13.7761 8.5 13.5 8.5H8.5V13.5C8.5 13.7761 8.27613 14 8 14C7.72387 14 7.5 13.7761 7.5 13.5V8.5H2.5C2.22386 8.5 2 8.27613 2 8C2 7.72387 2.22386 7.5 2.5 7.5H7.5V2.5C7.5 2.22386 7.72387 2 8 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.00016 1.33334C4.31826 1.33334 1.3335 4.3181 1.3335 8C1.3335 11.6819 4.31826 14.6667 8.00016 14.6667C11.682 14.6667 14.6668 11.6819 14.6668 8C14.6668 4.3181 11.682 1.33334 8.00016 1.33334ZM6.66683 7.33334C6.66683 7.0572 6.8907 6.83334 7.16683 6.83334H8.00016C8.2763 6.83334 8.50016 7.0572 8.50016 7.33334V10.8333C8.50016 11.1095 8.2763 11.3333 8.00016 11.3333C7.72403 11.3333 7.50016 11.1095 7.50016 10.8333V7.83334H7.16683C6.8907 7.83334 6.66683 7.60947 6.66683 7.33334ZM8.00016 4.83334C7.72403 4.83334 7.50016 5.0572 7.50016 5.33334C7.50016 5.60948 7.72403 5.83334 8.00016 5.83334C8.2763 5.83334 8.50016 5.60948 8.50016 5.33334C8.50016 5.0572 8.2763 4.83334 8.00016 4.83334Z"
        fill="var(--muted-foreground)"
      />
    </svg>
  );
}

function SparklesIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_157_101)">
        <path
          d="M10.4998 5.16667C10.4998 4.89053 10.276 4.66667 9.99984 4.66667C9.7237 4.66667 9.49984 4.89053 9.49984 5.16667C9.49984 6.78387 9.14257 7.83421 8.4883 8.48847C7.83404 9.14274 6.7837 9.50001 5.1665 9.50001C4.89036 9.50001 4.6665 9.72387 4.6665 10C4.6665 10.2761 4.89036 10.5 5.1665 10.5C6.7837 10.5 7.83404 10.8573 8.4883 11.5115C9.14257 12.1658 9.49984 13.2161 9.49984 14.8333C9.49984 15.1095 9.7237 15.3333 9.99984 15.3333C10.276 15.3333 10.4998 15.1095 10.4998 14.8333C10.4998 13.2161 10.8571 12.1658 11.5114 11.5115C12.1656 10.8573 13.216 10.5 14.8332 10.5C15.1093 10.5 15.3332 10.2761 15.3332 10C15.3332 9.72387 15.1093 9.50001 14.8332 9.50001C13.216 9.50001 12.1656 9.14274 11.5114 8.48847C10.8571 7.83421 10.4998 6.78387 10.4998 5.16667Z"
          fill="currentColor"
        />
        <path
          d="M4.83317 1.16667C4.83317 0.890532 4.60931 0.666672 4.33317 0.666672C4.05703 0.666672 3.83317 0.890532 3.83317 1.16667C3.83317 2.20517 3.60323 2.83881 3.22094 3.22111C2.83864 3.6034 2.205 3.83334 1.1665 3.83334C0.890364 3.83334 0.666504 4.0572 0.666504 4.33334C0.666504 4.60948 0.890364 4.83334 1.1665 4.83334C2.205 4.83334 2.83864 5.06328 3.22094 5.44557C3.60323 5.82787 3.83317 6.46151 3.83317 7.50001C3.83317 7.77614 4.05703 8.00001 4.33317 8.00001C4.60931 8.00001 4.83317 7.77614 4.83317 7.50001C4.83317 6.46151 5.06311 5.82787 5.4454 5.44557C5.8277 5.06328 6.46134 4.83334 7.49984 4.83334C7.77597 4.83334 7.99984 4.60948 7.99984 4.33334C7.99984 4.0572 7.77597 3.83334 7.49984 3.83334C6.46134 3.83334 5.8277 3.6034 5.4454 3.22111C5.06311 2.83881 4.83317 2.20517 4.83317 1.16667Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_157_101">
          <rect width="16" height="16" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.05806 2.05806C2.30214 1.81398 2.69787 1.81398 2.94194 2.05806L6 5.1161L9.05805 2.05806C9.30215 1.81398 9.69785 1.81398 9.94195 2.05806C10.186 2.30214 10.186 2.69787 9.94195 2.94194L6.8839 6L9.94195 9.05805C10.186 9.30215 10.186 9.69785 9.94195 9.94195C9.69785 10.186 9.30215 10.186 9.05805 9.94195L6 6.8839L2.94194 9.94195C2.69787 10.186 2.30214 10.186 2.05806 9.94195C1.81398 9.69785 1.81398 9.30215 2.05806 9.05805L5.1161 6L2.05806 2.94194C1.81398 2.69787 1.81398 2.30214 2.05806 2.05806Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 1.5C6.2071 1.5 6.375 1.6679 6.375 1.875V5.625H10.125C10.3321 5.625 10.5 5.7929 10.5 6C10.5 6.2071 10.3321 6.375 10.125 6.375H6.375V10.125C6.375 10.3321 6.2071 10.5 6 10.5C5.7929 10.5 5.625 10.3321 5.625 10.125V6.375H1.875C1.6679 6.375 1.5 6.2071 1.5 6C1.5 5.7929 1.6679 5.625 1.875 5.625H5.625V1.875C5.625 1.6679 5.7929 1.5 6 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default TagsInput;
