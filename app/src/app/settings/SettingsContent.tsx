"use client";

import {ScrollArea} from "@/components/ui/coss/scroll-area";

import GeneralSettings from "./tabs/GeneralSettings";
import PersonalizationSettings from "./tabs/PersonalizationSettings";
import AccountSettings from "./tabs/AccountSettings";
import DataSettings from "./tabs/DataSettings";

export function SettingsContent({activeTag}: {activeTag: string}) {
  return (
    <div className="flex h-full min-h-0 w-full">
      <ScrollArea className="min-h-0 flex-1 **:data-[slot=scroll-area-scrollbar]:m-0.5 [&_[data-orientation=horizontal]]:hidden">
        <div className="px-5 py-12 pb-15">
          <div className="mx-auto max-w-[840px]">
            {activeTag === "general" && <GeneralSettings />}
            {activeTag === "personalization" && <PersonalizationSettings />}
            {activeTag === "account" && <AccountSettings />}
            {activeTag === "data" && <DataSettings />}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
