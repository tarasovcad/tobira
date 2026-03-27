"use client";

import React from "react";

import {useTheme} from "next-themes";

import {cn} from "@/lib/utils";

type ThemeKey = "light" | "dark" | "system";

type ThemeOption = {
  key: ThemeKey;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
};

const themes: ThemeOption[] = [
  {
    key: "system",
    Icon: (props) => (
      <svg
        {...props}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.99992 2C2.52716 2 1.33325 3.19391 1.33325 4.66667V8H14.6666V4.66667C14.6666 3.19391 13.4727 2 11.9999 2H3.99992Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.33325 9.33325H14.6666C14.6666 10.806 13.4727 11.9999 11.9999 11.9999H9.99992V13.9999C9.99992 14.3681 9.70145 14.6666 9.33325 14.6666H6.66659C6.2984 14.6666 5.99992 14.3681 5.99992 13.9999V11.9999H3.99992C2.52716 11.9999 1.33325 10.806 1.33325 9.33325ZM7.33325 11.9999V13.3333H8.66659V11.9999H7.33325Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "System theme",
  },
  {
    key: "light",
    Icon: (props) => (
      <svg
        {...props}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8.66659 1.33341C8.66659 0.965228 8.36812 0.666748 7.99992 0.666748C7.63172 0.666748 7.33325 0.965228 7.33325 1.33341V2.00008C7.33325 2.36827 7.63172 2.66675 7.99992 2.66675C8.36812 2.66675 8.66659 2.36827 8.66659 2.00008V1.33341Z"
          fill="currentColor"
        />
        <path
          d="M8.66659 13.9999C8.66659 13.6317 8.36812 13.3333 7.99992 13.3333C7.63172 13.3333 7.33325 13.6317 7.33325 13.9999V14.6666C7.33325 15.0348 7.63172 15.3333 7.99992 15.3333C8.36812 15.3333 8.66659 15.0348 8.66659 14.6666V13.9999Z"
          fill="currentColor"
        />
        <path
          d="M13.1847 2.81538C13.445 3.07573 13.445 3.49784 13.1847 3.75819L12.7113 4.23152C12.451 4.49187 12.0289 4.49187 11.7685 4.23152C11.5082 3.97118 11.5082 3.54906 11.7685 3.28872L12.2418 2.81538C12.5022 2.55503 12.9243 2.55503 13.1847 2.81538Z"
          fill="currentColor"
        />
        <path
          d="M4.23152 12.7113C4.49187 12.451 4.49187 12.0288 4.23152 11.7685C3.97117 11.5082 3.54906 11.5082 3.28871 11.7685L2.81538 12.2418C2.55503 12.5022 2.55503 12.9243 2.81538 13.1846C3.07572 13.445 3.49784 13.445 3.75818 13.1846L4.23152 12.7113Z"
          fill="currentColor"
        />
        <path
          d="M13.3333 7.99992C13.3333 7.63172 13.6317 7.33325 13.9999 7.33325H14.6666C15.0348 7.33325 15.3333 7.63172 15.3333 7.99992C15.3333 8.36812 15.0348 8.66659 14.6666 8.66659H13.9999C13.6317 8.66659 13.3333 8.36812 13.3333 7.99992Z"
          fill="currentColor"
        />
        <path
          d="M1.33341 7.33325C0.965228 7.33325 0.666748 7.63172 0.666748 7.99992C0.666748 8.36812 0.965228 8.66659 1.33341 8.66659H2.00008C2.36827 8.66659 2.66675 8.36812 2.66675 7.99992C2.66675 7.63172 2.36827 7.33325 2.00008 7.33325H1.33341Z"
          fill="currentColor"
        />
        <path
          d="M11.7685 11.7685C12.0289 11.5082 12.451 11.5082 12.7113 11.7685L13.1847 12.2418C13.445 12.5022 13.445 12.9243 13.1847 13.1846C12.9243 13.445 12.5022 13.445 12.2418 13.1846L11.7685 12.7113C11.5082 12.451 11.5082 12.0288 11.7685 11.7685Z"
          fill="currentColor"
        />
        <path
          d="M3.75818 2.81538C3.49784 2.55503 3.07572 2.55503 2.81538 2.81538C2.55503 3.07573 2.55503 3.49784 2.81538 3.75819L3.28871 4.23152C3.54906 4.49187 3.97117 4.49187 4.23152 4.23152C4.49187 3.97118 4.49187 3.54906 4.23152 3.28872L3.75818 2.81538Z"
          fill="currentColor"
        />
        <path
          d="M5.17158 5.17158C6.73367 3.60947 9.26634 3.60947 10.8284 5.17158C12.3905 6.73367 12.3905 9.26634 10.8284 10.8284C9.26634 12.3905 6.73367 12.3905 5.17158 10.8284C3.60947 9.26634 3.60947 6.73367 5.17158 5.17158Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Light theme",
  },
  {
    key: "dark",
    Icon: (props) => (
      <svg
        {...props}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8.03439 2.39973C8.18072 2.18741 8.19145 1.90973 8.06199 1.68673C7.93252 1.46371 7.68605 1.33535 7.42912 1.35713C4.01419 1.64649 1.33325 4.50907 1.33325 7.99852C1.33325 11.6797 4.31747 14.6639 7.99865 14.6639C11.4882 14.6639 14.3509 11.9829 14.6401 8.56785C14.6619 8.31085 14.5335 8.06445 14.3105 7.93499C14.0875 7.80552 13.8098 7.81632 13.5975 7.96265C12.9534 8.40659 12.1734 8.66645 11.3307 8.66645C9.12152 8.66645 7.33065 6.87559 7.33065 4.66643C7.33065 3.82377 7.59045 3.0438 8.03439 2.39973Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Dark theme",
  },
];

export default function ThemeToggle() {
  const {theme, setTheme} = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div
      className={cn(
        "ring-border relative isolate flex gap-0.5 rounded-full bg-[rgba(255,255,255,0)] p-0.5 shadow-[0_2px_4px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.06)] ring-1",
      )}>
      {themes.map(({key, Icon, label}) => {
        const isActive = theme === key;

        return (
          <button
            aria-label={label}
            className={cn(
              "inline-flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 ease-out [&>svg]:size-4",
              isActive
                ? "bg-[#F0F0F0] text-[#202020] dark:bg-[#181717]"
                : "bg-transparent text-[#BBBBBB]",
            )}
            key={key}
            onClick={() => setTheme(key)}
            type="button">
            <Icon
              className={cn(
                "relative z-10 m-auto h-4 w-4 shrink-0",
                isActive ? "text-foreground" : "text-[#BBBBBB] dark:text-[#606060]",
              )}
              aria-hidden="true"
              focusable="false"
            />
          </button>
        );
      })}
    </div>
  );
}
