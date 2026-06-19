"use client";
import React, {useState} from "react";
import {ThemeSettings} from "../_components/ThemeSettings";
import {Switch} from "@/components/ui/app/switch";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/coss/select";
import {SettingsActionBar} from "../_components/SettingsActionBar";
import {SettingsFrame, SettingsLabel} from "../_components/SettingsUI";
import {PageHeader} from "@/components/ui/app/page/PageHeader";

const fontItems = [
  {label: "Inter", value: "inter"},
  {label: "Roboto", value: "roboto"},
  {label: "Open Sans", value: "open-sans"},
];

const timeFormatItems = [
  {label: "12-hour (2:40 PM)", value: "12-hour"},
  {label: "24-hour (14:40)", value: "24-hour"},
];

const sidebarSortItems = [
  {label: "Sort: Recent", value: "newest-to-oldest"},
  {label: "Sort: Oldest", value: "oldest-to-newest"},
  {label: "Sort: A to Z", value: "a-to-z"},
  {label: "Sort: Z to A", value: "z-to-a"},
  {label: "Sort: Most items", value: "most-items-first"},
  {label: "Sort: Fewest items", value: "fewest-items-first"},
];

const GeneralSettings = () => {
  const [hasChanges, setHasChanges] = useState(true); // Placeholder for UI demonstration
  const [showTranslationLabels, setShowTranslationLabels] = useState(true);
  const [useColorSidebarIcons, setUseColorSidebarIcons] = useState(true);

  return (
    <div className="space-y-10">
      {/* title */}
      <PageHeader
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
                inDevelopment={true}
              />
              <Switch checked={true} onToggle={() => {}} disabled />
            </div>

            <div className="bg-border h-px w-full"></div>

            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Translation Labels"
                description="Show a small label on translated posts with the source language and translation provider."
              />
              <Switch
                checked={showTranslationLabels}
                onToggle={() => setShowTranslationLabels((current) => !current)}
              />
            </div>

            <div className="bg-border h-px w-full"></div>

            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Font Family"
                description="Choose the typeface that best fits your reading style."
                inDevelopment={true}
              />
              <Select aria-label="Select font family" defaultValue="inter" items={fontItems}>
                <SelectTrigger className="w-fit" size="sm" disabled>
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

          <SettingsFrame title="Sidebar">
            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Color Sidebar Icons"
                description="Use colorful icons in the sidebar instead of a simple SVG favicon."
                inDevelopment
              />
              <Switch
                checked={useColorSidebarIcons}
                onToggle={() => setUseColorSidebarIcons((current) => !current)}
                disabled
              />
            </div>

            <div className="bg-border h-px w-full"></div>

            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Sidebar Sorting"
                description="Choose how collections and tags are ordered in the sidebar."
                inDevelopment
              />
              <Select
                aria-label="Select sidebar sorting"
                defaultValue="newest-to-oldest"
                disabled
                items={sidebarSortItems}>
                <SelectTrigger className="w-fit" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup alignItemWithTrigger={false}>
                  {sidebarSortItems.map(({label, value}) => (
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
