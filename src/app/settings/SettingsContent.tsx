"use client";

import React from "react";
import {useSearchParams} from "next/navigation";
import GeneralSettings from "./tabs/GeneralSettings";

export function SettingsContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "general";

  return (
    <div className="flex h-full w-full overflow-auto">
      {/* Tab content */}
      <div className="mx-auto min-h-0 max-w-[840px] flex-1 overflow-auto px-5 py-12">
        {tab === "general" && <GeneralSettings />}
        {/* {tab !== "general" && (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            This section is coming soon.
          </div>
        )} */}
      </div>
    </div>
  );
}
