import React from "react";
import {Frame, FrameHeader, FramePanel, FrameTitle} from "@/components/coss-ui/frame";
import {Label} from "@/components/coss-ui/label";
import {cn} from "@/lib/utils/classnames";

export const SettingsHeader = ({
  title,
  description,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
}) => {
  return (
    <div className="space-y-0.5">
      <h1 className="text-foreground text-xl font-[550]">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
};

export const SettingsFrame = ({
  title,
  children,
  className,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Frame className={cn("w-full", className)}>
      <FrameHeader>
        <FrameTitle className="text-muted-foreground text-sm font-normal">{title}</FrameTitle>
      </FrameHeader>
      <FramePanel className="space-y-4">{children}</FramePanel>
    </Frame>
  );
};

export const SettingsLabel = ({
  title,
  description,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("space-y-0.5", className)}>
      <Label>{title}</Label>
      {description && <p className="text-muted-foreground max-w-[440px] text-sm">{description}</p>}
    </div>
  );
};
