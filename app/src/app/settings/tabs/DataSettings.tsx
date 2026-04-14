"use client";
import React, {useState} from "react";
import {Button} from "@/components/coss-ui/button";
import {Checkbox} from "@/components/coss-ui/checkbox";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/coss-ui/select";
import {SettingsFrame, SettingsLabel} from "../_components/SettingsUI";
import {SettingsActionBar} from "../_components/SettingsActionBar";
import {Label} from "@/components/coss-ui/label";
import {PageHeader} from "@/components/ui/page/PageHeader";

const exportFormats = [
  {label: "JSON (Recommended)", value: "json"},
  {label: "CSV Spreadsheet", value: "csv"},
  {label: "HTML Bookmark File", value: "html"},
];

const archiveOptions = [
  {label: "30 days", value: "30"},
  {label: "90 days", value: "90"},
  {label: "1 year", value: "365"},
  {label: "Never", value: "never"},
];

const DataSettings = () => {
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <div className="space-y-10">
      {/* Header */}
      <PageHeader
        title="Data Management"
        description="Manage your data portability, storage snapshots, and automated cleanup rules."
      />

      <form action="">
        <div className="space-y-6">
          {/* ─── Section 1: Export Workspace ─── */}
          <SettingsFrame title="Export">
            <div className="flex items-start justify-between gap-8">
              <SettingsLabel
                title="Export your data"
                description="Download all your links, collections, and AI metadata in a portable format."
              />
              <div className="flex min-w-64 flex-col gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    aria-label="Select export format"
                    defaultValue="json"
                    items={exportFormats}>
                    <SelectTrigger className="w-full" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {exportFormats.map(({label, value}) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Checkbox id="include-ai" defaultChecked />
                    <label
                      htmlFor="include-ai"
                      className="text-foreground text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Include AI tags and descriptions
                    </label>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Checkbox id="include-media" />
                    <label
                      htmlFor="include-media"
                      className="text-foreground text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Include media thumbnails
                    </label>
                  </div>
                </div>

                <Button className="mt-2 w-full" variant="default" size="sm">
                  Generate Export
                </Button>
              </div>
            </div>
          </SettingsFrame>

          {/* ─── Section 2: Archive Settings ─── */}
          <SettingsFrame title="Retention Rules">
            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Auto-Archive Lifecycle"
                description="Keep your main workspace clean by automatically moving old links to the inactive Archive."
              />
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">archive older than</span>
                <Select
                  aria-label="Select archive threshold"
                  defaultValue="never"
                  items={archiveOptions}>
                  <SelectTrigger className="w-32" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {archiveOptions.map(({label, value}) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
            </div>

            <div className="bg-border h-px w-full" />

            {/* Bin Cleanup */}
            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Bin Cleanup"
                description="Items in the bin are permanently deleted after 30 days. This cannot be undone."
              />
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground text-sm">128 items (~14.2 MB)</p>
                <Button variant="outline" size="sm">
                  Empty Bin Now
                </Button>
              </div>
            </div>
          </SettingsFrame>

          {/* ─── Section 3: Storage Settings ─── */}
          <SettingsFrame title="Maintenance">
            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Local Cache & Previews"
                description="Tobira stores local snapshots to make your library feel instant. Clearing cache will re-download images."
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground">
                Clear Preview Cache
              </Button>
            </div>
          </SettingsFrame>
        </div>

        <SettingsActionBar
          visible={hasChanges}
          changedCount={0}
          onUpdate={() => {}}
          onCancel={() => setHasChanges(false)}
        />
      </form>
    </div>
  );
};

export default DataSettings;
