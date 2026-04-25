import React from "react";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
  MenuRadioGroup,
  MenuRadioItem,
  MenuCheckboxItem,
} from "@/components/coss-ui/menu";
import {buttonVariants} from "../../shadcn/button";
import {cn} from "@/lib/utils";

interface SidebarSectionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectionMode: boolean;
  onSelectionModeChange: (checked: boolean) => void;
  selectValue: string;
  onSelectValueChange: (value: string) => void;
  ariaLabel: string;
  triggerClassName: string;
}

export function SidebarSectionMenu({
  open,
  onOpenChange,
  selectionMode,
  onSelectionModeChange,
  selectValue,
  onSelectValueChange,
  ariaLabel,
  triggerClassName,
}: SidebarSectionMenuProps) {
  return (
    <Menu open={open} onOpenChange={onOpenChange}>
      <MenuTrigger
        type="button"
        onClick={(e) => e.stopPropagation()}
        aria-label={ariaLabel}
        className={cn(
          buttonVariants({variant: "ghost", size: "icon-xs"}),
          "text-muted-foreground hover:bg-foreground/5",
          "pointer-events-none opacity-0 transition-opacity duration-150 ease-out",
          triggerClassName,
        )}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8.00033 9.33332C8.73671 9.33332 9.33366 8.73637 9.33366 7.99999C9.33366 7.26361 8.73671 6.66666 8.00033 6.66666C7.26395 6.66666 6.66699 7.26361 6.66699 7.99999C6.66699 8.73637 7.26395 9.33332 8.00033 9.33332Z"
            fill="currentColor"
          />
          <path
            d="M12.6663 9.33332C13.4027 9.33332 13.9997 8.73637 13.9997 7.99999C13.9997 7.26361 13.4027 6.66666 12.6663 6.66666C11.93 6.66666 11.333 7.26361 11.333 7.99999C11.333 8.73637 11.93 9.33332 12.6663 9.33332Z"
            fill="currentColor"
          />
          <path
            d="M3.33333 9.33332C4.06971 9.33332 4.66667 8.73637 4.66667 7.99999C4.66667 7.26361 4.06971 6.66666 3.33333 6.66666C2.59695 6.66666 2 7.26361 2 7.99999C2 8.73637 2.59695 9.33332 3.33333 9.33332Z"
            fill="currentColor"
          />
        </svg>
      </MenuTrigger>
      <MenuPopup align="center" className="w-40">
        <MenuCheckboxItem checked={selectionMode} onCheckedChange={onSelectionModeChange}>
          Select
        </MenuCheckboxItem>

        <MenuSub disabled>
          <MenuSubTrigger>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.08269 2.00513C6.44803 2.05079 6.7072 2.38399 6.66152 2.74933L6.42185 4.66664H10.4115L10.6718 2.58395C10.7175 2.21861 11.0507 1.95945 11.416 2.00513C11.7814 2.05079 12.0405 2.38399 11.9949 2.74933L11.7552 4.66664H13.3333C13.7015 4.66664 14 4.96512 14 5.33331C14 5.7015 13.7015 5.99997 13.3333 5.99997H11.5885L11.0885 9.99999H13.3333C13.7015 9.99999 14 10.2985 14 10.6667C14 11.0349 13.7015 11.3333 13.3333 11.3333H10.9219L10.6615 13.416C10.6159 13.7813 10.2827 14.0405 9.91733 13.9949C9.55193 13.9492 9.2928 13.616 9.33847 13.2506L9.57813 11.3333H5.58852L5.32819 13.416C5.28252 13.7813 4.94933 14.0405 4.58398 13.9949C4.21863 13.9492 3.95948 13.616 4.00515 13.2506L4.24481 11.3333H2.66667C2.29848 11.3333 2 11.0349 2 10.6667C2 10.2985 2.29848 9.99999 2.66667 9.99999H4.41148L4.91148 5.99997H2.66667C2.29848 5.99997 2 5.7015 2 5.33331C2 4.96512 2.29848 4.66664 2.66667 4.66664H5.07815L5.33848 2.58395C5.38415 2.21861 5.71734 1.95945 6.08269 2.00513ZM6.25519 5.99997L5.75519 9.99999H9.7448L10.2448 5.99997H6.25519Z"
                fill="currentColor"
              />
            </svg>
            Show
          </MenuSubTrigger>
          <MenuSubPopup className="w-44">
            <MenuRadioGroup value={selectValue} onValueChange={onSelectValueChange}>
              <MenuRadioItem value="5">5 items</MenuRadioItem>
              <MenuRadioItem value="10">10 items</MenuRadioItem>
              <MenuRadioItem value="15">15 items</MenuRadioItem>
              <MenuRadioItem value="20">20 items</MenuRadioItem>
              <MenuRadioItem value="50">50 items</MenuRadioItem>
              <MenuRadioItem value="all">All items</MenuRadioItem>
            </MenuRadioGroup>
          </MenuSubPopup>
        </MenuSub>
        <MenuSeparator />
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
              d="M14.6663 8.00001C14.6663 4.31811 11.6815 1.33334 7.99967 1.33334C4.31777 1.33334 1.33301 4.31811 1.33301 8.00001C1.33301 11.6819 4.31777 14.6667 7.99967 14.6667C11.6815 14.6667 14.6663 11.6819 14.6663 8.00001ZM5.52827 6.86194C5.26792 7.12228 5.26792 7.54441 5.52827 7.80474C5.78862 8.06508 6.21073 8.06508 6.47108 7.80474L7.33301 6.94281V10.6667C7.33301 11.0349 7.63147 11.3333 7.99967 11.3333C8.36787 11.3333 8.66634 11.0349 8.66634 10.6667V6.94281L9.52827 7.80474C9.78861 8.06508 10.2107 8.06508 10.4711 7.80474C10.7314 7.54441 10.7314 7.12228 10.4711 6.86194L8.47107 4.86194C8.21074 4.60159 7.78861 4.60159 7.52827 4.86194L5.52827 6.86194Z"
              fill="currentColor"
            />
          </svg>
          Move Up
        </MenuItem>
        <MenuItem disabled>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="rotate-180">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M14.6663 8.00001C14.6663 4.31811 11.6815 1.33334 7.99967 1.33334C4.31777 1.33334 1.33301 4.31811 1.33301 8.00001C1.33301 11.6819 4.31777 14.6667 7.99967 14.6667C11.6815 14.6667 14.6663 11.6819 14.6663 8.00001ZM5.52827 6.86194C5.26792 7.12228 5.26792 7.54441 5.52827 7.80474C5.78862 8.06508 6.21073 8.06508 6.47108 7.80474L7.33301 6.94281V10.6667C7.33301 11.0349 7.63147 11.3333 7.99967 11.3333C8.36787 11.3333 8.66634 11.0349 8.66634 10.6667V6.94281L9.52827 7.80474C9.78861 8.06508 10.2107 8.06508 10.4711 7.80474C10.7314 7.54441 10.7314 7.12228 10.4711 6.86194L8.47107 4.86194C8.21074 4.60159 7.78861 4.60159 7.52827 4.86194L5.52827 6.86194Z"
              fill="currentColor"
            />
          </svg>
          Move Down
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
