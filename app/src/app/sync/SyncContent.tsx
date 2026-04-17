"use client";

import {PageHeader} from "@/components/ui/page/PageHeader";
import {ProvidersSection} from "@/app/sync/_components/ProvidersSection";
import {SyncActivitySection} from "@/app/sync/_components/SyncActivitySection";
import {ConnectedAccountsSection} from "@/app/sync/_components/ConnectedAccountsSection";

export const SyncContent = () => {
  return (
    <div className="flex h-full w-full overflow-auto">
      <div className="min-h-0 flex-1 overflow-auto px-5 py-12">
        <div className="mx-auto max-w-[840px]">
          <div className="">
            <div className="mb-16">
              <PageHeader
                title="Sync"
                description="Connect outside services and bring your saved content into Tobira. Imported items are organized alongside everything else."
              />
              <div className="border-border mt-4 flex items-center gap-5.5 border-t pt-4">
                <Stat label="Connected accounts" value="10" />
                <div className="bg-border h-7 w-px" aria-hidden />
                <Stat label="Imported items" value="1,806" />
                <div className="bg-border h-7 w-px" aria-hidden />
                <Stat label="Last sync" value="2 min ago" />
                <div className="bg-border h-7 w-px" aria-hidden />
                <Stat label="Need attention" value="5" />
              </div>
            </div>
            <ProvidersSection />
            <ConnectedAccountsSection />
            <SyncActivitySection />
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
