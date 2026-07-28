import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ProviderIcon } from "../providers/providers";

type ProviderConnectionSectionProps = {
  name: string;
  icon: ProviderIcon;
  connected: boolean;
  description: string;
  connectLabel: string;
  connectHref?: string;
  onBack: () => void;
  onConnect: () => void;
};

export function ProviderConnectionSection({
  name,
  icon,
  connected,
  description,
  connectLabel,
  connectHref,
  onBack,
  onConnect,
}: ProviderConnectionSectionProps) {
  return (
    <section>
      <div className="space-y-3 px-4 py-3">
        <Button
          variant="ghost"
          size="xs"
          className="-ml-2 h-6 gap-1 px-2 text-[13px] text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M8.75 3.5L5.25 7L8.75 10.5"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Sources
        </Button>

        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <div className="relative mb-3">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-px flex size-9 origin-bottom-left -translate-x-0.5 -rotate-10 scale-84 items-center justify-center rounded-md border bg-card shadow-sm/5"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-px flex size-9 origin-bottom-right translate-x-0.5 rotate-10 scale-84 items-center justify-center rounded-md border bg-card shadow-sm/5"
            />
            <div className="relative flex size-9 items-center justify-center rounded-md border bg-card shadow-sm/5">
              <ConnectionIcon icon={icon} />
            </div>
          </div>
          <p className="text-[15px] font-medium text-foreground">
            {connected ? `${name} connected` : "Not connected"}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {connected ? `${name} sync is enabled` : description}
          </p>
        </div>

        {connected ? (
          <Button className="w-full text-[13px]" size="xs" disabled>
            Connected
          </Button>
        ) : connectHref ? (
          <Button
            className="w-full text-[13px]"
            size="xs"
            render={<a href={connectHref} target="_blank" rel="noreferrer" />}
          >
            {connectLabel}
          </Button>
        ) : (
          <Button className="w-full text-[13px]" size="xs" onClick={onConnect}>
            {connectLabel}
          </Button>
        )}
      </div>

      <Separator />
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-[13px] text-muted-foreground">
          {connected ? "Sync active" : "Sync paused"}
        </span>
        <Button
          variant="ghost"
          size="xs"
          className="h-6 gap-1 px-2 text-[13px] text-muted-foreground hover:text-foreground"
        >
          Refresh
        </Button>
      </div>
    </section>
  );
}

function ConnectionIcon({ icon }: { icon: ProviderIcon }) {
  if (typeof icon === "string") {
    return <img src={icon} alt="" className="size-4.5 object-contain" />;
  }

  const Icon = icon;
  return <Icon className="size-4.5" />;
}
