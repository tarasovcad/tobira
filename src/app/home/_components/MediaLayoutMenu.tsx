"use client";

import {Button} from "@/components/coss-ui/button";
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/coss-ui/menu";

import {useMediaLayoutStore} from "@/store/use-media-layout";

export function MediaLayoutMenu() {
  const {gapSize, setGapSize, columnSize, setColumnSize, borderRadius, setBorderRadius} =
    useMediaLayoutStore();

  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" size="icon-sm" />}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.00195 3.9998C2.00195 2.89615 2.89664 2.00146 4.00029 2.00146H5.33362C6.43727 2.00146 7.33195 2.89615 7.33195 3.9998V5.33313C7.33195 6.43678 6.43727 7.3315 5.33362 7.3315H4.00029C2.89664 7.3315 2.00195 6.43678 2.00195 5.33313V3.9998Z"
            fill="currentColor"
          />
          <path
            d="M2.00195 10.6663C2.00195 9.56264 2.89664 8.66797 4.00029 8.66797H5.33362C6.43727 8.66797 7.33195 9.56264 7.33195 10.6663V11.9996C7.33195 13.1032 6.43727 13.998 5.33362 13.998H4.00029C2.89664 13.998 2.00195 13.1032 2.00195 11.9996V10.6663Z"
            fill="currentColor"
          />
          <path
            d="M8.66797 3.9998C8.66797 2.89615 9.56264 2.00146 10.6663 2.00146H11.9996C13.1033 2.00146 13.998 2.89615 13.998 3.9998V5.33313C13.998 6.43678 13.1033 7.3315 11.9996 7.3315H10.6663C9.56264 7.3315 8.66797 6.43678 8.66797 5.33313V3.9998Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.333 8.66797C9.8611 8.66797 8.66797 9.8611 8.66797 11.333C8.66797 12.8048 9.8611 13.998 11.333 13.998C12.8048 13.998 13.998 12.8048 13.998 11.333C13.998 9.8611 12.8048 8.66797 11.333 8.66797ZM9.99797 11.333C9.99797 10.5956 10.5957 9.99797 11.333 9.99797C12.0703 9.99797 12.668 10.5956 12.668 11.333C12.668 12.0702 12.0703 12.668 11.333 12.668C10.5957 12.668 9.99797 12.0702 9.99797 11.333Z"
            fill="currentColor"
          />
        </svg>
      </MenuTrigger>
      <MenuPopup align="start" className="w-56">
        <MenuSub>
          <MenuSubTrigger>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.24168 2.00003C4.71142 1.99974 4.31764 1.99953 3.97654 2.09092C3.0563 2.3375 2.3375 3.0563 2.09092 3.97654C1.99953 4.31764 1.99974 4.71142 2.00003 5.24168L2.00006 5.3334C2.00006 5.70158 2.29854 6.00006 2.66673 6.00006H6.66673C7.03493 6.00006 7.3334 5.70158 7.3334 5.3334V2.66673C7.3334 2.29854 7.03493 2.00006 6.66673 2.00006L5.24168 2.00003Z"
                fill="currentColor"
              />
              <path
                d="M13.4328 10.019C13.371 10.0047 13.3201 10.0017 13.2953 10.0007C13.2753 9.99993 13.255 10 13.2489 10H13.2477H9.33366C8.96546 10 8.66699 10.2985 8.66699 10.6667V13.3333C8.66699 13.7015 8.96546 14 9.33366 14H10.8329C11.2947 14.0003 11.6373 14.0004 11.9365 13.931C12.9275 13.701 13.7013 12.9272 13.9313 11.9361C14.0007 11.6369 14.0006 11.2943 14.0003 10.8326V10.7527V10.7514C14.0003 10.7453 14.0004 10.725 13.9996 10.7051C13.9986 10.6803 13.9957 10.6293 13.9813 10.5676C13.9181 10.2951 13.7053 10.0822 13.4328 10.019Z"
                fill="currentColor"
              />
              <path
                d="M2.66667 7.3335C2.29848 7.3335 2 7.63196 2 8.00016V10.161C1.99999 10.6977 1.99999 11.1406 2.02946 11.5014C2.06008 11.8761 2.12579 12.2206 2.29065 12.5442C2.54631 13.0459 2.95426 13.4538 3.45603 13.7095C3.77958 13.8744 4.12405 13.9401 4.49878 13.9707C4.85959 14.0002 5.30249 14.0002 5.83915 14.0002H6.66667C7.03487 14.0002 7.33333 13.7017 7.33333 13.3335V8.00016C7.33333 7.63196 7.03487 7.3335 6.66667 7.3335H2.66667Z"
                fill="currentColor"
              />
              <path
                d="M12.5443 2.29065C12.2207 2.12579 11.8763 2.06008 11.5015 2.02946C11.1407 1.99999 10.6979 1.99999 10.1612 2H9.33366C8.96546 2 8.66699 2.29848 8.66699 2.66667V8C8.66699 8.3682 8.96546 8.66667 9.33366 8.66667H13.3337C13.7019 8.66667 14.0003 8.3682 14.0003 8V5.83913C14.0003 5.30249 14.0003 4.85958 13.9709 4.49878C13.9403 4.12405 13.8745 3.77958 13.7097 3.45603C13.454 2.95426 13.0461 2.54631 12.5443 2.29065Z"
                fill="currentColor"
              />
            </svg>
            Grid Gap Size
          </MenuSubTrigger>
          <MenuSubPopup>
            <MenuRadioGroup value={gapSize} onValueChange={(v) => setGapSize(v)}>
              <MenuRadioItem value="none">None</MenuRadioItem>
              <MenuRadioItem value="small">Small</MenuRadioItem>
              <MenuRadioItem value="medium">Medium</MenuRadioItem>
              <MenuRadioItem value="large">Large</MenuRadioItem>
            </MenuRadioGroup>
          </MenuSubPopup>
        </MenuSub>

        <MenuSub>
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
                d="M2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333C12.6667 8.5658 12.2486 9.70067 11.5466 10.6037L13.8046 12.8618C14.0649 13.1221 14.0649 13.5443 13.8046 13.8046C13.5443 14.0649 13.1221 14.0649 12.8618 13.8046L10.6037 11.5466C9.70067 12.2486 8.5658 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333ZM8 5.33333C8 4.96515 7.70153 4.66667 7.33333 4.66667C6.96513 4.66667 6.66667 4.96515 6.66667 5.33333V6.66667H5.33333C4.96515 6.66667 4.66667 6.96513 4.66667 7.33333C4.66667 7.70153 4.96515 8 5.33333 8H6.66667V9.33333C6.66667 9.70153 6.96513 10 7.33333 10C7.70153 10 8 9.70153 8 9.33333V8H9.33333C9.70153 8 10 7.70153 10 7.33333C10 6.96513 9.70153 6.66667 9.33333 6.66667H8V5.33333Z"
                fill="currentColor"
              />
            </svg>
            Column Size
          </MenuSubTrigger>
          <MenuSubPopup>
            <MenuRadioGroup value={columnSize} onValueChange={(v) => setColumnSize(v)}>
              <MenuRadioItem value="s">S</MenuRadioItem>
              <MenuRadioItem value="m">M</MenuRadioItem>
              <MenuRadioItem value="l">L</MenuRadioItem>
              <MenuRadioItem value="xl">XL</MenuRadioItem>
            </MenuRadioGroup>
          </MenuSubPopup>
        </MenuSub>

        <MenuSub>
          <MenuSubTrigger>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13.3337 2.6665H11.2003C8.21339 2.6665 6.71993 2.6665 5.57905 3.2478C4.57551 3.75912 3.75961 4.57502 3.24829 5.57856C2.66699 6.71944 2.66699 8.2129 2.66699 11.1998V13.3332"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            Card Border Radius
          </MenuSubTrigger>
          <MenuSubPopup>
            <MenuRadioGroup value={borderRadius} onValueChange={(v) => setBorderRadius(v)}>
              <MenuRadioItem value="sharp">Sharp</MenuRadioItem>
              <MenuRadioItem value="rounded">Rounded</MenuRadioItem>
              <MenuRadioItem value="pill">Pill</MenuRadioItem>
            </MenuRadioGroup>
          </MenuSubPopup>
        </MenuSub>
      </MenuPopup>
    </Menu>
  );
}
