import React, {useState} from "react";
import {Frame, FrameHeader, FramePanel, FrameTitle} from "@/components/coss-ui/frame";
import {ThemeSettings} from "../_components/ThemeSettings";
import {Switch} from "@/components/ui/switch";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/coss-ui/select";
import {SettingsActionBar} from "../_components/SettingsActionBar";
import {Label} from "@/components/coss-ui/label";

const fontItems = [
  {label: "Inter", value: "inter"},
  {label: "Roboto", value: "roboto"},
  {label: "Open Sans", value: "open-sans"},
];

const timeFormatItems = [
  {label: "12-hour", value: "12-hour"},
  {label: "24-hour", value: "24-hour"},
];

const GeneralSettings = () => {
  const [hasChanges, setHasChanges] = useState(true); // Placeholder for UI demonstration

  return (
    <div className="space-y-10">
      {/* title */}
      <div className="space-y-0.5">
        <h1 className="text-foreground text-xl font-[550]">Preferences</h1>
        <p className="text-muted-foreground text-sm">
          Manage your Tobira preferences, account, and workspace settings
        </p>
      </div>
      {/* the whole form */}
      <form action="">
        <Frame className="w-full">
          <FrameHeader>
            <FrameTitle className="text-muted-foreground text-sm font-normal">General</FrameTitle>
          </FrameHeader>
          <FramePanel className="space-y-4">
            <div className="flex items-center justify-between space-y-6">
              <div className="space-y-0.5">
                <Label>Appearance</Label>
                <p className="text-muted-foreground text-sm">
                  Choose light or dark mode, or switch your mode automatically based on your system
                  settings.
                </p>
              </div>
              <ThemeSettings />
            </div>

            <div className="bg-border h-px w-full"></div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Zen Mode</Label>
                <p className="text-muted-foreground text-sm">
                  Hide all UI elements except the current card to minimize distractions.
                </p>
              </div>
              <Switch checked={true} onToggle={() => {}} />
            </div>

            <div className="bg-border h-px w-full"></div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Font Family</Label>
                <p className="text-muted-foreground text-sm">
                  Choose the typeface that best fits your reading style.
                </p>
              </div>
              <Select aria-label="Select font family" defaultValue="inter" items={fontItems}>
                <SelectTrigger className="w-fit" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {fontItems.map(({label, value}) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>

            <div className="bg-border h-px w-full"></div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Time Format</Label>
                <p className="text-muted-foreground text-sm">
                  Set your preferred clock style for timestamps.
                </p>
              </div>
              <Select
                aria-label="Select time format"
                defaultValue="12-hour"
                items={timeFormatItems}>
                <SelectTrigger className="w-fit" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {timeFormatItems.map(({label, value}) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
          </FramePanel>
          {/* <FrameFooter>
            <p className="text-muted-foreground text-sm">Footer</p>
          </FrameFooter> */}
        </Frame>

        <SettingsActionBar
          visible={hasChanges}
          changedCount={2}
          onUpdate={() => {}}
          onCancel={() => setHasChanges(false)}
        />
      </form>
    </div>
  );
};

export default GeneralSettings;
