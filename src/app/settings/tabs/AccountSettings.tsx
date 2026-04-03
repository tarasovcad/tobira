"use client";
import React, {useState} from "react";
import {Button} from "@/components/coss-ui/button";
import {SettingsHeader, SettingsFrame, SettingsLabel} from "../_components/SettingsUI";
import {SettingsActionBar} from "../_components/SettingsActionBar";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/coss-ui/input-group";
import Link from "next/link";

const AccountSettings = () => {
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <div className="space-y-10">
      {/* Header */}
      <SettingsHeader
        title="Account & Security"
        description="Manage your account details, security settings, and data access."
      />

      <form action="">
        <div className="space-y-6">
          {/* ─── Section 1: Identity ─── */}
          <SettingsFrame title="Identity">
            {/* Primary Email */}
            <div className="flex items-center justify-between gap-8">
              <SettingsLabel
                className="min-w-0 flex-1"
                title="Primary Email"
                description="The email address associated with your Tobira account. "
              />
              <div className="flex items-center gap-2">
                <InputGroup className="opacity-70">
                  <InputGroupInput
                    aria-label="Email"
                    placeholder="Email"
                    type="email"
                    value="tarasovcad@gmail.com"
                    readOnly
                    className="min-w-64"
                  />
                  <InputGroupAddon align="inline-end">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M14.0002 5.33334H13.3335V10.6667H14.0002H14.6668V5.33334H14.0002ZM4.00016 3.33334V4.00001H12.0002V3.33334V2.66667H4.00016V3.33334ZM2.00016 10.6667H2.66683V5.33334H2.00016H1.3335V10.6667H2.00016ZM12.0002 12.6667V12H4.00016V12.6667V13.3333H12.0002V12.6667ZM2.00016 10.6667H1.3335C1.3335 12.1394 2.5274 13.3333 4.00016 13.3333V12.6667V12C3.26378 12 2.66683 11.4031 2.66683 10.6667H2.00016ZM4.00016 3.33334V2.66667C2.5274 2.66667 1.3335 3.86058 1.3335 5.33334H2.00016H2.66683C2.66683 4.59696 3.26378 4.00001 4.00016 4.00001V3.33334ZM14.0002 10.6667H13.3335C13.3335 11.4031 12.7366 12 12.0002 12V12.6667V13.3333C13.473 13.3333 14.6668 12.1394 14.6668 10.6667H14.0002ZM14.0002 5.33334H14.6668C14.6668 3.86058 13.473 2.66667 12.0002 2.66667V3.33334V4.00001C12.7366 4.00001 13.3335 4.59696 13.3335 5.33334H14.0002Z"
                        fill="currentColor"
                      />
                      <path
                        d="M14 5.66667L8.8944 8.21947C8.33133 8.501 7.6686 8.501 7.10553 8.21947L2 5.66667"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </InputGroupAddon>
                </InputGroup>
              </div>
            </div>
          </SettingsFrame>

          {/* ─── Section 2: Workspace Actions ─── */}
          <SettingsFrame title="System Actions">
            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Workspace Management"
                description="Quick access to your archived items and deleted bookmarks."
              />
              <div className="flex items-center gap-2">
                <Link href="/archive">
                  <Button variant="outline" size="sm">
                    Open Archive
                  </Button>
                </Link>
                <Link href="/bin">
                  <Button variant="outline" size="sm">
                    Open Bin
                  </Button>
                </Link>
              </div>
            </div>
          </SettingsFrame>

          {/* ─── Section 3: Danger Zone ─── */}
          <SettingsFrame title="Danger Zone" className="border-red-500/20 bg-red-500/10">
            {/* Archive All Data */}
            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Archive All Data"
                description="Move all your active bookmarks to the Archive. They won't appear in your main feed but remain searchable."
              />
              <Button variant="outline" size="sm">
                Archive Workspace
              </Button>
            </div>

            <div className="h-px w-full bg-red-500/10" />

            {/* Delete Account */}
            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Permanently Delete Account"
                description="This will immediately and permanently delete all your bookmarks, collections, tags, and AI insights. This action cannot be undone."
              />
              <Button variant="destructive" size="sm">
                Delete Account
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

export default AccountSettings;
