"use client";

import React from "react";
import {useSearchParams} from "next/navigation";
import GeneralSettings from "./tabs/GeneralSettings";
import PersonalizationSettings from "./tabs/PersonalizationSettings";

export function SettingsContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "general";

  return (
    <div className="flex h-full w-full overflow-auto">
      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-auto px-5 py-12">
        <div className="mx-auto max-w-[840px]">
          {tab === "general" && <GeneralSettings />}
          {tab === "personalization" && <PersonalizationSettings />}
        </div>
      </div>
    </div>
  );
}
