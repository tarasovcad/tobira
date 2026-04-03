"use client";
import React, {useState} from "react";
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
import {SettingsHeader, SettingsFrame, SettingsLabel} from "../_components/SettingsUI";

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
      <SettingsHeader
        title="Preferences"
        description="Manage your Tobira preferences, account, and workspace settings"
      />
      {/* the whole form */}
      <form action="">
        <div className="space-y-6">
          <SettingsFrame title="General">
            <div className="flex items-center justify-between space-y-6">
              <SettingsLabel
                title="Appearance"
                description="Choose light or dark mode, or switch your mode automatically based on your system settings."
              />
              <ThemeSettings />
            </div>

            <div className="bg-border h-px w-full"></div>

            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Zen Mode"
                description="Hide all UI elements except the current card to minimize distractions."
              />
              <Switch checked={true} onToggle={() => {}} />
            </div>

            <div className="bg-border h-px w-full"></div>

            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Font Family"
                description="Choose the typeface that best fits your reading style."
              />
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
              <SettingsLabel
                title="Time Format"
                description="Set your preferred clock style for timestamps."
              />
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
          </SettingsFrame>
        </div>

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
