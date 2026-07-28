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
import { Avatar as UserAvatar } from "../../../../../app/src/components/ui/app/avatar";
import { Separator } from "@/components/ui/separator";
import { CloseButton } from "../components/CloseButton";
import { ProviderRow } from "../components/ProviderRow";
import { PROVIDERS, type ProviderId } from "../providers/providers";

const TOBIRA_APP_URL = "https://tobira.app";

const PREVIEW_EMAIL = "test@gmail.com";

function openTobira(path = "") {
  void browser.tabs.create({ url: `${TOBIRA_APP_URL}${path}` });
}

export function MainPage({
  activeProviderId,
  connectedProviderIds,
  onCloseProvider,
  onConnectProvider,
  onSelectProvider,
  onLogOut,
}: {
  activeProviderId: ProviderId | null;
  connectedProviderIds: ProviderId[];
  onCloseProvider: () => void;
  onConnectProvider: (id: ProviderId) => void;
  onSelectProvider: (id: ProviderId) => void;
  onLogOut: () => void;
}) {
  const activeProvider = PROVIDERS.find((provider) => provider.id === activeProviderId);
  const ActiveProviderSection = activeProvider?.section;

  return (
    <div className="flex w-80 flex-col bg-background font-sans text-sm select-none ">
      <header className="flex items-center justify-between px-4 pt-3 pb-3">
        <a
          href={TOBIRA_APP_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Open Tobira"
          className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <img src="/logo/dark-logo.svg" alt="" className="size-5.5 shrink-0 object-contain" />
        </a>
        <div className="flex items-center gap-0.5">
          <Menu>
            <MenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Settings"
                  className="size-6 data-popup-open:bg-accent "
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
                  d="M6.62491 2.06909C6.93134 1.60944 7.44721 1.33334 7.99967 1.33334C8.55214 1.33334 9.06801 1.60944 9.37441 2.06909L9.63247 2.4562C9.89821 2.85472 10.3828 3.04717 10.8495 2.93947L11.1041 2.88072C11.6685 2.75046 12.2603 2.92017 12.6699 3.32979C13.0795 3.73941 13.2492 4.33114 13.1189 4.8956L13.0602 5.15016C12.9525 5.61686 13.1449 6.1015 13.5435 6.36718L13.9306 6.62525C14.3903 6.93168 14.6663 7.44754 14.6663 8.00001C14.6663 8.55248 14.3903 9.06834 13.9306 9.37474L13.5435 9.63281C13.1449 9.89854 12.9525 10.3831 13.0602 10.8499L13.1189 11.1044C13.2492 11.6689 13.0795 12.2606 12.6699 12.6702C12.2603 13.0799 11.6685 13.2495 11.1041 13.1193L10.8495 13.0605C10.3828 12.9529 9.89821 13.1453 9.63247 13.5438L9.37441 13.9309C9.06801 14.3906 8.55214 14.6667 7.99967 14.6667C7.44721 14.6667 6.93134 14.3906 6.62491 13.9309L6.36684 13.5438C6.10116 13.1453 5.61653 12.9529 5.14983 13.0605L4.89526 13.1193C4.33081 13.2495 3.73907 13.0799 3.32945 12.6702C2.91984 12.2606 2.75013 11.6689 2.88039 11.1044L2.93913 10.8499C3.04683 10.3831 2.85439 9.89854 2.45587 9.63281L2.06875 9.37474C1.6091 9.06834 1.33301 8.55248 1.33301 8.00001C1.33301 7.44754 1.6091 6.93168 2.06875 6.62525L2.45587 6.36718C2.85439 6.1015 3.04683 5.61686 2.93913 5.15016L2.88039 4.8956C2.75013 4.33115 2.91983 3.73941 3.32945 3.32979C3.73907 2.92017 4.33081 2.75046 4.89526 2.88072L5.14983 2.93947C5.61653 3.04717 6.10116 2.85472 6.36684 2.4562L6.62491 2.06909ZM5.91634 8.00001C5.91634 6.84941 6.84907 5.91668 7.99967 5.91668C9.15027 5.91668 10.083 6.84941 10.083 8.00001C10.083 9.15061 9.15027 10.0833 7.99967 10.0833C6.84907 10.0833 5.91634 9.15061 5.91634 8.00001Z"
                  fill="currentColor"
                />
              </svg>
            </MenuTrigger>
            <MenuPopup align="end" sideOffset={6} className="min-w-44 max-w-[250px]">
              <div className={cn("flex items-center gap-2 px-1 py-1")}>
                <UserAvatar
                  email={PREVIEW_EMAIL}
                  label={PREVIEW_EMAIL}
                  size={24}
                  animated={false}
                  showInitials={false}
                  showFrame={false}
                  showUserIcon
                />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {PREVIEW_EMAIL}
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
                      d="M9.33333 3.33333C8.96513 3.33333 8.66667 3.03485 8.66667 2.66667C8.66667 2.29848 8.96513 2 9.33333 2H13.3333C13.7015 2 14 2.29848 14 2.66667V6.66667C14 7.03487 13.7015 7.33333 13.3333 7.33333C12.9651 7.33333 12.6667 7.03487 12.6667 6.66667V4.27614L7.80473 9.13807C7.5444 9.3984 7.12227 9.3984 6.86193 9.13807C6.60158 8.87773 6.60158 8.4556 6.86193 8.19527L11.7239 3.33333H9.33333ZM5.83913 3.33333H6C6.36819 3.33333 6.66667 3.63181 6.66667 4C6.66667 4.36819 6.36819 4.66667 6 4.66667H5.86667C5.29561 4.66667 4.90742 4.66719 4.60736 4.6917C4.31508 4.71558 4.16561 4.75887 4.06135 4.81199C3.81047 4.93982 3.60649 5.14379 3.47866 5.39468C3.42553 5.49895 3.38225 5.64841 3.35837 5.94069C3.33385 6.24075 3.33333 6.62895 3.33333 7.2V10.1333C3.33333 10.7044 3.33385 11.0926 3.35837 11.3927C3.38225 11.6849 3.42553 11.8344 3.47866 11.9387C3.60649 12.1895 3.81047 12.3935 4.06135 12.5213C4.16561 12.5745 4.31508 12.6177 4.60736 12.6416C4.90742 12.6661 5.29561 12.6667 5.86667 12.6667H8.8C9.37107 12.6667 9.75927 12.6661 10.0593 12.6416C10.3516 12.6177 10.5011 12.5745 10.6053 12.5213C10.8562 12.3935 11.0602 12.1895 11.188 11.9387C11.2411 11.8344 11.2844 11.6849 11.3083 11.3927C11.3328 11.0926 11.3333 10.7044 11.3333 10.1333V10C11.3333 9.6318 11.6318 9.33333 12 9.33333C12.3682 9.33333 12.6667 9.6318 12.6667 10V10.1609C12.6667 10.6975 12.6667 11.1404 12.6372 11.5012C12.6066 11.8759 12.5409 12.2204 12.376 12.544C12.1203 13.0457 11.7124 13.4537 11.2107 13.7093C10.8871 13.8742 10.5426 13.9399 10.1679 13.9705C9.80707 14 9.3642 14 8.82753 14H5.83912C5.30248 14 4.85957 14 4.49879 13.9705C4.12405 13.9399 3.77958 13.8742 3.45603 13.7093C2.95426 13.4537 2.54631 13.0457 2.29065 12.544C2.12579 12.2204 2.06008 11.8759 2.02946 11.5012C1.99999 11.1404 1.99999 10.6975 2 10.1609V7.17247C1.99999 6.63582 1.99999 6.19291 2.02946 5.83211C2.06008 5.45739 2.12579 5.11291 2.29065 4.78936C2.54631 4.28759 2.95426 3.87965 3.45603 3.62398C3.77958 3.45912 4.12405 3.39341 4.49878 3.36279C4.85958 3.33332 5.30249 3.33333 5.83913 3.33333Z"
                      fill="currentColor"
                    />
                  </svg>
                  Open Tobira
                </MenuItem>
                <MenuItem variant="destructive" onClick={onLogOut}>
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
                      d="M4.66667 3.33333C3.93029 3.33333 3.33333 3.93029 3.33333 4.66667V11.3333C3.33333 12.0697 3.93029 12.6667 4.66667 12.6667H7.5C7.8682 12.6667 8.16667 12.9651 8.16667 13.3333C8.16667 13.7015 7.8682 14 7.5 14H4.66667C3.19391 14 2 12.8061 2 11.3333V4.66667C2 3.19391 3.19391 2 4.66667 2H7.5C7.8682 2 8.16667 2.29848 8.16667 2.66667C8.16667 3.03485 7.8682 3.33333 7.5 3.33333H4.66667ZM9.86193 4.52859C10.1223 4.26825 10.5444 4.26825 10.8047 4.52859L13.8047 7.5286C14.0651 7.78893 14.0651 8.21107 13.8047 8.4714L10.8047 11.4714C10.5444 11.7317 10.1223 11.7317 9.86193 11.4714C9.6016 11.2111 9.6016 10.7889 9.86193 10.5286L11.7239 8.66667H5.83333C5.46515 8.66667 5.16667 8.3682 5.16667 8C5.16667 7.6318 5.46515 7.33333 5.83333 7.33333H11.7239L9.86193 5.47141C9.6016 5.21105 9.6016 4.78895 9.86193 4.52859Z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign out
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
