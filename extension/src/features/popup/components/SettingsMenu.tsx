import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { cn } from "@/lib/utils";
import { TOBIRA_APP_URL } from "@/lib/tobira-config";
import type { TobiraConnectionUser } from "@/lib/tobira-connection-storage";
import { Avatar as UserAvatar } from "../../../../../app/src/components/ui/app/avatar";

function openTobira(path = "") {
  void browser.tabs.create({ url: `${TOBIRA_APP_URL}${path}` });
}

export function SettingsMenu({
  connectionUser,
  onDisconnect,
  isDisconnecting,
}: {
  connectionUser: TobiraConnectionUser;
  onDisconnect: () => void;
  isDisconnecting: boolean;
}) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Settings"
            className="size-6 data-popup-open:bg-accent"
          />
        }
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.625 2.069a1.667 1.667 0 0 1 2.75 0l.258.387c.266.399.75.591 1.217.484l.255-.059a1.667 1.667 0 0 1 1.565 2.015l-.059.254c-.107.467.085.952.484 1.218l.387.258a1.667 1.667 0 0 1 0 2.75l-.387.258a1.167 1.167 0 0 0-.484 1.217l.059.255a1.667 1.667 0 0 1-2.015 1.565l-.255-.059a1.167 1.167 0 0 0-1.217.484l-.258.387a1.667 1.667 0 0 1-2.75 0l-.258-.387a1.167 1.167 0 0 0-1.217-.484l-.255.059A1.667 1.667 0 0 1 3.33 11.19l.059-.255a1.167 1.167 0 0 0-.484-1.217l-.387-.258a1.667 1.667 0 0 1 0-2.75l.387-.258a1.167 1.167 0 0 0 .484-1.218l-.059-.254A1.667 1.667 0 0 1 5.345 3.33l.255.059a1.167 1.167 0 0 0 1.217-.484zM8 5.917A2.083 2.083 0 1 0 8 10.083 2.083 2.083 0 0 0 8 5.917"
            fill="currentColor"
          />
        </svg>
      </MenuTrigger>
      <MenuPopup align="end" sideOffset={6} className="min-w-44 max-w-[250px]">
        <div className={cn("flex items-center gap-2 px-1 py-1")}>
          <UserAvatar
            email={connectionUser.email}
            label={connectionUser.email}
            size={24}
            animated={false}
            showInitials={false}
            showFrame={false}
            showUserIcon
          />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {connectionUser.email}
          </p>
        </div>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem onClick={() => openTobira()}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M5.83913 2H6C6.36819 2 6.66667 2.29848 6.66667 2.66667C6.66667 3.03486 6.36819 3.33333 6 3.33333H5.86667C5.29561 3.33333 4.90742 3.33385 4.60736 3.35837C4.31508 3.38225 4.16561 3.42553 4.06135 3.47866C3.81047 3.60649 3.60649 3.81047 3.47866 4.06135C3.42553 4.16561 3.38225 4.31508 3.35837 4.60736C3.33385 4.90742 3.33333 5.29561 3.33333 5.86667V10.1333C3.33333 10.7044 3.33385 11.0926 3.35837 11.3927C3.38225 11.6849 3.42553 11.8344 3.47866 11.9387C3.60649 12.1895 3.81047 12.3935 4.06135 12.5213C4.16561 12.5745 4.31508 12.6177 4.60736 12.6416C4.90742 12.6661 5.29561 12.6667 5.86667 12.6667H10.1333C10.7044 12.6667 11.0926 12.6661 11.3927 12.6416C11.6849 12.6177 11.8344 12.5745 11.9387 12.5213C12.1895 12.3935 12.3935 12.1895 12.5213 11.9387C12.5745 11.8344 12.6177 11.6849 12.6416 11.3927C12.6661 11.0926 12.6667 10.7044 12.6667 10.1333V10C12.6667 9.6318 12.9651 9.33333 13.3333 9.33333C13.7015 9.33333 14 9.6318 14 10V10.1609C14 10.6975 14 11.1404 13.9705 11.5012C13.9399 11.8759 13.8742 12.2204 13.7093 12.544C13.4537 13.0457 13.0457 13.4537 12.544 13.7093C12.2204 13.8742 11.8759 13.9399 11.5012 13.9705C11.1404 14 10.6975 14 10.1609 14H5.83912C5.30248 14 4.85957 14 4.49878 13.9705C4.12405 13.9399 3.77958 13.8742 3.45603 13.7093C2.95426 13.4537 2.54631 13.0457 2.29065 12.544C2.12579 12.2204 2.06008 11.8759 2.02946 11.5012C1.99999 11.1404 1.99999 10.6975 2 10.1609V5.83913C1.99999 5.30249 1.99999 4.85958 2.02946 4.49878C2.06008 4.12405 2.12579 3.77958 2.29065 3.45603C2.54631 2.95426 2.95426 2.54631 3.45603 2.29065C3.77958 2.12579 4.12405 2.06008 4.49878 2.02946C4.85958 1.99999 5.30249 1.99999 5.83913 2ZM9.33333 3.33333C8.96513 3.33333 8.66667 3.03486 8.66667 2.66667C8.66667 2.29848 8.96513 2 9.33333 2H13.3333C13.7015 2 14 2.29848 14 2.66667V6.66667C14 7.03487 13.7015 7.33333 13.3333 7.33333C12.9651 7.33333 12.6667 7.03487 12.6667 6.66667V4.27615L7.80473 9.13807C7.5444 9.3984 7.12227 9.3984 6.86193 9.13807C6.60158 8.87773 6.60158 8.4556 6.86193 8.19527L11.7239 3.33333H9.33333Z"
                fill="currentColor"
              />
            </svg>
            Open Tobira
          </MenuItem>
          <MenuItem
            variant="destructive"
            disabled={isDisconnecting}
            onClick={() => void onDisconnect()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.667 2A2.667 2.667 0 0 0 2 4.667v6.666A2.667 2.667 0 0 0 4.667 14H7.5a.667.667 0 1 0 0-1.333H4.667a1.333 1.333 0 0 1-1.334-1.334V4.667c0-.737.597-1.334 1.334-1.334H7.5A.667.667 0 1 0 7.5 2H4.667ZM9.862 4.529a.667.667 0 0 0 0 .942L11.724 7.333H5.833a.667.667 0 1 0 0 1.334h5.891l-1.862 1.862a.667.667 0 1 0 .943.942l3-3a.667.667 0 0 0 0-.942l-3-3a.667.667 0 0 0-.943 0Z"
                fill="currentColor"
              />
            </svg>
            {isDisconnecting ? "Disconnecting..." : "Disconnect Tobira"}
          </MenuItem>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
