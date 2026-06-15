"use client";

import type {ReactNode} from "react";
import {PageHeader} from "@/components/ui/app/page/PageHeader";
import {SelectionModeButton} from "@/components/bookmark/SelectionModeButton";
import {Button} from "@/components/ui/coss/button";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/coss/input-group";
import {Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger} from "@/components/ui/coss/menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/legacy-shadcn/context-menu";
import {useFloatingHoverTooltip} from "@/lib/hooks/use-floating-hover-tooltip";
import {useCollectionDialogStore} from "@/store/use-collection-dialog-store";

export type CollectionPageData = {
  collections: CollectionPageItem[];
  stats: {
    collectionCount: number;
    savedItemCount: number;
    uncategorizedItemCount: number;
    updatedThisWeekCount: number;
  };
};

export type CollectionPageItem = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string | null;
  itemCount: number;
};

type CollectionPageProps = {
  data: CollectionPageData;
};

export default function CollectionPage({data}: CollectionPageProps) {
  const {getTriggerProps, tooltipRef, tooltipStyle, visible} = useFloatingHoverTooltip();
  const openCollectionDialog = useCollectionDialogStore((state) => state.openDialog);
  const {collections, stats: collectionStats} = data;
  const stats = [
    {label: "Collections", value: String(collectionStats.collectionCount)},
    {label: "Saved items", value: String(collectionStats.savedItemCount)},
    {label: "Uncategorized items", value: String(collectionStats.uncategorizedItemCount)},
    {label: "Updated this week", value: String(collectionStats.updatedThisWeekCount)},
  ];

  return (
    <div className="flex h-full w-full overflow-auto">
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="bg-popover text-foreground pointer-events-none fixed top-0 left-0 z-[9999] rounded-md border px-2.5 py-1 text-sm whitespace-nowrap"
        style={{
          ...tooltipStyle,
          transform: `scale(${visible ? 1 : 0.98})`,
        }}>
        Coming soon
      </div>
      <div className="min-h-0 flex-1 overflow-auto py-12">
        <div className="mx-auto max-w-[calc(840px+16px+16px)] space-y-10">
          <div className="px-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <PageHeader
                title="Collections"
                description="A simple overview of the groups you use to keep bookmarks organized."
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" className="w-fit" onClick={() => openCollectionDialog()}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M1.3335 7.99999C1.3335 4.31809 4.31826 1.33333 8.00016 1.33333C11.682 1.33333 14.6668 4.31809 14.6668 7.99999C14.6668 11.6819 11.682 14.6667 8.00016 14.6667C4.31826 14.6667 1.3335 11.6819 1.3335 7.99999ZM10.6668 8.66659C11.035 8.66659 11.3335 8.36813 11.3335 7.99993C11.3335 7.63173 11.035 7.33326 10.6668 7.33326L8.66683 7.33333V5.33341C8.66683 4.96522 8.36836 4.66674 8.00016 4.66674C7.63196 4.66674 7.3335 4.96522 7.3335 5.33341V7.33333L5.33348 7.33339C4.96529 7.33339 4.66682 7.63193 4.66683 8.00006C4.66684 8.36826 4.96532 8.66673 5.33352 8.66673L7.3335 8.66666V10.6667C7.3335 11.0349 7.63196 11.3333 8.00016 11.3333C8.36836 11.3333 8.66683 11.0349 8.66683 10.6667V8.66666L10.6668 8.66659Z"
                      fill="currentColor"
                    />
                  </svg>
                  Add collection
                </Button>
                <Menu>
                  <MenuTrigger
                    aria-label="Collection actions"
                    render={<Button variant="outline" size="icon" className="w-fit" />}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M1.33301 8C1.33301 7.2636 1.92996 6.66666 2.66634 6.66666C3.40272 6.66666 3.99967 7.2636 3.99967 8C3.99967 8.7364 3.40272 9.33333 2.66634 9.33333C1.92996 9.33333 1.33301 8.7364 1.33301 8ZM6.66634 8C6.66634 7.2636 7.26327 6.66666 7.99967 6.66666C8.73607 6.66666 9.33301 7.2636 9.33301 8C9.33301 8.7364 8.73607 9.33333 7.99967 9.33333C7.26327 9.33333 6.66634 8.7364 6.66634 8ZM11.9997 8C11.9997 7.2636 12.5966 6.66666 13.333 6.66666C14.0694 6.66666 14.6663 7.2636 14.6663 8C14.6663 8.7364 14.0694 9.33333 13.333 9.33333C12.5966 9.33333 11.9997 8.7364 11.9997 8Z"
                        fill="currentColor"
                      />
                    </svg>
                  </MenuTrigger>
                  <MenuPopup align="end" className="w-52">
                    <div {...getTriggerProps()}>
                      <MenuItem disabled>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M1.3335 7.99999C1.3335 4.31809 4.31826 1.33333 8.00016 1.33333C11.682 1.33333 14.6668 4.31809 14.6668 7.99999C14.6668 11.6819 11.682 14.6667 8.00016 14.6667C4.31826 14.6667 1.3335 11.6819 1.3335 7.99999ZM6.00016 11.3333C5.63197 11.3333 5.3335 11.0349 5.3335 10.6667C5.3335 10.2985 5.63197 9.99999 6.00016 9.99999H10.0002C10.3684 9.99999 10.6668 10.2985 10.6668 10.6667C10.6668 11.0349 10.3684 11.3333 10.0002 11.3333H6.00016ZM9.8049 7.80473L8.47156 9.13806C8.21123 9.39839 7.7891 9.39839 7.52876 9.13806L6.19542 7.80473C5.93508 7.54439 5.93508 7.12226 6.19542 6.86193C6.45578 6.60157 6.8779 6.60157 7.13823 6.86193L7.3335 7.05719V5.33333C7.3335 4.96513 7.63196 4.66666 8.00016 4.66666C8.36836 4.66666 8.66683 4.96513 8.66683 5.33333V7.05719L8.8621 6.86193C9.12243 6.60157 9.54456 6.60157 9.8049 6.86193C10.0652 7.12226 10.0652 7.54439 9.8049 7.80473Z"
                            fill="currentColor"
                          />
                        </svg>
                        Import collections
                      </MenuItem>
                    </div>
                    <div {...getTriggerProps()}>
                      <MenuItem disabled>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_692_37)">
                            <path
                              d="M10.6665 5.33334C10.6665 4.96515 10.368 4.66667 9.99984 4.66667C9.63164 4.66667 9.33317 4.96515 9.33317 5.33334C9.33317 6.87234 8.99264 7.82827 8.41037 8.41054C7.8281 8.99281 6.87217 9.33334 5.33317 9.33334C4.96498 9.33334 4.6665 9.63181 4.6665 10C4.6665 10.3682 4.96498 10.6667 5.33317 10.6667C6.87217 10.6667 7.8281 11.0072 8.41037 11.5895C8.99264 12.1717 9.33317 13.1277 9.33317 14.6667C9.33317 15.0349 9.63164 15.3333 9.99984 15.3333C10.368 15.3333 10.6665 15.0349 10.6665 14.6667C10.6665 13.1277 11.007 12.1717 11.5893 11.5895C12.1716 11.0072 13.1275 10.6667 14.6665 10.6667C15.0347 10.6667 15.3332 10.3682 15.3332 10C15.3332 9.63181 15.0347 9.33334 14.6665 9.33334C13.1275 9.33334 12.1716 8.99281 11.5893 8.41054C11.007 7.82827 10.6665 6.87234 10.6665 5.33334Z"
                              fill="currentColor"
                            />
                            <path
                              d="M4.99984 1.33334C4.99984 0.965152 4.70136 0.666672 4.33317 0.666672C3.96498 0.666672 3.6665 0.965152 3.6665 1.33334C3.6665 2.29363 3.45328 2.83293 3.14302 3.14319C2.83276 3.45345 2.29346 3.66667 1.33317 3.66667C0.964984 3.66667 0.666504 3.96515 0.666504 4.33334C0.666504 4.70153 0.964984 5.00001 1.33317 5.00001C2.29346 5.00001 2.83276 5.21323 3.14302 5.52349C3.45328 5.83375 3.6665 6.37305 3.6665 7.33334C3.6665 7.70154 3.96498 8.00001 4.33317 8.00001C4.70136 8.00001 4.99984 7.70154 4.99984 7.33334C4.99984 6.37305 5.21306 5.83375 5.52332 5.52349C5.83358 5.21323 6.37288 5.00001 7.33317 5.00001C7.70137 5.00001 7.99984 4.70153 7.99984 4.33334C7.99984 3.96515 7.70137 3.66667 7.33317 3.66667C6.37288 3.66667 5.83358 3.45345 5.52332 3.14319C5.21306 2.83293 4.99984 2.29363 4.99984 1.33334Z"
                              fill="currentColor"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_692_37">
                              <rect width="16" height="16" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        Suggest collections
                      </MenuItem>
                    </div>
                    <div {...getTriggerProps()}>
                      <MenuItem disabled>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M2.78927 4.93869C2.85378 4.90643 2.90608 4.85413 2.93834 4.78962L3.36828 3.92973C3.49112 3.68405 3.84173 3.68405 3.96457 3.92973L4.39451 4.78962C4.42677 4.85413 4.47908 4.90643 4.54358 4.93869L5.40348 5.36864C5.64916 5.49148 5.64916 5.84208 5.40348 5.96492L4.54358 6.39487C4.47908 6.42712 4.42677 6.47943 4.39451 6.54394L3.96457 7.40379C3.84172 7.64953 3.49112 7.64953 3.36828 7.40379L2.93834 6.54394C2.90608 6.47943 2.85378 6.42712 2.78927 6.39487L1.92938 5.96492C1.6837 5.84208 1.6837 5.49148 1.92938 5.36864L2.78927 4.93869Z"
                            fill="currentColor"
                          />
                          <path
                            d="M6.37277 2.48005C6.41885 2.45701 6.45621 2.41965 6.47925 2.37357L6.78635 1.75936C6.87408 1.58387 7.12455 1.58387 7.21228 1.75936L7.51935 2.37357C7.54241 2.41965 7.57981 2.45701 7.62588 2.48005L8.24008 2.78715C8.41555 2.87489 8.41555 3.12533 8.24008 3.21307L7.62588 3.52018C7.57981 3.54322 7.54241 3.58058 7.51935 3.62666L7.21228 4.24086C7.12455 4.41635 6.87408 4.41635 6.78635 4.24086L6.47925 3.62666C6.45621 3.58058 6.41885 3.54322 6.37277 3.52018L5.75857 3.21307C5.58308 3.12533 5.58308 2.87489 5.75857 2.78715L6.37277 2.48005Z"
                            fill="currentColor"
                          />
                          <path
                            d="M13.6617 1.42047C13.9819 1.60235 14.0939 2.00931 13.912 2.32944L10.8063 7.7956L10.9817 7.85939C11.9955 8.22839 12.8061 9.23406 12.6375 10.4353C12.4135 12.0307 11.7321 13.1821 10.4745 14.4665C10.2831 14.6621 9.99159 14.7207 9.73945 14.6145L5.97693 13.0301C5.90592 13.0002 5.87497 12.9165 5.90942 12.8476L6.4876 11.6912C6.54491 11.5766 6.4233 11.455 6.30869 11.5123L4.56456 12.3848C4.52974 12.4022 4.48905 12.4035 4.45317 12.3884L3.40696 11.9479C3.18079 11.8526 3.02523 11.6408 3.00202 11.3965C2.97881 11.1522 3.09171 10.9149 3.2959 10.7787C4.26743 10.1311 5.04421 9.49686 5.62774 8.57893C6.33206 7.47093 7.73059 6.67613 9.14832 7.19213L9.53559 7.33306L12.7527 1.67078C12.9346 1.35065 13.3416 1.23858 13.6617 1.42047Z"
                            fill="currentColor"
                          />
                        </svg>
                        Auto-organize
                      </MenuItem>
                    </div>
                    <div {...getTriggerProps()}>
                      <MenuItem disabled>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M14 10.1608C14 10.6975 14.0002 11.1405 13.9707 11.5013C13.9401 11.876 13.8745 12.2207 13.7097 12.5443C13.454 13.0459 13.0459 13.454 12.5443 13.7097C12.2207 13.8745 11.876 13.9401 11.5013 13.9707C11.1405 14.0002 10.6975 14 10.1608 14H5.83919C5.30254 14 4.8595 14.0002 4.4987 13.9707C4.12399 13.9401 3.77927 13.8745 3.45573 13.7097C2.95406 13.454 2.54601 13.0459 2.29037 12.5443C2.12551 12.2207 2.05991 11.876 2.0293 11.5013C1.99982 11.1405 1.99999 10.6975 2 10.1608V6H14V10.1608ZM9.7578 8.2422C9.52347 8.00787 9.1432 8.00787 8.90887 8.2422L8 9.15107L7.09113 8.2422C6.8568 8.00787 6.4765 8.00787 6.24219 8.2422C6.00787 8.47653 6.00787 8.8568 6.24219 9.09113L7.15107 10L6.24219 10.9089C6.00787 11.1432 6.00787 11.5235 6.24219 11.7578C6.4765 11.9921 6.8568 11.9921 7.09113 11.7578L8 10.8489L8.90887 11.7578C9.1432 11.9921 9.52347 11.9921 9.7578 11.7578C9.99213 11.5235 9.99213 11.1432 9.7578 10.9089L8.84893 10L9.7578 9.09113C9.99213 8.8568 9.99213 8.47653 9.7578 8.2422Z"
                            fill="currentColor"
                          />
                          <path
                            d="M13.9997 2C14.3679 2 14.6663 2.29848 14.6663 2.66667V4C14.6663 4.36819 14.3679 4.66667 13.9997 4.66667H1.99967C1.63149 4.66667 1.33301 4.36819 1.33301 4V2.66667C1.33301 2.29848 1.63149 2 1.99967 2H13.9997Z"
                            fill="currentColor"
                          />
                        </svg>
                        Review inactive
                      </MenuItem>
                    </div>
                    <div {...getTriggerProps()}>
                      <MenuItem disabled>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M5.96404 1C7.33522 1 8.57623 1.55709 9.47444 2.45802C10.0505 3.03579 10.4866 3.75609 10.7241 4.56018C11.5497 4.7952 12.2862 5.23805 12.8764 5.82996C13.7746 6.73089 14.33 7.97565 14.33 9.35097C14.33 10.7263 13.7746 11.9711 12.8764 12.872C11.9782 13.7729 10.7371 14.33 9.36596 14.33C7.99478 14.33 6.75377 13.7729 5.85556 12.872C5.27953 12.2942 4.84344 11.5739 4.60587 10.7698C3.78034 10.5348 3.04376 10.092 2.45363 9.50004C1.55542 8.59802 1 7.35327 1 5.97903C1 4.6037 1.55542 3.35895 2.45363 2.45802C3.35184 1.55709 4.59285 1 5.96404 1ZM10.9107 5.56774C10.9194 5.67981 10.9248 5.79297 10.927 5.90722V5.9083V5.91483V5.91592V5.92136V5.92571V5.92789V5.94095V5.94312V5.94639V5.95183V5.95291V5.95944V5.96053V5.96597V5.97032V5.9725V5.97903C10.927 7.35435 10.3716 8.59911 9.47336 9.50004C8.57515 10.401 7.33414 10.9581 5.96295 10.9581H5.95753H5.95427H5.9521H5.94668H5.94126H5.938H5.93583H5.93041H5.92932H5.92498H5.92173H5.91956H5.91414H5.91305C5.81216 10.957 5.71128 10.9526 5.61256 10.9461C5.81867 11.4335 6.11699 11.8731 6.48474 12.242C7.2224 12.9819 8.24103 13.4389 9.36705 13.4389C10.492 13.4389 11.5117 12.9808 12.2483 12.242C12.9859 11.5021 13.4416 10.4804 13.4416 9.35206C13.4416 8.22373 12.9859 7.20094 12.2483 6.46105C11.8686 6.08022 11.4151 5.77447 10.9107 5.56774ZM9.36596 4.37194H9.37139H9.37464H9.37681H9.38224H9.38766H9.39091H9.39308H9.39851H9.39959H9.40393H9.40719H9.40936H9.41478H9.41586C9.51675 4.37303 9.61655 4.37738 9.71635 4.38391C9.51024 3.89645 9.21192 3.45687 8.84418 3.08801C8.10651 2.34812 7.08789 1.89113 5.96187 1.89113C4.83693 1.89113 3.81722 2.34921 3.08064 3.08801C2.34298 3.82791 1.88736 4.84961 1.88736 5.97794C1.88736 7.10627 2.34407 8.12906 3.08064 8.86895C3.45924 9.24869 3.91268 9.55444 4.41711 9.76226C4.40844 9.65019 4.40301 9.53703 4.40084 9.42278V9.4217V9.41517V9.41408V9.40864V9.40429V9.40211V9.38905V9.38688V9.38361V9.37817V9.37708V9.37056V9.36947V9.36403V9.35968V9.3575V9.35097C4.40084 7.97565 4.95626 6.73089 5.85447 5.82996C6.75485 4.92904 7.99586 4.37194 9.36596 4.37194Z"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="0.2"
                          />
                        </svg>
                        Merge collections
                      </MenuItem>
                    </div>
                  </MenuPopup>
                </Menu>
              </div>
            </div>

            <div className="border-border mt-4 flex flex-wrap items-center gap-5.5 border-t pt-4">
              {stats.map((stat, index) => (
                <div key={stat.label} className="contents">
                  {index > 0 && <div className="bg-border h-7 w-px" aria-hidden />}
                  <Stat label={stat.label} value={stat.value} />
                </div>
              ))}
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4">
              <h4 className="text-base font-[550]">
                <span className="text-foreground/95 inline-flex items-center">
                  Your collections
                  <span className="text-muted-foreground/90 ml-1 font-medium tracking-wide">
                    ({collections.length})
                  </span>
                </span>
              </h4>

              <div className="flex items-center gap-2">
                <InputGroup className="w-full max-w-[320px]">
                  <InputGroupInput
                    aria-label="Search collections"
                    placeholder="Search collections"
                    type="search"
                    autoComplete="off"
                  />
                  <InputGroupAddon>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M13.3333 13.3333L10.751 10.751M10.751 10.751C11.6257 9.87633 12.1667 8.668 12.1667 7.33333C12.1667 4.66396 10.0027 2.5 7.33333 2.5C4.66396 2.5 2.5 4.66396 2.5 7.33333C2.5 10.0027 4.66396 12.1667 7.33333 12.1667C8.668 12.1667 9.87633 11.6257 10.751 10.751Z"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </InputGroupAddon>
                </InputGroup>
                <SelectionModeButton selectionMode={false} />
                <Button variant="outline" size="default">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4.55229 2C3.1427 2 2 3.1427 2 4.55229C2 5.22919 2.2689 5.87837 2.74755 6.35702L5.60947 9.21893C5.85953 9.469 6 9.80813 6 10.1617V13.3713C6 14.3023 6.9298 14.9467 7.80147 14.6198L9.1348 14.1198C9.65527 13.9246 10 13.4271 10 12.8713V10.1617C10 9.80813 10.1405 9.469 10.3905 9.21893L13.2525 6.35702C13.7311 5.87837 14 5.22919 14 4.55229C14 3.1427 12.8573 2 11.4477 2H4.55229Z"
                      fill="currentColor"
                    />
                  </svg>
                  Filter
                </Button>
              </div>
            </div>

            <div className="pt-0.5">
              {collections.map((collection) => (
                <CollectionRow key={collection.name} collection={collection} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CollectionRow({collection}: {collection: CollectionPageItem}) {
  const pinLabel = collection.isPinned ? "Unpin" : "Pin";
  const slug = collection.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <ContextMenu>
      <ContextMenuTrigger className="border-border/80 hover:bg-muted/80 focus-visible:bg-muted! relative grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 transition-none! outline-none last:border-b-0 md:grid-cols-[minmax(0,1fr)_90px_auto] xl:grid-cols-[minmax(0,1fr)_280px_90px_auto]">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className="ring-border/70 ring-offset-background size-2.5 shrink-0 rounded-full ring-2 ring-offset-2"
            style={{backgroundColor: collection.color ?? "#70D6FF"}}
          />
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="text-foreground text-sm font-medium">{collection.name}</span>
            <span className="text-muted-foreground text-sm">/{slug}</span>
            {collection.isPinned && (
              <span
                className="text-muted-foreground/80 inline-flex size-5 items-center justify-center rounded-full"
                aria-label="Pinned collection"
                title="Pinned collection">
                <PinIcon />
              </span>
            )}
          </div>
        </div>

        <div className="text-muted-foreground hidden min-w-0 text-sm xl:block">
          <p className="truncate">{collection.description ?? "No description"}</p>
        </div>

        <div className="text-muted-foreground hidden min-w-0 text-left text-sm md:block">
          {collection.itemCount} items
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-1.5">
          <Menu>
            <MenuTrigger
              aria-label={`More options for ${collection.name}`}
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="data-pressed:bg-accent-foreground [:hover,[data-pressed]]:bg-muted-strong! hit-area-2! size-7"
                  onClick={(event) => event.stopPropagation()}
                />
              }>
              <MoreIcon />
            </MenuTrigger>
            <MenuPopup align="end" className="w-fit">
              <CollectionMenuItems pinLabel={pinLabel} ItemComponent={MenuItem} />
            </MenuPopup>
          </Menu>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-fit">
        <CollectionMenuItems pinLabel={pinLabel} ItemComponent={ContextMenuItem} />
      </ContextMenuContent>
    </ContextMenu>
  );
}

function CollectionMenuItems({
  pinLabel,
  ItemComponent,
}: {
  pinLabel: string;
  ItemComponent: (props: {children: ReactNode; variant?: "default" | "destructive"}) => ReactNode;
}) {
  return (
    <>
      <ItemComponent>
        <OpenIcon />
        Open
      </ItemComponent>
      <ItemComponent>
        <EditIcon />
        Edit
      </ItemComponent>
      <ItemComponent>
        <CopyIcon />
        Copy
      </ItemComponent>
      <ItemComponent>
        {pinLabel === "Unpin" ? <UnpinIcon /> : <PinIcon />}
        {pinLabel}
      </ItemComponent>
      <MenuSeparator />
      <ItemComponent variant="destructive">
        <DeleteIcon />
        Delete
      </ItemComponent>
    </>
  );
}

function OpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.00039 2.66667C10.4959 2.66669 12.9312 4.10717 14.6101 6.8632C15.0346 7.56 15.0346 8.44 14.6101 9.1368C12.9312 11.8929 10.4959 13.3333 8.00039 13.3333C5.50483 13.3333 3.06951 11.8928 1.39061 9.13673C0.966152 8.43993 0.966146 7.55993 1.39062 6.86313C3.06951 4.10709 5.50483 2.66665 8.00039 2.66667ZM5.5837 8C5.5837 6.66531 6.66568 5.58333 8.00039 5.58333C9.33506 5.58333 10.4171 6.66531 10.4171 8C10.4171 9.33467 9.33506 10.4167 8.00039 10.4167C6.66568 10.4167 5.5837 9.33467 5.5837 8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.66699 3.83333C2.66699 2.45262 3.78628 1.33333 5.16699 1.33333H10.8337C12.2144 1.33333 13.3337 2.45262 13.3337 3.83333V8.44493C12.4141 8.11113 11.3438 8.31293 10.6063 9.0504L8.10633 11.5504C7.82506 11.8317 7.66699 12.2133 7.66699 12.6111V14.1666C7.66699 14.3419 7.69706 14.5103 7.75239 14.6667H5.16699C3.78628 14.6667 2.66699 13.5474 2.66699 12.1667V3.83333ZM5.33366 4.5C5.33366 4.22386 5.55752 4 5.83366 4H10.167C10.4431 4 10.667 4.22386 10.667 4.5C10.667 4.77614 10.4431 5 10.167 5H5.83366C5.55752 5 5.33366 4.77614 5.33366 4.5ZM5.83366 6.66667C5.55752 6.66667 5.33366 6.89053 5.33366 7.16667C5.33366 7.4428 5.55752 7.66667 5.83366 7.66667H7.50033C7.77646 7.66667 8.00033 7.4428 8.00033 7.16667C8.00033 6.89053 7.77646 6.66667 7.50033 6.66667H5.83366Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.869 10.4646C12.6347 10.2303 12.2549 10.2303 12.0205 10.4646L9.66699 12.8182V13.6666H10.5155L12.869 11.3131C13.1033 11.0788 13.1033 10.6989 12.869 10.4646ZM11.3135 9.75753C11.9383 9.13267 12.9513 9.13267 13.5761 9.75753C14.2009 10.3823 14.2009 11.3953 13.5761 12.0202L11.0761 14.5202C10.9823 14.6139 10.8551 14.6666 10.7225 14.6666H9.16699C8.89086 14.6666 8.66699 14.4427 8.66699 14.1666V12.6111C8.66699 12.4785 8.71966 12.3513 8.81346 12.2575L11.3135 9.75753Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.3787 2.66667H10.8337C12.2144 2.66667 13.3337 3.78595 13.3337 5.16667V12.1667C13.3337 13.5474 12.2144 14.6667 10.8337 14.6667H5.16699C3.78628 14.6667 2.66699 13.5474 2.66699 12.1667V5.16667C2.66699 3.78595 3.78628 2.66667 5.16699 2.66667H5.62201C6.04117 1.8737 6.87433 1.33333 7.83366 1.33333H8.16699C9.12633 1.33333 9.95946 1.8737 10.3787 2.66667ZM9.66699 3.83333C9.66699 3.00491 8.99539 2.33333 8.16699 2.33333H7.83366C7.00526 2.33333 6.33366 3.00491 6.33366 3.83333V4.16667C6.33366 4.25871 6.40828 4.33333 6.50033 4.33333H9.50033C9.59239 4.33333 9.66699 4.25871 9.66699 4.16667V3.83333Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.83366 1.33334C5.45295 1.33334 4.33366 2.45262 4.33366 3.83334V4.66464C4.33366 5.81391 3.87711 6.91614 3.06446 7.72874L2.81344 7.9798C2.71967 8.07354 2.66699 8.20074 2.66699 8.33334V10.1667C2.66699 10.2993 2.71967 10.4265 2.81344 10.5202C2.90721 10.614 3.03439 10.6667 3.16699 10.6667H7.50033V14.1667C7.50033 14.4428 7.72419 14.6667 8.00033 14.6667C8.27646 14.6667 8.50033 14.4428 8.50033 14.1667V10.6667H12.8337C13.1098 10.6667 13.3337 10.4428 13.3337 10.1667V8.33334C13.3337 8.20074 13.281 8.07354 13.1872 7.9798L12.9362 7.72874C12.1235 6.91614 11.667 5.81391 11.667 4.66464V3.83334C11.667 2.45262 10.5477 1.33334 9.16699 1.33334H6.83366Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UnpinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.87621 1.18107C2.14427 0.928813 2.56657 0.941759 2.81892 1.20971L4.76553 3.27807L4.76619 3.27677L11.7212 10.6667H11.72L13.4856 12.5431C13.7379 12.8111 13.725 13.2334 13.4569 13.4857C13.1888 13.7381 12.7666 13.7252 12.5142 13.4571L9.88791 10.6667H8.66657V13.4213C8.66657 13.4729 8.6545 13.5242 8.63144 13.5704L8.14897 14.5353C8.08757 14.658 7.91224 14.658 7.85084 14.5353L7.36837 13.5704C7.3453 13.5241 7.33324 13.4729 7.33324 13.4213V10.6667H3.99991C3.29379 10.6666 2.60161 10.0711 2.71996 9.24093L2.76749 8.963C3.01556 7.7056 3.70633 6.61008 4.66657 5.83992L5.06175 5.53914L1.84757 2.12377C1.59541 1.85565 1.60817 1.43335 1.87621 1.18107Z"
        fill="currentColor"
      />
      <path
        d="M8.6665 1.3334C10.1391 1.33356 11.3331 2.52748 11.3332 4.00007V5.83991C12.3636 6.66634 13.0838 7.86746 13.2798 9.24092C13.3297 9.59106 13.2338 9.89852 13.0552 10.1381L5.47705 2.086C5.95713 1.62051 6.61172 1.33348 7.33317 1.3334H8.6665Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DeleteIcon() {
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

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.50016 6.8335C1.85583 6.8335 1.3335 7.35583 1.3335 8.00016C1.3335 8.6445 1.85583 9.16683 2.50016 9.16683C3.1445 9.16683 3.66683 8.6445 3.66683 8.00016C3.66683 7.35583 3.1445 6.8335 2.50016 6.8335Z"
        fill="currentColor"
      />
      <path
        d="M8.00016 6.8335C7.35583 6.8335 6.8335 7.35583 6.8335 8.00016C6.8335 8.6445 7.35583 9.16683 8.00016 9.16683C8.6445 9.16683 9.16683 8.6445 9.16683 8.00016C9.16683 7.35583 8.6445 6.8335 8.00016 6.8335Z"
        fill="currentColor"
      />
      <path
        d="M13.5002 6.8335C12.8558 6.8335 12.3335 7.35583 12.3335 8.00016C12.3335 8.6445 12.8558 9.16683 13.5002 9.16683C14.1445 9.16683 14.6668 8.6445 14.6668 8.00016C14.6668 7.35583 14.1445 6.8335 13.5002 6.8335Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[12px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground font-mono text-sm font-medium">{value}</span>
    </div>
  );
}
