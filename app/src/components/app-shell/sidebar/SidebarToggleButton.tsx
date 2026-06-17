"use client";

import {cn} from "@/lib/utils";
import {useSidebarStore} from "@/store/use-sidebar-store";
import {Tooltip, TooltipPopup, TooltipTrigger} from "@/components/ui/coss/tooltip";
import {Kbd, KbdGroup} from "@/components/ui/coss/kbd";
import {CommandIcon} from "lucide-react";

export function SidebarToggleButton({
  isCollapsed,
  disabled = false,
}: {
  isCollapsed: boolean;
  disabled?: boolean;
}) {
  const toggleSidebar = useSidebarStore((s) => s.toggleSidebar);
  const label = isCollapsed ? "Expand sidebar" : "Collapse sidebar";

  const icon = (
    <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "transition-[transform,color] duration-150 ease-out",
          isCollapsed ? "rotate-180" : "",
        )}>
        <path
          d="M5.83333 2.5C3.99238 2.5 2.5 3.99238 2.5 5.83333V14.1667C2.5 16.0076 3.99238 17.5 5.83333 17.5V2.5Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.5 17.5H14.1667C16.0076 17.5 17.5 16.0076 17.5 14.1667V5.83333C17.5 3.99238 16.0076 2.5 14.1667 2.5H7.5V17.5ZM13.9226 7.74407C14.248 8.06952 14.248 8.59717 13.9226 8.92258L12.8452 10L13.9226 11.0774C14.248 11.4028 14.248 11.9305 13.9226 12.2559C13.5972 12.5813 13.0695 12.5813 12.7441 12.2559L11.0774 10.5892C10.752 10.2638 10.752 9.73617 11.0774 9.41075L12.7441 7.74407C13.0695 7.41864 13.5972 7.41864 13.9226 7.74407Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );

  const buttonClassName = cn(
    "flex w-fit items-center rounded-md text-sm font-medium transition-[padding] duration-50 ease-linear",
    "hover:bg-muted hover:text-foreground cursor-pointer bg-transparent",
    "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
    "justify-start px-[7.5px] py-[7.5px]",
    "text-secondary",
    disabled && "pointer-events-none cursor-default",
  );

  if (disabled) {
    return (
      <button type="button" disabled aria-label={label} className={buttonClassName}>
        {icon}
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={label}
            className={buttonClassName}
          />
        }>
        {icon}
      </TooltipTrigger>
      <TooltipPopup side="right" align="center" sideOffset={6} size="md">
        <span className="flex items-center gap-2">
          <span>{label}</span>
          <KbdGroup aria-label="Command B">
            <Kbd>
              <CommandIcon aria-hidden="true" />
            </Kbd>
            <Kbd>B</Kbd>
          </KbdGroup>
        </span>
      </TooltipPopup>
    </Tooltip>
  );
}
