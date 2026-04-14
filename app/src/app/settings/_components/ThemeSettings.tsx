"use client";

import React, {useSyncExternalStore} from "react";
import {cn} from "@/lib/utils";
import {useTheme} from "next-themes";

/* â”€â”€â”€ Light theme preview icon â”€â”€â”€ */
function LightThemeIcon() {
  return (
    <div className="h-[67px] w-[118px] overflow-hidden rounded-[6px] border border-[#D3D3D3] bg-[#E5E5E5] pt-[8px] pl-[8px]">
      <div className="h-full w-full rounded-tl-[8px] border-t border-l border-[#D3D3D3] bg-[#F6F6F6] pt-[7px] pl-[7px]">
        <div className="flex items-center gap-4">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.02645 1.11454C6.44878 0.628485 7.20351 0.628485 7.62585 1.11454L8.16178 1.73143C8.40151 2.00732 8.76651 2.14016 9.12745 2.0829L9.93458 1.95486C10.5705 1.85398 11.1486 2.33909 11.1597 2.9829L11.1738 3.79999C11.1801 4.16541 11.3743 4.50177 11.6876 4.68993L12.3882 5.11066C12.9402 5.44213 13.0712 6.18539 12.6659 6.68573L12.1515 7.32066C11.9214 7.60466 11.854 7.98712 11.973 8.33266L12.2393 9.10532C12.449 9.71406 12.0717 10.3677 11.4396 10.4904L10.6374 10.6461C10.2786 10.7157 9.98104 10.9654 9.85018 11.3067L9.55751 12.0697C9.32691 12.6709 8.61771 12.929 8.05458 12.6167L7.33998 12.2203C7.02031 12.0431 6.63191 12.0431 6.31232 12.2203L5.59772 12.6167C5.03459 12.929 4.3254 12.6709 4.0948 12.0697L3.80212 11.3067C3.67123 10.9654 3.37369 10.7157 3.01492 10.6461L2.21269 10.4904C1.58058 10.3677 1.20323 9.71406 1.41301 9.10532L1.67926 8.33266C1.79833 7.98712 1.73088 7.60466 1.50081 7.32066L0.986375 6.68573C0.581029 6.18539 0.712082 5.44213 1.26409 5.11066L1.96469 4.68993C2.278 4.50177 2.4722 4.16541 2.47849 3.79999L2.49256 2.9829C2.50364 2.33909 3.08177 1.85398 3.71772 1.95486L4.52484 2.0829C4.8858 2.14016 5.25078 2.00732 5.49048 1.73143L6.02645 1.11454Z"
              fill="#3788FF"
              stroke="#3788FF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M5.16016 7.08333L5.92449 7.84766C6.05462 7.9778 6.26569 7.9778 6.39589 7.84766L8.49349 5.75"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex items-center gap-[3px]">
            <div className="h-[6px] w-[19px] rounded-full bg-[#BBBBBB]"></div>
            <div className="h-[6px] w-[19px] rounded-full bg-[#D9D9D9]"></div>
            <div className="h-[6px] w-[19px] rounded-full bg-[#D9D9D9]"></div>
          </div>
        </div>
        <div className="mt-[4px] h-full w-full rounded-tl-[8px] border-t border-l border-[#EBEBEB] bg-[#FFFFFF] pt-[7px] pl-[7px]">
          <div className="flex items-center gap-[3px]">
            <div className="h-[6px] w-[21px] rounded-full bg-[#E0E0E0]"></div>
            <div className="h-[6px] w-[15px] rounded-full bg-[#3788FF]"></div>
          </div>
          <div className="mt-[6px] h-[6px] w-[73px] rounded-full bg-[#E0E0E0]"></div>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ Dark theme preview icon â”€â”€â”€ */
function DarkThemeIcon({removeLeftRounded}: {removeLeftRounded?: boolean}) {
  return (
    <div
      className={cn(
        "h-[67px] w-[118px] overflow-hidden rounded-[6px] border border-[#5A5A5A] bg-[#252525] pt-[8px] pl-[8px]",
        removeLeftRounded ? "rounded-l-none" : "",
      )}>
      <div className="h-full w-full rounded-tl-[8px] border-t border-l border-[#4E4E4E] bg-[#363636] pt-[7px] pl-[7px]">
        <div className="flex items-center gap-4">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.02645 1.11454C6.44878 0.628485 7.20351 0.628485 7.62585 1.11454L8.16178 1.73143C8.40151 2.00732 8.76651 2.14016 9.12745 2.0829L9.93458 1.95486C10.5705 1.85398 11.1486 2.33909 11.1597 2.9829L11.1738 3.79999C11.1801 4.16541 11.3743 4.50177 11.6876 4.68993L12.3882 5.11066C12.9402 5.44213 13.0712 6.18539 12.6659 6.68573L12.1515 7.32066C11.9214 7.60466 11.854 7.98712 11.973 8.33266L12.2393 9.10532C12.449 9.71406 12.0717 10.3677 11.4396 10.4904L10.6374 10.6461C10.2786 10.7157 9.98104 10.9654 9.85018 11.3067L9.55751 12.0697C9.32691 12.6709 8.61771 12.929 8.05458 12.6167L7.33998 12.2203C7.02031 12.0431 6.63191 12.0431 6.31232 12.2203L5.59772 12.6167C5.03459 12.929 4.3254 12.6709 4.0948 12.0697L3.80212 11.3067C3.67123 10.9654 3.37369 10.7157 3.01492 10.6461L2.21269 10.4904C1.58058 10.3677 1.20323 9.71406 1.41301 9.10532L1.67926 8.33266C1.79833 7.98712 1.73088 7.60466 1.50081 7.32066L0.986375 6.68573C0.581029 6.18539 0.712082 5.44213 1.26409 5.11066L1.96469 4.68993C2.278 4.50177 2.4722 4.16541 2.47849 3.79999L2.49256 2.9829C2.50364 2.33909 3.08177 1.85398 3.71772 1.95486L4.52484 2.0829C4.8858 2.14016 5.25078 2.00732 5.49048 1.73143L6.02645 1.11454Z"
              fill="#3788FF"
              stroke="#3788FF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M5.16016 7.08333L5.92449 7.84766C6.05462 7.9778 6.26569 7.9778 6.39589 7.84766L8.49349 5.75"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="flex items-center gap-[3px]">
            <div className="h-[6px] w-[19px] rounded-full bg-[#AFAFAF]"></div>
            <div className="h-[6px] w-[19px] rounded-full bg-[#666666]"></div>
            <div className="h-[6px] w-[19px] rounded-full bg-[#666666]"></div>
          </div>
        </div>
        <div className="mt-[4px] h-full w-full rounded-tl-[8px] border-t border-l border-[#515151] bg-[#454545] pt-[7px] pl-[7px]">
          <div className="flex items-center gap-[3px]">
            <div className="h-[6px] w-[21px] rounded-full bg-[#5C5C5C]"></div>
            <div className="h-[6px] w-[15px] rounded-full bg-[#3788FF]"></div>
          </div>
          <div className="mt-[6px] h-[6px] w-[73px] rounded-full bg-[#5C5C5C]"></div>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ Auto (split) theme preview icon â”€â”€â”€ */
function AutoThemeIcon() {
  return (
    <div className="relative h-[67px] w-[118px] overflow-hidden rounded-[6px]">
      <div className="absolute inset-0 w-1/2 overflow-hidden">
        <LightThemeIcon />
      </div>
      <div className="absolute inset-0 left-1/2 w-1/2 overflow-hidden">
        <DarkThemeIcon removeLeftRounded />
      </div>
    </div>
  );
}

const THEME_OPTIONS = [
  {key: "light", label: "Light", icon: LightThemeIcon},
  {key: "dark", label: "Dark", icon: DarkThemeIcon},
  {key: "system", label: "Auto", icon: AutoThemeIcon},
] as const;

/* Stable subscription functions for hydration check */
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeSettings() {
  const {theme, setTheme} = useTheme();

  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return (
      <div className="flex items-start gap-4">
        {THEME_OPTIONS.map(({key, label, icon: Icon}) => (
          <div key={key} className="flex flex-col items-center gap-2">
            <div className="ring-offset-background hover:ring-muted-foreground/40 cursor-pointer rounded-[6px] transition-all duration-150 hover:ring-2 hover:ring-offset-[1.5px]">
              <Icon />
            </div>
            <span className="text-muted-foreground text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      {THEME_OPTIONS.map(({key, label, icon: Icon}) => (
        <div key={key} className="flex flex-col items-center gap-2">
          <button
            type="button"
            aria-label={`Switch to ${label} theme`}
            onClick={() => setTheme(key)}
            className={`cursor-pointer rounded-[6px] transition-all duration-150 ${
              theme === key
                ? "ring-offset-background ring-2 ring-[var(--highlight-hovered)] ring-offset-[1.5px]"
                : "ring-offset-background hover:ring-muted-foreground/40 hover:ring-2 hover:ring-offset-[1.5px]"
            }`}>
            <Icon />
          </button>
          <span
            className={`text-xs font-medium ${
              theme === key ? "text-foreground" : "text-muted-foreground"
            }`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
