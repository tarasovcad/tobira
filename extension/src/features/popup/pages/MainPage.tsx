import {Button} from "@/components/ui/button";
import {TOBIRA_APP_URL} from "@/lib/tobira-config";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import {cn} from "@/lib/utils";
import type {TobiraConnectionUser} from "@/lib/tobira-connection-storage";
import {Avatar as UserAvatar} from "../../../../../app/src/components/ui/app/avatar";
import {Separator} from "@/components/ui/separator";
import {CloseButton} from "../components/CloseButton";
import {ProviderRow} from "../components/ProviderRow";
import {PROVIDERS, type ProviderId} from "../providers/providers";

function openTobira(path = "") {
  void browser.tabs.create({url: `${TOBIRA_APP_URL}${path}`});
}

export function MainPage({
  activeProviderId,
  connectedProviderIds,
  onCloseProvider,
  onConnectProvider,
  onSelectProvider,
  onDisconnect,
  connectionUser,
  isDisconnecting,
}: {
  activeProviderId: ProviderId | null;
  connectedProviderIds: ProviderId[];
  onCloseProvider: () => void;
  onConnectProvider: (id: ProviderId) => void;
  onSelectProvider: (id: ProviderId) => void;
  onDisconnect: () => void;
  connectionUser: TobiraConnectionUser;
  isDisconnecting: boolean;
}) {
  const activeProvider = PROVIDERS.find(
    (provider) => provider.id === activeProviderId,
  );
  const ActiveProviderSection = activeProvider?.section;

  return (
    <div className="flex w-80 flex-col bg-background font-sans text-sm select-none">
      <header className="flex items-center justify-between px-4 pt-3 pb-3">
        <a
          href={TOBIRA_APP_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Open Tobira"
          className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <img
            src="/logo/dark-logo.svg"
            alt=""
            className="size-5.5 shrink-0 object-contain"
          />
        </a>
        <div className="flex items-center gap-0.5">
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
            <MenuPopup
              align="end"
              sideOffset={6}
              className="min-w-44 max-w-[250px]"
            >
              <div className={cn("flex items-center gap-2 px-1 py-1")}>
                <UserAvatar
                  email={connectionUser.email}
                  label={connectionUser.name || connectionUser.email}
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
                    aria-hidden="true"
                  >
                    <path
                      d="M9.333 2h4c.368 0 .667.298.667.667v4a.667.667 0 0 1-1.333 0V4.276L7.805 9.138a.667.667 0 1 1-.943-.943l4.862-4.862H9.333A.667.667 0 0 1 9.333 2ZM6 3.333h-.133c-.571 0-.96.001-1.26.026-.292.024-.441.067-.546.12a1.333 1.333 0 0 0-.582.582c-.053.104-.096.254-.12.546-.025.3-.026.688-.026 1.259v4.267c0 .571.001.96.026 1.259.024.292.067.442.12.546.128.251.332.455.582.583.105.053.254.096.546.12.3.025.688.026 1.26.026H8.8c.571 0 .96-.001 1.259-.026.292-.024.441-.067.546-.12.251-.128.455-.332.583-.583.053-.104.096-.254.12-.546.025-.3.026-.688.026-1.259V10a.667.667 0 0 1 1.333 0v.161c0 .537 0 .98-.029 1.34-.03.375-.096.72-.26 1.043a2.667 2.667 0 0 1-1.167 1.165c-.323.165-.667.23-1.043.261-.36.029-.803.029-1.34.029H5.839c-.537 0-.98 0-1.34-.029-.375-.03-.72-.096-1.043-.26a2.667 2.667 0 0 1-1.166-1.166c-.165-.323-.23-.668-.261-1.043C2 11.14 2 10.697 2 10.161V7.172c0-.536 0-.98.029-1.34.03-.375.096-.72.26-1.043A2.667 2.667 0 0 1 3.456 3.624c.323-.165.668-.23 1.043-.261.36-.029.803-.029 1.34-.029H6A.667.667 0 0 1 6 3.333Z"
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
          <CloseButton />
        </div>
      </header>
      <Separator />
      <main className="max-h-96 overflow-y-auto">
        {activeProvider && ActiveProviderSection ? (
          <ActiveProviderSection
            icon={activeProvider.sectionIcon}
            connected={connectedProviderIds.includes(activeProvider.id)}
            onBack={onCloseProvider}
            onConnect={() => onConnectProvider(activeProvider.id)}
          />
        ) : (
          <div className="px-4 pt-3 pb-4">
            <div className="pb-3">
              <h1 className="text-[15px] font-medium text-foreground">
                Sources
                <span className="ml-1 font-medium text-muted-foreground">
                  ({connectedProviderIds.length}/{PROVIDERS.length})
                </span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect your sources to bring everything into Tobira.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              {PROVIDERS.map((provider, index) => (
                <ProviderRow
                  key={provider.id}
                  provider={provider}
                  connected={connectedProviderIds.includes(provider.id)}
                  onConnect={() => onSelectProvider(provider.id)}
                  isLast={index === PROVIDERS.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
