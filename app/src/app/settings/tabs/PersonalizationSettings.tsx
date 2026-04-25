"use client";
import React, {useState} from "react";
import {Input} from "@/components/ui/coss/input";
import {Textarea} from "@/components/ui/coss/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/coss/input-group";
import {SettingsActionBar} from "../_components/SettingsActionBar";
import {Label} from "@/components/ui/coss/label";
import {Avatar} from "@/components/ui/app/avatar";
import {Button} from "@/components/ui/coss/button";
import {Switch} from "@/components/ui/app/switch";
import {SettingsFrame, SettingsLabel} from "../_components/SettingsUI";
import {PageHeader} from "@/components/ui/app/page/PageHeader";

const PersonalizationSettings = () => {
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <div className="space-y-10">
      {/* Header */}
      <PageHeader
        title="Profile & AI Context"
        description="Manage your public identity and help the AI personalize your bookmarking experience."
      />

      <form action="">
        <div className="space-y-6">
          {/* ─── Section 1: Identity ─── */}
          <SettingsFrame title="Identity">
            {/* Avatar */}
            <div className="flex items-center justify-between">
              <SettingsLabel title="Avatar" description="Your profile picture visible to others." />
              <div className="flex items-center gap-3">
                <Avatar
                  email="simoness.yess@gmail.com"
                  label="simoness.yess@gmail.com"
                  size={34}
                  showInitials={false}
                  showFrame={false}
                  showUserIcon={true}
                />
                <Button size="sm" variant="outline">
                  Change
                </Button>
              </div>
            </div>

            <div className="bg-border h-px w-full" />

            {/* Display Name */}
            <div className="flex items-center justify-between gap-8">
              <SettingsLabel
                className="min-w-0 flex-1"
                title="Display Name"
                description="What should we call you?"
              />
              <Input className="w-64" placeholder="Your name" size="default" />
            </div>

            <div className="bg-border h-px w-full" />

            {/* Short Bio */}
            <div className="flex items-start justify-between gap-8">
              <SettingsLabel
                className="min-w-0 flex-1"
                title="Short Bio"
                description="A brief description for your public profile or sections."
              />
              <Textarea
                className="w-64"
                placeholder="Tell us a bit about yourself…"
                maxLength={160}
              />
            </div>
          </SettingsFrame>

          {/* ─── Section 2: AI Personalization ─── */}
          <SettingsFrame
            title="AI Personalization"
            className="relative overflow-hidden rounded-[11px]">
            {/* Primary Role */}
            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Primary Role"
                description="Tells the AI which lens to use when tagging your bookmarks."
              />
              <Input className="w-64" placeholder="Your role" size="default" />
            </div>

            <div className="bg-border h-px w-full" />

            {/* Custom AI Context */}
            <div className="flex items-start justify-between gap-8">
              <SettingsLabel
                className="min-w-0 flex-1"
                title="Custom AI Context"
                description="Describe your workflow or what you're building. The AI uses this as a master prompt when generating tags and summaries."
              />
              <Textarea
                className="min-h-[92px] w-64"
                placeholder="e.g., I am a React developer focused on performance and design systems. I prefer technical but concise tags."
                size="default"
              />
            </div>

            <div className="bg-border h-px w-full" />

            {/* AI Optimization Toggle */}
            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Enable AI Optimization"
                description="Automatically use my role and context to improve link descriptions."
              />
              <Switch checked={true} onToggle={() => {}} size="md" className="hit-area-6" />
            </div>
          </SettingsFrame>

          {/* ─── Section 3: Discovery (Social Links) ─── */}
          <SettingsFrame title="Discovery">
            {/* GitHub */}
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="border-border text-secondary flex items-center justify-center rounded-md border p-1">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M11.0002 1.78812C16.0647 1.78812 20.1668 5.89021 20.1668 10.9548C20.1664 12.8754 19.5636 14.7476 18.4433 16.3077C17.3231 17.8679 15.7418 19.0373 13.922 19.6517C13.4637 19.7434 13.2918 19.4569 13.2918 19.2163C13.2918 18.9069 13.3033 17.9215 13.3033 16.6954C13.3033 15.8361 13.0168 15.2861 12.6845 14.9996C14.7241 14.7704 16.8668 13.9913 16.8668 10.4736C16.8668 9.46523 16.5116 8.65167 15.9272 8.01C16.0189 7.78083 16.3397 6.84125 15.8356 5.58083C15.8356 5.58083 15.0679 5.32875 13.3147 6.52042C12.5814 6.31417 11.8022 6.21104 11.0231 6.21104C10.2439 6.21104 9.46475 6.31417 8.73141 6.52042C6.97829 5.34021 6.21058 5.58083 6.21058 5.58083C5.70641 6.84125 6.02725 7.78083 6.11891 8.01C5.53454 8.65167 5.17933 9.47668 5.17933 10.4736C5.17933 13.9798 7.31058 14.7704 9.35016 14.9996C9.08662 15.2288 8.846 15.6298 8.76579 16.2256C8.23871 16.4663 6.921 16.8559 6.096 15.4694C5.92412 15.1944 5.4085 14.5184 4.68662 14.5298C3.91891 14.5413 4.37725 14.9652 4.69808 15.1371C5.08766 15.3548 5.53454 16.1684 5.63766 16.4319C5.821 16.9475 6.41683 17.9329 8.71996 17.509C8.71996 18.2767 8.73141 18.9986 8.73141 19.2163C8.73141 19.4569 8.55954 19.7319 8.10121 19.6517C6.27548 19.0439 4.68747 17.8768 3.56243 16.3158C2.43741 14.7547 1.83249 12.879 1.8335 10.9548C1.8335 5.89021 5.93558 1.78812 11.0002 1.78812Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <Label>GitHub</Label>
              </div>
              <InputGroup className="w-56">
                <InputGroupInput
                  aria-label="Enter your github username"
                  className="*:[input]:px-0!"
                  placeholder="username"
                  type="text"
                />
                <InputGroupAddon>
                  <InputGroupText>https://github.com/</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="bg-border h-px w-full" />

            {/* X (Twitter) */}
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="border-border text-secondary flex items-center justify-center rounded-md border p-1">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M16.1016 2.97916H18.8211L12.8798 9.77423L19.8692 19.0208H14.3966L10.1102 13.4128L5.20561 19.0208H2.48449L8.83925 11.7528L2.13428 2.97916H7.74587L11.6204 8.10509L16.1016 2.97916ZM15.1472 17.392H16.6541L6.92707 4.52245H5.31001L15.1472 17.392Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <Label>X (Twitter)</Label>
              </div>
              <InputGroup className="w-56">
                <InputGroupInput
                  aria-label="Enter your X username"
                  className="*:[input]:px-0!"
                  placeholder="username"
                  type="text"
                />
                <InputGroupAddon>
                  <InputGroupText>https://x.com/</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="bg-border h-px w-full" />

            {/* Personal Website */}
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="border-border text-secondary flex items-center justify-center rounded-md border p-1">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M19.25 11C19.25 15.5564 15.5564 19.25 11 19.25C6.44365 19.25 2.75 15.5564 2.75 11C2.75 6.44365 6.44365 2.75 11 2.75C15.5564 2.75 19.25 6.44365 19.25 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="square"
                    />
                    <path
                      d="M10.9998 19.25C9.22792 19.25 7.7915 15.5564 7.7915 11C7.7915 6.44365 9.22792 2.75 10.9998 2.75C12.7718 2.75 14.2082 6.44365 14.2082 11C14.2082 15.5564 12.7718 19.25 10.9998 19.25Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="square"
                    />
                    <path
                      d="M19.25 11H2.75"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="square"
                    />
                  </svg>
                </div>
                <Label>Personal Website</Label>
              </div>
              <Input className="w-56" placeholder="https://yoursite.com" />
            </div>
          </SettingsFrame>

          {/* ─── Section 4: Privacy ─── */}
          <SettingsFrame title="Privacy">
            {/* Public Profile */}
            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Make my profile public"
                description="Allow others to see your public sections and shared collections."
              />
              <Switch checked={true} onToggle={() => {}} size="md" className="hit-area-6" />
            </div>

            <div className="bg-border h-px w-full" />

            {/* Show Social Links */}
            <div className="flex items-center justify-between">
              <SettingsLabel
                title="Display social links on public pages"
                description="Show your GitHub, X, and website to visitors of your public profile."
              />
              <Switch checked={true} onToggle={() => {}} size="md" className="hit-area-6" />
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

export default PersonalizationSettings;
