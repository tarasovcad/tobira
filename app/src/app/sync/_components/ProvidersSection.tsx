"use client";

import {useMemo, useState} from "react";
import {Tabs, TabsList, TabsPanel, TabsTab} from "@/components/coss-ui/tabs";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/coss-ui/input-group";
import {Button} from "@/components/coss-ui/button";
import Image from "next/image";
import {ArrowUpRightIcon} from "lucide-react";
import {useSyncSetupStore} from "@/store/use-sync-setup-store";
import {motion} from "motion/react";
import {cn} from "@/lib/utils";
import {PROVIDERS, type Provider} from "@/app/sync/_lib/sync-providers";

function providerMatchesQuery(provider: Provider, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  if (provider.name.toLowerCase().includes(q)) return true;
  if (provider.description.toLowerCase().includes(q)) return true;
  return provider.types.some((t) => t.toLowerCase().includes(q));
}

export function ProvidersSection() {
  const [providersCollapsed, setProvidersCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {allProviders, socialProviders, browserProviders} = useMemo(() => {
    const filtered = PROVIDERS.filter((p) => providerMatchesQuery(p, searchQuery));
    return {
      allProviders: filtered,
      socialProviders: filtered.filter((p) => p.category === "social"),
      browserProviders: filtered.filter((p) => p.category === "browsers"),
    };
  }, [searchQuery]);

  return (
    <div className={cn("space-y-4", !providersCollapsed ? "mb-16" : "mb-6")}>
      <h4 className="text-base font-[550]">
        <button
          type="button"
          onClick={() => setProvidersCollapsed((v) => !v)}
          aria-expanded={!providersCollapsed}
          className="text-foreground/95 group hit-area-5 [&>svg]:text-muted-foreground relative inline-flex cursor-pointer items-center">
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "absolute top-1/2 left-[-21px] -translate-y-1/2 opacity-0 transition-opacity duration-150 ease-out will-change-transform group-hover:opacity-100",
              providersCollapsed && "opacity-100",
            )}
            style={{transformOrigin: "50% 50%"}}
            initial={false}
            animate={{rotate: providersCollapsed ? 90 : 0}}
            transition={{duration: 0.22, ease: [0.22, 1, 0.36, 1]}}
            aria-hidden>
            <path
              d="M6.80473 3.52859C6.5444 3.26824 6.1224 3.26824 5.862 3.52859C5.60167 3.78894 5.60167 4.21095 5.862 4.4713L9.39067 7.99993L5.862 11.5286C5.60167 11.7889 5.60167 12.2109 5.862 12.4713C6.1224 12.7317 6.5444 12.7317 6.80473 12.4713L10.8047 8.47133C11.0651 8.21093 11.0651 7.78893 10.8047 7.5286L6.80473 3.52859Z"
              fill="currentColor"
            />
          </motion.svg>
          Providers
          <span className="text-muted-foreground/90 ml-1 font-medium tracking-wide">
            ({PROVIDERS.length})
          </span>
        </button>
      </h4>

      <motion.div
        initial={false}
        animate={providersCollapsed ? "collapsed" : "expanded"}
        variants={{
          expanded: {height: "auto", opacity: 1, y: 0},
          collapsed: {height: 0, opacity: 0, y: -4},
        }}
        transition={{
          height: {duration: 0.2, ease: [0.22, 1, 0.36, 1]},
          opacity: {duration: 0.12, ease: [0.22, 1, 0.36, 1]},
          y: {duration: 0.2, ease: [0.22, 1, 0.36, 1]},
        }}
        className={cn(
          "overflow-hidden will-change-[height,transform]",
          providersCollapsed && "pointer-events-none",
        )}>
        <div className="pt-0.5">
          <Tabs defaultValue="all">
            <div className="flex items-center justify-between gap-2">
              <TabsList className="flex items-center gap-2 border-b" variant="underline">
                <TabsTab value="all" className="hit-area-2">
                  All
                </TabsTab>
                <TabsTab value="social" className="hit-area-2">
                  Social
                </TabsTab>
                <TabsTab value="browsers" className="hit-area-2">
                  Browsers
                </TabsTab>
                <TabsTab value="coming-soon" className="hit-area-2">
                  Coming soon
                </TabsTab>
              </TabsList>
              <InputGroup className="w-full max-w-[300px]">
                <InputGroupInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search providers"
                  placeholder="Search providers"
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
            </div>
            <TabsPanel value="all" className="mt-4">
              {allProviders.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No providers match &ldquo;{searchQuery.trim()}&rdquo;
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {allProviders.map((provider) => (
                    <ProviderCard key={provider.name} provider={provider} />
                  ))}
                </div>
              )}
            </TabsPanel>
            <TabsPanel value="social">
              {socialProviders.length === 0 ? (
                <p className="text-muted-foreground mt-4 py-8 text-center text-sm">
                  No social providers match &ldquo;{searchQuery.trim()}&rdquo;
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {socialProviders.map((provider) => (
                    <ProviderCard key={provider.name} provider={provider} />
                  ))}
                </div>
              )}
            </TabsPanel>
            <TabsPanel value="browsers">
              {browserProviders.length === 0 ? (
                <p className="text-muted-foreground mt-4 py-8 text-center text-sm">
                  No browser providers match &ldquo;{searchQuery.trim()}&rdquo;
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {browserProviders.map((provider) => (
                    <ProviderCard key={provider.name} provider={provider} />
                  ))}
                </div>
              )}
            </TabsPanel>
            <TabsPanel value="coming-soon">
              <div className="py-8 text-center">
                <h3 className="text-foreground text-base font-[550]">More coming soon</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Notion, Instapaper, Pinboard and more are on the roadmap.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {["Notion", "Instapaper", "Pinboard", "Hacker News"].map((label) => (
                    <span
                      key={label}
                      className="bg-background text-foreground/90 border-border inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </TabsPanel>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}

function ProviderCard({provider}: {provider: Provider}) {
  const openSyncSetup = useSyncSetupStore((state) => state.open);

  return (
    <div
      className="border-border text-card-foreground relative flex w-full flex-col gap-4 rounded-lg border p-5"
      style={{
        background: `radial-gradient(ellipse at 120% -20%, ${provider.color}12 0%, transparent 55%), var(--card)`,
      }}>
      <div className="flex items-start justify-between">
        <Image
          src={provider.image}
          alt={provider.name}
          width={25}
          height={25}
          className={cn(provider.invertOnDark && "dark:invert")}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-foreground text-base font-[550] tracking-tight">{provider.name}</h3>
        <p className="text-muted-foreground text-[14px] leading-relaxed">{provider.description}</p>
      </div>

      <div className="space-y-4">
        <div className="text-muted-foreground/80 font-mono text-[13px] tracking-wide">
          {provider.types.join(" · ")}
        </div>
        <Button
          variant="outline"
          size="default"
          className="group w-full"
          onClick={() => openSyncSetup(provider)}>
          Connect{" "}
          <ArrowUpRightIcon
            className="size-4 text-current opacity-100 transition-transform duration-200 ease-out group-hover:translate-x-px group-hover:-translate-y-px"
            strokeWidth={2}
          />
        </Button>
      </div>
    </div>
  );
}
