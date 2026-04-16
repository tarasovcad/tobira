"use client";

import {
  Menu,
  MenuTrigger,
  MenuPopup,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/coss-ui/menu";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/coss-ui/accordion";
import {Button} from "@/components/coss-ui/button";
import {Switch} from "@/components/ui/switch";
import {SliderComfortable} from "@/components/ui/slider";
import {cn} from "@/lib/utils";
import {
  useViewOptionsStore,
  type ColumnSize,
  type ContentField,
  type ViewMode,
  type GridGap,
  type BorderRadius,
  type BookmarkWidth,
} from "@/store/use-view-options";
import type {TypeFilter} from "../_types";
import {
  getCurrentAllItemsView,
  isAllItemsViewSelectable,
} from "./all-items-client/all-items-list-view-options";

const LAYOUT_OPTIONS = [
  {
    id: "list",
    title: "List",
    icon: () => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.75 13.75C4.44036 13.75 5 14.3097 5 15C5 15.6903 4.44036 16.25 3.75 16.25C3.05964 16.25 2.5 15.6903 2.5 15C2.5 14.3097 3.05964 13.75 3.75 13.75Z"
          fill="currentColor"
        />
        <path
          d="M16.6667 14.1667C17.1269 14.1667 17.5 14.5398 17.5 15.0001C17.5 15.4603 17.1269 15.8334 16.6667 15.8334H8.33333C7.8731 15.8334 7.5 15.4603 7.5 15.0001C7.5 14.5398 7.8731 14.1667 8.33333 14.1667H16.6667Z"
          fill="currentColor"
        />
        <path
          d="M3.75 8.75C4.44036 8.75 5 9.30967 5 10C5 10.6903 4.44036 11.25 3.75 11.25C3.05964 11.25 2.5 10.6903 2.5 10C2.5 9.30967 3.05964 8.75 3.75 8.75Z"
          fill="currentColor"
        />
        <path
          d="M16.6667 9.16675C17.1269 9.16675 17.5 9.53983 17.5 10.0001C17.5 10.4603 17.1269 10.8334 16.6667 10.8334H8.33333C7.8731 10.8334 7.5 10.4603 7.5 10.0001C7.5 9.53983 7.8731 9.16675 8.33333 9.16675H16.6667Z"
          fill="currentColor"
        />
        <path
          d="M3.75 3.75C4.44036 3.75 5 4.30964 5 5C5 5.69036 4.44036 6.25 3.75 6.25C3.05964 6.25 2.5 5.69036 2.5 5C2.5 4.30964 3.05964 3.75 3.75 3.75Z"
          fill="currentColor"
        />
        <path
          d="M16.6667 4.16675C17.1269 4.16675 17.5 4.53985 17.5 5.00008C17.5 5.46031 17.1269 5.83341 16.6667 5.83341H8.33333C7.8731 5.83341 7.5 5.46031 7.5 5.00008C7.5 4.53985 7.8731 4.16675 8.33333 4.16675H16.6667Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "grid",
    title: "Grid",
    icon: () => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.29892 2.5C6.62811 2.49999 6.07448 2.49998 5.62348 2.53683C5.15507 2.5751 4.72448 2.65723 4.32003 2.86331C3.69283 3.18289 3.18289 3.69283 2.86331 4.32003C2.65723 4.72448 2.5751 5.15507 2.53683 5.62348C2.49998 6.07448 2.49999 6.62811 2.5 7.29892V8.33333C2.5 8.79358 2.8731 9.16667 3.33333 9.16667H8.33333C8.79358 9.16667 9.16667 8.79358 9.16667 8.33333V3.33333C9.16667 2.8731 8.79358 2.5 8.33333 2.5H7.29892Z"
          fill="currentColor"
        />
        <path
          d="M15.68 2.86331C15.2755 2.65723 14.845 2.5751 14.3765 2.53683C13.9255 2.49998 13.372 2.49999 12.7011 2.5H11.6667C11.2065 2.5 10.8334 2.8731 10.8334 3.33333V8.33333C10.8334 8.79358 11.2065 9.16667 11.6667 9.16667H16.6667C17.127 9.16667 17.5 8.79358 17.5 8.33333V7.2989C17.5 6.6281 17.5 6.07447 17.4632 5.62348C17.425 5.15507 17.3428 4.72448 17.1367 4.32003C16.8171 3.69283 16.3072 3.18289 15.68 2.86331Z"
          fill="currentColor"
        />
        <path
          d="M3.33333 10.8333C2.8731 10.8333 2.5 11.2063 2.5 11.6666V12.701C2.49999 13.3718 2.49998 13.9254 2.53683 14.3764C2.5751 14.8448 2.65723 15.2754 2.86331 15.6799C3.18289 16.3071 3.69283 16.817 4.32003 17.1366C4.72448 17.3427 5.15507 17.4248 5.62348 17.4631C6.07447 17.4999 6.6281 17.4999 7.2989 17.4999H8.33333C8.79358 17.4999 9.16667 17.1268 9.16667 16.6666V11.6666C9.16667 11.2063 8.79358 10.8333 8.33333 10.8333H3.33333Z"
          fill="currentColor"
        />
        <path
          d="M11.6667 10.8333C11.2065 10.8333 10.8334 11.2063 10.8334 11.6666V16.6666C10.8334 17.1268 11.2065 17.4999 11.6667 17.4999H12.7011C13.372 17.4999 13.9255 17.4999 14.3765 17.4631C14.845 17.4248 15.2755 17.3427 15.68 17.1366C16.3072 16.817 16.8171 16.3071 17.1367 15.6799C17.3428 15.2754 17.425 14.8448 17.4632 14.3764C17.5 13.9254 17.5 13.3718 17.5 12.701V11.6666C17.5 11.2063 17.127 10.8333 16.6667 10.8333H11.6667Z"
          fill="currentColor"
        />
      </svg>
    ),
  },

  {
    id: "table",
    title: "Table",
    icon: () => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9.16663 2.5H12.701C13.3719 2.49999 13.9255 2.49998 14.3765 2.53683C14.8449 2.5751 15.2755 2.65723 15.68 2.86332C16.3071 3.18289 16.817 3.69283 17.1366 4.32003C17.3427 4.72448 17.4249 5.15507 17.4631 5.62348C17.5 6.07448 17.5 6.6281 17.5 7.2989V7.5H9.16663V2.5Z"
          fill="currentColor"
        />
        <path
          d="M7.5 2.5H7.29892C6.62813 2.49999 6.07447 2.49998 5.62348 2.53683C5.15507 2.5751 4.72448 2.65723 4.32003 2.86332C3.69283 3.18289 3.18289 3.69283 2.86332 4.32003C2.65723 4.72448 2.5751 5.15507 2.53683 5.62348C2.49998 6.07447 2.49999 6.62809 2.5 7.29889V7.5H7.5V2.5Z"
          fill="currentColor"
        />
        <path
          d="M2.5 9.16675V12.7012C2.49999 13.372 2.49998 13.9256 2.53683 14.3766C2.5751 14.845 2.65723 15.2756 2.86332 15.6801C3.18289 16.3072 3.69283 16.8172 4.32003 17.1367C4.72448 17.3428 5.15507 17.425 5.62348 17.4632C6.07448 17.5001 6.6281 17.5001 7.2989 17.5001H7.5V9.16675H2.5Z"
          fill="currentColor"
        />
        <path
          d="M9.16663 17.5001H12.701C13.3719 17.5001 13.9255 17.5001 14.3765 17.4632C14.8449 17.425 15.2755 17.3428 15.68 17.1367C16.3071 16.8172 16.817 16.3072 17.1366 15.6801C17.3427 15.2756 17.4249 14.845 17.4631 14.3766C17.5 13.9256 17.5 13.372 17.5 12.7012V9.16675H9.16663V17.5001Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: "compact",
    title: "Compact",
    icon: () => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.67004 5.00326C1.67004 4.54302 2.04314 4.16992 2.50338 4.16992H17.5034C17.9636 4.16992 18.3367 4.54302 18.3367 5.00326C18.3367 5.46349 17.9636 5.83659 17.5034 5.83659H2.50338C2.04314 5.83659 1.67004 5.46349 1.67004 5.00326ZM1.67004 10.0033C1.67004 9.543 2.04314 9.16992 2.50338 9.16992H17.5034C17.9636 9.16992 18.3367 9.543 18.3367 10.0033C18.3367 10.4635 17.9636 10.8366 17.5034 10.8366H2.50338C2.04314 10.8366 1.67004 10.4635 1.67004 10.0033ZM1.67004 15.0033C1.67004 14.543 2.04314 14.1699 2.50338 14.1699H17.5034C17.9636 14.1699 18.3367 14.543 18.3367 15.0033C18.3367 15.4635 17.9636 15.8366 17.5034 15.8366H2.50338C2.04314 15.8366 1.67004 15.4635 1.67004 15.0033Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

const CONTENT_OPTIONS = [
  {id: "avatar", label: "Avatar"},
  {id: "description", label: "Description"},
  {id: "tags", label: "Tags"},
  {id: "source", label: "Source"},
  {id: "savedDate", label: "Saved date"},
] as const;

const GRID_GAP_OPTIONS = [
  {value: "none", label: "None"},
  {value: "xs", label: "XS"},
  {value: "sm", label: "S"},
  {value: "md", label: "M"},
  {value: "lg", label: "L"},
] as const;

const BORDER_RADIUS_OPTIONS = [
  {value: "none", label: "None"},
  {value: "sm", label: "S"},
  {value: "md", label: "M"},
  {value: "lg", label: "L"},
] as const;

const WIDTH_OPTIONS = [
  {value: "xs", label: "XS"},
  {value: "sm", label: "S"},
  {value: "md", label: "M"},
  {value: "lg", label: "L"},
  {value: "full", label: "Full"},
] as const;

type AppearanceField = "width" | "columnSize" | "gridGap" | "borderRadius";

const DISABLED_APPEARANCE_BY_VIEW: Partial<Record<ViewMode, AppearanceField[]>> = {
  list: ["columnSize", "gridGap", "borderRadius"],
  compact: ["columnSize", "gridGap", "borderRadius"],
  table: ["columnSize", "gridGap", "borderRadius"],
  grid: ["width"],
};

const DISABLED_CONTENT_BY_VIEW: Partial<Record<ViewMode, ContentField[]>> = {
  compact: ["description"],
  grid: ["avatar"],
};

// We keep this lookup exhaustive because direct `contentToggles[field]`
// access triggers the dynamic object indexing lint rule in this codebase.
function isContentFieldEnabled(contentToggles: Record<ContentField, boolean>, field: ContentField) {
  switch (field) {
    case "avatar":
      return contentToggles.avatar;
    case "description":
      return contentToggles.description;
    case "tags":
      return contentToggles.tags;
    case "source":
      return contentToggles.source;
    case "savedDate":
      return contentToggles.savedDate;
  }
}

const DEFAULT_VIEW_OPTIONS: Record<
  ViewMode,
  {
    gridGap: GridGap;
    columnSize: ColumnSize;
    borderRadius: BorderRadius;
    bookmarkWidth: BookmarkWidth;
    contentToggles: Record<ContentField, boolean>;
  }
> = {
  list: {
    gridGap: "none",
    columnSize: 3,
    borderRadius: "none",
    bookmarkWidth: "full",
    contentToggles: {
      avatar: true,
      description: true,
      tags: false,
      source: true,
      savedDate: true,
    },
  },
  compact: {
    gridGap: "none",
    columnSize: 3,
    borderRadius: "none",
    bookmarkWidth: "sm",
    contentToggles: {
      avatar: true,
      description: false,
      tags: false,
      source: true,
      savedDate: false,
    },
  },
  grid: {
    gridGap: "md",
    columnSize: 4,
    borderRadius: "md",
    bookmarkWidth: "full",
    contentToggles: {
      avatar: true,
      description: false,
      tags: false,
      source: true,
      savedDate: true,
    },
  },
  table: {
    gridGap: "none",
    columnSize: 1,
    borderRadius: "none",
    bookmarkWidth: "full",
    contentToggles: {
      avatar: true,
      description: false,
      tags: false,
      source: true,
      savedDate: true,
    },
  },
};

const ViewOptionsMenu = ({typeFilter}: {typeFilter: TypeFilter}) => {
  const bookmarkWidth = useViewOptionsStore((state) => state.bookmarkWidth);
  const setBookmarkWidth = useViewOptionsStore((state) => state.setBookmarkWidth);
  const view = useViewOptionsStore((state) => state.view);
  const setView = useViewOptionsStore((state) => state.setView);

  const gridGap = useViewOptionsStore((state) => state.gridGap);
  const setGridGap = useViewOptionsStore((state) => state.setGridGap);
  const columnSize = useViewOptionsStore((state) => state.columnSize);
  const setColumnSize = useViewOptionsStore((state) => state.setColumnSize);
  const borderRadius = useViewOptionsStore((state) => state.borderRadius);
  const setBorderRadius = useViewOptionsStore((state) => state.setBorderRadius);

  const contentToggles = useViewOptionsStore((state) => state.contentToggles);
  const setContentToggle = useViewOptionsStore((state) => state.setContentToggle);
  const setContentToggles = useViewOptionsStore((state) => state.setContentToggles);

  const isMedia = typeFilter === "media";
  const isPost = typeFilter === "post";
  const currentView = getCurrentAllItemsView(view, typeFilter);
  const disabledAppearanceFields = DISABLED_APPEARANCE_BY_VIEW[currentView as ViewMode] || [];

  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" size="default" />}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6 8.66667C7.243 8.66667 8.2868 9.51627 8.58267 10.6667H13.3333C13.7015 10.6667 14 10.9651 14 11.3333C14 11.7015 13.7015 12 13.3333 12H8.58267C8.2868 13.1504 7.243 14 6 14C4.75703 14 3.71321 13.1504 3.41732 12H2.66667C2.29848 12 2 11.7015 2 11.3333C2 10.9651 2.29848 10.6667 2.66667 10.6667H3.41732C3.71321 9.51627 4.75703 8.66667 6 8.66667Z"
            fill="currentColor"
          />
          <path
            d="M10 2C11.243 2 12.2868 2.84962 12.5827 4H13.3333C13.7015 4 14 4.29848 14 4.66667C14 5.03485 13.7015 5.33333 13.3333 5.33333H12.5827C12.2868 6.48371 11.243 7.33333 10 7.33333C8.757 7.33333 7.7132 6.48371 7.41733 5.33333H2.66667C2.29848 5.33333 2 5.03485 2 4.66667C2 4.29848 2.29848 4 2.66667 4H7.41733C7.7132 2.84962 8.757 2 10 2Z"
            fill="currentColor"
          />
        </svg>
        View
      </MenuTrigger>
      <MenuPopup className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="uppercase">View options</DropdownMenuLabel>

          <Accordion
            className="w-full"
            defaultValue={isMedia || isPost ? ["appearance"] : ["layout"]}>
            <AccordionItem className="border-b-0" value="layout">
              <AccordionTrigger className="hover:bg-accent hover:text-accent-foreground min-h-8 items-center rounded-sm px-2 py-1 text-sm font-normal sm:min-h-7">
                <div className="flex items-center gap-2 [&>svg]:pointer-events-none [&>svg]:-mx-0.5 [&>svg]:shrink-0 [&>svg:not([class*='opacity-'])]:opacity-80 [&>svg:not([class*='size-'])]:size-4.5 sm:[&>svg:not([class*='size-'])]:size-4">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4.66667 8.66675C6.13943 8.66675 7.33333 9.86068 7.33333 11.3334C7.33333 12.8061 6.13943 14.0001 4.66667 14.0001C3.19391 14.0001 2 12.8061 2 11.3334C2 9.86068 3.19391 8.66675 4.66667 8.66675Z"
                      fill="currentColor"
                    />
                    <path
                      d="M11.3333 2C12.806 2 14 3.19391 14 4.66667V11.3333C14 12.8061 12.806 14 11.3333 14C9.86056 14 8.66663 12.8061 8.66663 11.3333V4.66667C8.66663 3.19391 9.86056 2 11.3333 2Z"
                      fill="currentColor"
                    />
                    <path
                      d="M4.66667 2C6.13943 2 7.33333 3.19391 7.33333 4.66667C7.33333 6.13943 6.13943 7.33333 4.66667 7.33333C3.19391 7.33333 2 6.13943 2 4.66667C2 3.19391 3.19391 2 4.66667 2Z"
                      fill="currentColor"
                    />
                  </svg>
                  Layout
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-1 py-1">
                <div className="grid grid-cols-2 gap-1">
                  {LAYOUT_OPTIONS.map(({id, title, icon: Icon}) => {
                    const isOptionDisabled =
                      id === "table" || !isAllItemsViewSelectable(id as ViewMode, typeFilter);
                    return (
                      <div
                        key={id}
                        onClick={() => {
                          if (isOptionDisabled) return;

                          // Set the new view
                          const newView = id as ViewMode;
                          setView(newView);

                          // Reset to default options for the new view
                          const defaults = DEFAULT_VIEW_OPTIONS[newView];
                          if (defaults) {
                            setGridGap(defaults.gridGap);
                            setColumnSize(defaults.columnSize);
                            setBorderRadius(defaults.borderRadius);
                            setBookmarkWidth(defaults.bookmarkWidth);
                            setContentToggles(defaults.contentToggles);
                          }
                        }}
                        className={cn(
                          "hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center justify-start gap-2 rounded-sm p-1",
                          currentView === id && "bg-accent text-accent-foreground",
                          isOptionDisabled && "pointer-events-none opacity-50",
                        )}>
                        <div className="border-border flex size-8 items-center justify-center rounded-md border">
                          <Icon />
                        </div>
                        <span className="text-sm font-medium">{title}</span>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem className="border-b-0" value="appearance">
              <AccordionTrigger className="hover:bg-accent hover:text-accent-foreground min-h-8 items-center rounded-sm px-2 py-1 text-sm font-normal sm:min-h-7">
                <div className="flex items-center gap-2 [&>svg]:pointer-events-none [&>svg]:-mx-0.5 [&>svg]:shrink-0 [&>svg:not([class*='opacity-'])]:opacity-80 [&>svg:not([class*='size-'])]:size-4.5 sm:[&>svg:not([class*='size-'])]:size-4">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M1.33337 8.00008C1.33337 4.46689 4.35455 1.66675 8.00004 1.66675C11.6455 1.66675 14.6667 4.46689 14.6667 8.00008C14.6667 9.24975 14.3304 10.1469 13.566 10.6227C12.8675 11.0575 11.9981 11.0034 11.3172 10.9149C11.0752 10.8834 10.8202 10.8413 10.5811 10.8018C10.4724 10.7838 10.3669 10.7664 10.2674 10.7507C9.93144 10.698 9.63804 10.6609 9.38131 10.6571C8.86517 10.6496 8.69337 10.7707 8.59631 10.9649C8.54104 11.0755 8.52851 11.227 8.61551 11.4848C8.69364 11.7163 8.81851 11.9423 8.96271 12.2033C8.98851 12.2499 9.01491 12.2977 9.04177 12.3469C9.12171 12.4931 9.21237 12.6645 9.27617 12.8335C9.33477 12.9884 9.41137 13.2418 9.35457 13.5193C9.28484 13.8599 9.05071 14.0872 8.77744 14.2049C8.54144 14.3065 8.26757 14.3334 8.00004 14.3334C4.35455 14.3334 1.33337 11.5333 1.33337 8.00008ZM7.00004 6.33341C7.55231 6.33341 8.00004 5.8857 8.00004 5.33341C8.00004 4.78113 7.55231 4.33341 7.00004 4.33341C6.44775 4.33341 6.00004 4.78113 6.00004 5.33341C6.00004 5.8857 6.44775 6.33341 7.00004 6.33341ZM5.83337 8.16675C5.83337 8.71901 5.38566 9.16675 4.83337 9.16675C4.28109 9.16675 3.83337 8.71901 3.83337 8.16675C3.83337 7.61448 4.28109 7.16675 4.83337 7.16675C5.38566 7.16675 5.83337 7.61448 5.83337 8.16675ZM10.3334 7.33341C10.8856 7.33341 11.3334 6.88568 11.3334 6.33341C11.3334 5.78113 10.8856 5.33341 10.3334 5.33341C9.78111 5.33341 9.33337 5.78113 9.33337 6.33341C9.33337 6.88568 9.78111 7.33341 10.3334 7.33341Z"
                      fill="currentColor"
                    />
                  </svg>
                  Appearance
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2">
                <div className="space-y-4 pt-2">
                  <SliderComfortable
                    label="Width"
                    value={WIDTH_OPTIONS.findIndex((o) => o.value === bookmarkWidth)}
                    min={0}
                    max={WIDTH_OPTIONS.length - 1}
                    step={1}
                    variant="pips"
                    className="cursor-pointer rounded-md"
                    showTooltip={false}
                    formatValue={(v) => WIDTH_OPTIONS[v as number].label}
                    disabled={disabledAppearanceFields.includes("width")}
                    onChange={(val) =>
                      setBookmarkWidth(WIDTH_OPTIONS[val as number].value as BookmarkWidth)
                    }
                  />

                  <SliderComfortable
                    label="Column size"
                    value={columnSize}
                    min={1}
                    max={6}
                    step={1}
                    className="cursor-pointer rounded-md"
                    variant="pips"
                    showTooltip={false}
                    disabled={disabledAppearanceFields.includes("columnSize")}
                    onChange={(val) => setColumnSize(val as ColumnSize)}
                  />

                  <SliderComfortable
                    label="Grid gap"
                    value={GRID_GAP_OPTIONS.findIndex((o) => o.value === gridGap)}
                    min={0}
                    max={GRID_GAP_OPTIONS.length - 1}
                    step={1}
                    variant="pips"
                    showTooltip={false}
                    className="cursor-pointer rounded-md"
                    formatValue={(v) => GRID_GAP_OPTIONS[v as number].label}
                    disabled={disabledAppearanceFields.includes("gridGap")}
                    onChange={(val) => setGridGap(GRID_GAP_OPTIONS[val as number].value as GridGap)}
                  />

                  <SliderComfortable
                    label="Border radius"
                    value={BORDER_RADIUS_OPTIONS.findIndex((o) => o.value === borderRadius)}
                    min={0}
                    max={BORDER_RADIUS_OPTIONS.length - 1}
                    step={1}
                    variant="pips"
                    className="cursor-pointer rounded-md"
                    showTooltip={false}
                    formatValue={(v) => BORDER_RADIUS_OPTIONS[v as number].label}
                    disabled={disabledAppearanceFields.includes("borderRadius")}
                    onChange={(val) =>
                      setBorderRadius(BORDER_RADIUS_OPTIONS[val as number].value as BorderRadius)
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem className="border-b-0" value="content">
              <AccordionTrigger className="hover:bg-accent hover:text-accent-foreground min-h-8 items-center rounded-sm px-2 py-1 text-sm font-normal sm:min-h-7">
                <div className="flex items-center gap-2 [&>svg]:pointer-events-none [&>svg]:-mx-0.5 [&>svg]:shrink-0 [&>svg:not([class*='opacity-'])]:opacity-80 [&>svg:not([class*='size-'])]:size-4.5 sm:[&>svg:not([class*='size-'])]:size-4">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M2 4.66667C2 3.19391 3.19391 2 4.66667 2H11.3333C12.8061 2 14 3.19391 14 4.66667V11.3333C14 12.8061 12.8061 14 11.3333 14H4.66667C3.19391 14 2 12.8061 2 11.3333V4.66667ZM5.33333 9.33333C5.33333 8.96513 5.63181 8.66667 6 8.66667H8.66667C9.03487 8.66667 9.33333 8.96513 9.33333 9.33333C9.33333 9.70153 9.03487 10 8.66667 10H6C5.63181 10 5.33333 9.70153 5.33333 9.33333ZM6 6C5.63181 6 5.33333 6.29848 5.33333 6.66667C5.33333 7.03487 5.63181 7.33333 6 7.33333H10C10.3682 7.33333 10.6667 7.03487 10.6667 6.66667C10.6667 6.29848 10.3682 6 10 6H6Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Content</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-foreground px-1 py-2 text-sm">
                <div className="space-y-2">
                  <div className="divide-border border-border divide-y rounded-md">
                    <div
                      className={cn(
                        "text-muted-foreground flex items-center justify-between gap-3 px-2 py-2",
                        isMedia && "pointer-events-none opacity-60",
                      )}>
                      <span className="">Title</span>
                      <span className="shrink-0">{isMedia ? "Always off" : "Always on"}</span>
                    </div>

                    {CONTENT_OPTIONS.map(({id, label}) => {
                      const isDisabled =
                        isMedia ||
                        (DISABLED_CONTENT_BY_VIEW[currentView as ViewMode] || []).includes(id);

                      return (
                        <Switch
                          key={id}
                          label={label}
                          disabled={isDisabled}
                          checked={isDisabled ? false : isContentFieldEnabled(contentToggles, id)}
                          onToggle={() => {
                            if (!isDisabled) {
                              setContentToggle(id, !isContentFieldEnabled(contentToggles, id));
                            }
                          }}
                          labelClassName="text-sm"
                          className={cn(
                            "hit-area-2 hover:text-accent-foreground hover:bg-accent flex-row-reverse justify-between gap-3 px-2 py-2",
                            isDisabled && "cursor-not-allowed!",
                          )}
                          aria-label={`Show ${label}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </DropdownMenuGroup>
      </MenuPopup>
    </Menu>
  );
};

export default ViewOptionsMenu;
