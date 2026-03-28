import React from "react";
import {Frame, FrameFooter, FrameHeader, FramePanel, FrameTitle} from "@/components/coss-ui/frame";
import {ThemeSettings} from "./_components/ThemeSettings";

const GeneralSettings = () => {
  return (
    <div className="space-y-10">
      {/* title */}
      <div className="space-y-1.5">
        <h1 className="text-foreground text-2xl font-[550]">Preferences</h1>
        <p className="text-muted-foreground text-sm">
          Manage your Tobira preferences, account, and workspace settings
        </p>
      </div>
      {/* the whole form */}
      <form action="">
        <Frame className="w-full">
          <FrameHeader>
            <FrameTitle>General</FrameTitle>
          </FrameHeader>
          <FramePanel className="flex items-center justify-between space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-foreground text-sm font-[550]">Appearance</h2>
              <p className="text-muted-foreground text-sm">
                Choose light or dark mode, or switch your mode automatically based on your system
                settings.
              </p>
            </div>
            {/* theme icons */}
            <ThemeSettings />
          </FramePanel>
          <FrameFooter>
            <p className="text-muted-foreground text-sm">Footer</p>
          </FrameFooter>
        </Frame>
      </form>
    </div>
  );
};

export default GeneralSettings;
