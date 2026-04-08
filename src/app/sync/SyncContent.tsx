import React from "react";
import {PageHeader} from "@/components/ui/page/PageHeader";
import {Tabs, TabsList, TabsPanel, TabsTab} from "@/components/coss-ui/tabs";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/coss-ui/input-group";
import {Button} from "@/components/coss-ui/button";
import Image from "next/image";
import {ArrowUpRightIcon} from "lucide-react";

type Provider = {
  name: string;
  image: string;
  description: string;
  types: string[];
};

const PROVIDERS = [
  {
    name: "X",
    image: "https://thesvg.org/icons/x/default.svg",
    description: "Import saved posts, links, and media you want to keep organized in Tobira.",
    types: ["Social", "Bookmarks", "Media"],
  },
  {
    name: "Reddit",
    image: "https://thesvg.org/icons/reddit/default.svg",
    description: "Bring in saved posts, image threads, and useful links from your account.",
    types: ["Social", "Bookmarks", "Media"],
  },
  {
    name: "Dribbble",
    image: "https://thesvg.org/icons/dribbble/default.svg",
    description: "Import liked or saved shots into your media and inspiration collections.",
    types: ["Media", "Design", "Inspiration"],
  },
  {
    name: "Chrome",
    image: "https://thesvg.org/icons/google-chrome/default.svg",
    description: "Import bookmark folders and saved links from your Chrome browser.",
    types: ["Browsers", "Bookmarks", "Links"],
  },
  {
    name: "Arc",
    image: "https://thesvg.org/icons/arc/default.svg",
    description: "Bring over saved tabs, pinned spaces, and browsing sessions.",
    types: ["Browsers", "Tabs", "Reading"],
  },
  {
    name: "Dia",
    image: "https://thesvg.org/icons/globe/default.svg",
    description: "Import saved tabs and reading flows from Dia for quick capture into Tobira.",
    types: ["Browsers", "Tabs", "Reading"],
  },
  {
    name: "Pinterest",
    image: "https://thesvg.org/icons/pinterest/default.svg",
    description: "Sync boards and saved pins into media-first collections inside Tobira.",
    types: ["Media", "Inspiration", "Social"],
  },
  {
    name: "YouTube",
    image: "https://thesvg.org/icons/youtube/default.svg",
    description: "Import watch-later videos, playlists, and saved references.",
    types: ["Media", "Video", "Bookmarks"],
  },
  {
    name: "Firefox",
    image: "https://thesvg.org/icons/firefox/default.svg",
    description: "Import bookmarks and reading-list style saves from Firefox.",
    types: ["Browsers", "Bookmarks", "Reading"],
  },
  {
    name: "Safari",
    image: "https://thesvg.org/icons/safari/default.svg",
    description: "Bring bookmarks and reading list items from Safari into Tobira.",
    types: ["Browsers", "Bookmarks", "Reading"],
  },
  {
    name: "Pocket",
    image: "https://thesvg.org/icons/pocket/default.svg",
    description: "Import read-later saves and article queues for long-form content capture.",
    types: ["Reading", "Bookmarks", "Links"],
  },
  {
    name: "Raindrop",
    image: "https://thesvg.org/icons/bookmark/default.svg",
    description: "Migrate organized bookmarks, collections, and saved links into Tobira.",
    types: ["Bookmarks", "Collections", "Links"],
  },
] satisfies Provider[];

export const SyncContent = () => {
  return (
    <div className="flex h-full w-full overflow-auto">
      <div className="min-h-0 flex-1 overflow-auto px-5 py-12">
        <div className="mx-auto max-w-[840px]">
          <div className="space-y-16">
            {/* title + metrics section */}
            <div>
              <PageHeader
                title="Sync"
                description="Connect outside services and bring your saved content into Tobira. Imported items are organized alongside everything else."
              />
              <div className="border-border mt-4 flex items-center gap-5.5 border-t pt-4">
                <Stat label="Connected providers" value="1" />
                <div className="bg-border h-7 w-px" aria-hidden />
                <Stat label="Imported items" value="342" />
                <div className="bg-border h-7 w-px" aria-hidden />
                <Stat label="Last sync" value="2 min ago" />
                <div className="bg-border h-7 w-px" aria-hidden />
                <Stat label="Need attention" value="0" />
              </div>
            </div>
            {/* providers section */}

            <div className="space-y-4">
              <h4 className="text-foreground/95 text-base font-[550]">
                Providers{" "}
                <span className="text-muted-foreground/90 font-medium tracking-wide">
                  ({PROVIDERS.length})
                </span>
              </h4>
              <div className="">
                <Tabs defaultValue="all">
                  <div className="flex items-center justify-between gap-2">
                    <TabsList className="flex items-center gap-2">
                      <TabsTab value="all">All</TabsTab>
                      <TabsTab value="social">Social</TabsTab>
                      <TabsTab value="browsers">Browsers</TabsTab>
                      <TabsTab value="coming-soon">Coming soon</TabsTab>
                    </TabsList>
                    <InputGroup className="w-full max-w-[300px]">
                      <InputGroupInput
                        aria-label="Search"
                        placeholder="Search"
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
                    <div className="grid grid-cols-2 gap-4">
                      {PROVIDERS.map((provider) => (
                        <ProviderCard key={provider.name} provider={provider} />
                      ))}
                    </div>
                  </TabsPanel>
                  <TabsPanel value="social">
                    <p className="text-muted-foreground p-4 text-center text-xs">Social content</p>
                  </TabsPanel>
                  <TabsPanel value="browsers">
                    <p className="text-muted-foreground p-4 text-center text-xs">Browser content</p>
                  </TabsPanel>
                  <TabsPanel value="coming-soon">
                    <p className="text-muted-foreground p-4 text-center text-xs">
                      Coming soon content
                    </p>
                  </TabsPanel>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

function ProviderCard({provider}: {provider: Provider}) {
  return (
    <div className="border-border bg-card text-card-foreground flex w-full flex-col gap-4 rounded-lg border p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <Image src={provider.image} alt={provider.name} width={24} height={24} />
        {/* <div className="border-border/60 text-foreground/80 rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase">
          Connected
        </div> */}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-foreground text-base font-[550] tracking-tight">{provider.name}</h3>
        <p className="text-muted-foreground text-[14px] leading-relaxed">{provider.description}</p>
      </div>

      {/* Meta & Action */}
      <div className="space-y-4">
        <div className="text-muted-foreground/70 font-mono text-[13px] tracking-wide">
          {provider.types.join(" · ")}
        </div>
        <Button variant="outline" size="default" className="group w-full">
          Connect{" "}
          <ArrowUpRightIcon
            className="size-4 text-current opacity-100 transition-transform duration-200 ease-out group-hover:translate-x-px group-hover:-translate-y-px"
            strokeWidth={2.3}
          />
        </Button>
      </div>
    </div>
  );
}
