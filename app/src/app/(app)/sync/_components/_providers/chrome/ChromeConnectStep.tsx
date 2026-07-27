"use client";

import {type ComponentType} from "react";

import {InfoTooltip} from "@/components/ui/app/info-tooltip";
import {Button} from "@/components/ui/coss/button";
import {cn} from "@/lib/utils";
import {SyncModeTooltipContent, type SyncMode} from "../../SyncModeTooltipContent";
import {useChromeSetupStore, type ChromeSourceId} from "./use-chrome-setup-store";

interface ChromeSource {
  id: ChromeSourceId;
  label: string;
  icon: ComponentType<{className?: string}>;
  badge?: string;
  disabled?: boolean;
}

const IMPORT_SOURCES: ChromeSource[] = [
  {
    id: "import-bookmarks",
    label: "Bookmarks",
    icon: () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5.33317 1.33334C3.86041 1.33334 2.6665 2.52725 2.6665 4.00001V13.3299C2.6665 14.4097 3.88307 15.0417 4.76654 14.4207L7.2331 12.6871C7.69317 12.3637 8.3065 12.3637 8.76657 12.6871L11.2331 14.4207C12.1166 15.0417 13.3332 14.4097 13.3332 13.3299V4.00001C13.3332 2.52725 12.1392 1.33334 10.6665 1.33334H5.33317Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "import-open-tabs",
    label: "Current open tabs",
    disabled: true,
    icon: () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 11.3333C14 12.8061 12.8061 14 11.3333 14H4.66667C3.19391 14 2 12.8061 2 11.3333V7.33333H14V11.3333Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.3333 2C12.8061 2 14 3.19391 14 4.66667V6H2V4.66667C2 3.19391 3.19391 2 4.66667 2H11.3333ZM4 3.33333C3.63181 3.33333 3.33333 3.63181 3.33333 4C3.33333 4.36819 3.63181 4.66667 4 4.66667C4.36819 4.66667 4.66667 4.36819 4.66667 4C4.66667 3.63181 4.36819 3.33333 4 3.33333ZM5.66667 3.33333C5.29848 3.33333 5 3.63181 5 4C5 4.36819 5.29848 4.66667 5.66667 4.66667C6.03485 4.66667 6.33333 4.36819 6.33333 4C6.33333 3.63181 6.03485 3.33333 5.66667 3.33333ZM7.33333 3.33333C6.96513 3.33333 6.66667 3.63181 6.66667 4C6.66667 4.36819 6.96513 4.66667 7.33333 4.66667C7.70153 4.66667 8 4.36819 8 4C8 3.63181 7.70153 3.33333 7.33333 3.33333Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "import-tab-groups",
    label: "Tab groups",
    disabled: true,
    icon: () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1.33301 4.66667C1.33301 3.19391 2.52691 2 3.99967 2H5.83791C6.54516 2 7.22341 2.28095 7.72354 2.78105L7.88527 2.94281C8.13534 3.19286 8.47447 3.33333 8.82807 3.33333H11.9997C13.4724 3.33333 14.6663 4.52724 14.6663 6V6.66642C14.1092 6.24796 13.4167 6 12.6663 6H3.33301C2.5826 6 1.89011 6.24796 1.33301 6.66642V4.66667Z"
          fill="currentColor"
        />
        <path
          d="M1.33301 9.33334V10.6667C1.33301 12.1394 2.52691 13.3333 3.99967 13.3333H11.9997C13.4724 13.3333 14.6663 12.1394 14.6663 10.6667V9.33334C14.6663 8.22874 13.7709 7.33334 12.6663 7.33334H3.33301C2.22844 7.33334 1.33301 8.22874 1.33301 9.33334Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "import-reading-list",
    label: "Reading List",
    disabled: true,
    icon: () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8.66699 3.33563V14.0348L12.5788 13.1655C13.7989 12.8944 14.667 11.8122 14.667 10.5623V5.3266C14.667 3.62061 13.0872 2.35335 11.4219 2.72344L8.66699 3.33563Z"
          fill="currentColor"
        />
        <path
          d="M7.33301 14.0348V3.33563L4.57815 2.72344C2.91279 2.35335 1.33301 3.62061 1.33301 5.3266V10.5623C1.33301 11.8122 2.20109 12.8944 3.42119 13.1655L7.33301 14.0348Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "import-pinned-tabs",
    label: "Pinned tabs",
    disabled: true,
    icon: () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.00033 1.33334C5.52757 1.33334 4.33366 2.52724 4.33366 4V4.99951C4.33366 5.89016 3.97985 6.74434 3.35006 7.37414C2.9127 7.81147 2.66699 8.40467 2.66699 9.0232V10C2.66699 10.3682 2.96547 10.6667 3.33366 10.6667H7.33366V14C7.33366 14.3682 7.63213 14.6667 8.00033 14.6667C8.36853 14.6667 8.66699 14.3682 8.66699 14V10.6667H12.667C13.0352 10.6667 13.3337 10.3682 13.3337 10V9.0232C13.3337 8.40467 13.0879 7.81147 12.6506 7.37414C12.0208 6.74434 11.667 5.89016 11.667 4.99951V4C11.667 2.52724 10.4731 1.33334 9.00033 1.33334H7.00033Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

const AUTO_SYNC_SOURCES: ChromeSource[] = [
  {
    id: "sync-bookmarks",
    label: "Bookmarks",
    disabled: true,
    icon: () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5.33317 1.33334C3.86041 1.33334 2.6665 2.52725 2.6665 4.00001V13.3299C2.6665 14.4097 3.88307 15.0417 4.76654 14.4207L7.2331 12.6871C7.69317 12.3637 8.3065 12.3637 8.76657 12.6871L11.2331 14.4207C12.1166 15.0417 13.3332 14.4097 13.3332 13.3299V4.00001C13.3332 2.52725 12.1392 1.33334 10.6665 1.33334H5.33317Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "sync-reading-list",
    label: "Reading List",
    disabled: true,
    icon: () => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8.66699 3.33563V14.0348L12.5788 13.1655C13.7989 12.8944 14.667 11.8122 14.667 10.5623V5.3266C14.667 3.62061 13.0872 2.35335 11.4219 2.72344L8.66699 3.33563Z"
          fill="currentColor"
        />
        <path
          d="M7.33301 14.0348V3.33563L4.57815 2.72344C2.91279 2.35335 1.33301 3.62061 1.33301 5.3266V10.5623C1.33301 11.8122 2.20109 12.8944 3.42119 13.1655L7.33301 14.0348Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

const EXTENSION_CONNECTION_STEPS = [
  "Install the Tobira extension from the Chrome Web Store",
  "Open the Chrome profile that contains the content you want to import",
  "Click verify - Tobira confirms browser access without moving any data",
];

function SourceSection({
  title,
  mode,
  sources,
  selected,
  onSelectionChange,
}: {
  title: string;
  mode: SyncMode;
  sources: ChromeSource[];
  selected: ChromeSourceId;
  onSelectionChange: (sourceId: ChromeSourceId) => void;
}) {
  return (
    <section>
      <h3 className="text-foreground mb-3 flex items-center gap-1 text-[15px] font-[550]">
        {title}
        <InfoTooltip
          label={`${title} information`}
          popupClassName={mode === "automatic" ? "max-w-[260px]" : "max-w-[230px]"}>
          <SyncModeTooltipContent mode={mode} />
        </InfoTooltip>
      </h3>

      <div className="border-border divide-border divide-y overflow-hidden rounded-[10px] border">
        {sources.map((source) => {
          const isSelected = selected === source.id;
          const Icon = source.icon;

          return (
            <button
              key={source.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={source.disabled}
              onClick={() => !source.disabled && onSelectionChange(source.id)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left transition-none!",
                isSelected
                  ? "bg-muted-strong text-foreground"
                  : "text-secondary hover:bg-muted hover:text-foreground",
                source.disabled &&
                  "hover:text-secondary cursor-not-allowed opacity-70 select-none hover:bg-transparent",
              )}>
              <div
                className={cn(
                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-none!",
                  isSelected ? "border-highlight bg-highlight" : "border-muted-foreground/35",
                )}>
                {isSelected && <div className="h-1 w-1 rounded-full bg-white" />}
              </div>
              <Icon className="size-4 shrink-0 opacity-65" aria-hidden="true" />
              <span className="flex-1 text-sm font-medium">{source.label}</span>
              {source.badge ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-[550] tracking-wide uppercase",
                    source.badge === "Recommended"
                      ? "bg-highlight/12 text-blue-400"
                      : "bg-muted text-muted-foreground/70",
                  )}>
                  {source.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function ChromeConnectStep() {
  const selectedSource = useChromeSetupStore((state) => state.selectedSource);
  const setSelectedSource = useChromeSetupStore((state) => state.setSelectedSource);

  return (
    <div className="flex flex-col px-6 pb-2">
      <div
        className="flex flex-col gap-6"
        role="radiogroup"
        aria-label="Choose Chrome content to connect">
        <SourceSection
          title="Import once"
          mode="once"
          sources={IMPORT_SOURCES}
          selected={selectedSource}
          onSelectionChange={setSelectedSource}
        />

        <SourceSection
          title="Auto sync"
          mode="automatic"
          sources={AUTO_SYNC_SOURCES}
          selected={selectedSource}
          onSelectionChange={setSelectedSource}
        />
      </div>

      <div className="pt-7 pb-5">
        <div className="mb-3">
          {EXTENSION_CONNECTION_STEPS.map((step, index) => (
            <div key={step} className="flex items-start gap-4">
              <div className="flex flex-col items-center self-stretch">
                <div className="bg-highlight flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] leading-none font-semibold text-white">
                  {index + 1}
                </div>
                {index < EXTENSION_CONNECTION_STEPS.length - 1 ? (
                  <div className="bg-border my-1 min-h-4 w-px flex-1" />
                ) : null}
              </div>
              <p
                className={cn(
                  "text-secondary -mt-0.5 text-sm",
                  index < EXTENSION_CONNECTION_STEPS.length - 1 && "pb-3",
                )}>
                {step}
              </p>
            </div>
          ))}
        </div>

        <Button type="button" size="default" variant="default" className="mt-2 w-full">
          Verify connection
        </Button>

        <p className="text-muted-foreground mt-3 text-center text-sm">
          Don&apos;t have the extension?{" "}
          <Button
            type="button"
            size="sm"
            variant="link"
            className="text-foreground px-0 underline underline-offset-2 transition-opacity hover:opacity-70">
            Download it here
          </Button>
        </p>
      </div>
    </div>
  );
}
