import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Provider } from "../providers/providers";

type ProviderRowProps = {
  provider: Provider;
  connected: boolean;
  onConnect: () => void;
  isLast: boolean;
};

export function ProviderRow({ provider, connected, onConnect, isLast }: ProviderRowProps) {
  return (
    <button
      type="button"
      disabled={!provider.section}
      onClick={onConnect}
      className={cn(
        "group relative flex w-full items-center gap-3 px-3 py-2 text-left outline-none transition-none! enabled:cursor-pointer enabled:hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        !isLast && "border-b border-border/80",
        !provider.section && "opacity-70",
      )}
    >
      <img
        src={provider.image}
        alt=""
        width={18}
        height={18}
        className="size-[18px] shrink-0 object-contain"
      />

      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {provider.name}
      </span>

      {connected ? (
        <span className="inline-flex h-[28px] shrink-0 items-center gap-1.5 text-sm font-medium text-success-foreground">
          <span className="size-1.5 rounded-full bg-success" />
          Connected
        </span>
      ) : (
        <span
          className={buttonVariants({
            variant: "outline",
            size: "xs",
            className: "pointer-events-none shrink-0",
          })}
        >
          {provider.section ? "Connect" : "Soon"}
        </span>
      )}
    </button>
  );
}
