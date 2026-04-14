"use client";

import React from "react";

import GeneralSettings from "./tabs/GeneralSettings";
import PersonalizationSettings from "./tabs/PersonalizationSettings";
import AccountSettings from "./tabs/AccountSettings";
import DataSettings from "./tabs/DataSettings";
import {User} from "@/components/utils/better-auth/auth-client";

export function SettingsContent({activeTag, user}: {activeTag: string; user: User}) {
  return (
    <div className="flex h-full w-full overflow-auto">
      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-auto px-5 py-12">
        <div className="mx-auto max-w-[840px]">
          {activeTag === "general" && <GeneralSettings />}
          {activeTag === "personalization" && <PersonalizationSettings />}
          {activeTag === "account" && <AccountSettings />}
          {activeTag === "data" && <DataSettings />}
        </div>
      </div>
    </div>
  );
}
