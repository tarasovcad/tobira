import React from "react";
import {Frame, FrameHeader, FramePanel, FrameTitle} from "@/components/ui/coss/frame";
import {Label} from "@/components/ui/coss/label";
import {cn} from "@/lib/utils";

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
  inDevelopment,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  inDevelopment?: boolean;
}) => {
  return (
    <div className={cn("space-y-0.5", className)}>
      <div className="flex w-fit items-center gap-2">
        <Label>{title}</Label>{" "}
        {inDevelopment && (
          <p className="text-muted-foreground text-base sm:text-sm">(Coming Soon)</p>
        )}
      </div>
      {description && <p className="text-muted-foreground max-w-[440px] text-sm">{description}</p>}
    </div>
  );
};
