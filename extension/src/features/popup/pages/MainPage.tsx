import { TOBIRA_APP_URL } from "@/lib/tobira-config";
import type { TobiraConnectionUser } from "@/lib/tobira-contracts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CloseButton } from "../components/CloseButton";
import { ProviderRow } from "../components/ProviderRow";
import { SettingsMenu } from "../components/SettingsMenu";
import { PROVIDERS, type ProviderId } from "../providers/providers";

export function MainPage({
  activeProviderId,
  connectedProviderIds,
  connectionNotice,
  onCloseProvider,
  onConnectProvider,
  onSelectProvider,
  onDisconnect,
  connectionUser,
  isDisconnecting,
}: {
  activeProviderId: ProviderId | null;
  connectedProviderIds: ProviderId[];
  connectionNotice?: string | null;
  onCloseProvider: () => void;
  onConnectProvider: (id: ProviderId) => void;
  onSelectProvider: (id: ProviderId) => void;
  onDisconnect: () => void;
  connectionUser: TobiraConnectionUser;
  isDisconnecting: boolean;
}) {
  const activeProvider = PROVIDERS.find((provider) => provider.id === activeProviderId);
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
          <img src="/logo/dark-logo.svg" alt="" className="size-5.5 shrink-0 object-contain" />
        </a>
        <div className="flex items-center gap-0.5">
          <SettingsMenu
            connectionUser={connectionUser}
            onDisconnect={onDisconnect}
            isDisconnecting={isDisconnecting}
          />
          <CloseButton />
        </div>
      </header>
      <Separator />
      {connectionNotice && (
        <p
          className="border-b border-border px-4 py-2 text-xs leading-relaxed text-destructive"
          role="alert"
        >
          {connectionNotice}
        </p>
      )}
      <main>
        <ScrollArea className={ActiveProviderSection ? "h-auto" : "h-96"}>
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
        </ScrollArea>
      </main>
    </div>
  );
}
