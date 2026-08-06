"use client";

import {useDeferredValue, useState} from "react";
import type {ReactNode} from "react";
import {PageHeader} from "@/components/ui/app/page/PageHeader";
import {Button} from "@/components/ui/coss/button";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/coss/input-group";
import {ScrollArea} from "@/components/ui/coss/scroll-area";

type Shortcut = {
  action: string;
  context?: string;
  keys: string[][];
  separator?: "or" | "then";
};

type ShortcutSection = {
  title: string;
  description: string;
  shortcuts: Shortcut[];
};

type Platform = "mac" | "other" | "unknown";

const shortcutSections: ShortcutSection[] = [
  {
    title: "General",
    description: "Move around Tobira and adjust your workspace.",
    shortcuts: [
      {
        action: "Toggle the sidebar",
        context: "Available throughout the app",
        keys: [
          ["Ctrl", "B"],
          ["Cmd", "B"],
        ],
      },
      {
        action: "Cycle bookmark layouts",
        context: "Home, collection, and tag bookmark pages",
        keys: [["Shift", "V"]],
      },
      {
        action: "Clear the current selection",
        context: "Bookmark, collection, tag, and bin selection modes",
        keys: [["Esc"]],
      },
    ],
  },
  {
    title: "Media previews",
    description: "Open, inspect, and move through image and video previews.",
    shortcuts: [
      {
        action: "Open the focused media preview",
        keys: [["Enter"], ["Space"]],
      },
      {
        action: "Open or close an image preview",
        context: "Hover or focus the image first",
        keys: [["F"]],
      },
      {
        action: "Close the current media preview",
        keys: [["Esc"]],
      },
      {
        action: "Zoom an image in",
        context: "While an image preview is open",
        keys: [["+"]],
      },
      {
        action: "Zoom an image out",
        context: "While an image preview is open",
        keys: [["-"]],
      },
      {
        action: "Move to the previous gallery item",
        keys: [["Left"]],
      },
      {
        action: "Move to the next gallery item",
        keys: [["Right"]],
      },
    ],
  },
  {
    title: "Video player",
    description: "Control a video while its player is hovered, focused, or fullscreen.",
    shortcuts: [
      {
        action: "Play or pause",
        keys: [["Space"], ["K"]],
      },
      {
        action: "Mute or unmute",
        keys: [["M"]],
      },
      {
        action: "Open the preview or toggle fullscreen",
        keys: [["F"]],
      },
      {
        action: "Increase volume",
        context: "When the volume control is focused",
        keys: [["Up"], ["Right"]],
      },
      {
        action: "Decrease volume",
        context: "When the volume control is focused",
        keys: [["Down"], ["Left"]],
      },
      {
        action: "Set volume to 0%",
        context: "When the volume control is focused",
        keys: [["Home"]],
      },
      {
        action: "Set volume to 100%",
        context: "When the volume control is focused",
        keys: [["End"]],
      },
    ],
  },
  {
    title: "Tag input",
    description: "Use the keyboard while adding tags to a bookmark.",
    shortcuts: [
      {
        action: "Accept the visible tag suggestion",
        keys: [["Tab"], ["Right"]],
      },
      {
        action: "Add the typed tag",
        keys: [["Enter"], [","]],
      },
      {
        action: "Remove the last tag",
        context: "When the input is empty",
        keys: [["Backspace"]],
      },
    ],
  },
  {
    title: "Chrome extension",
    description: "Save the page you are viewing without opening Tobira.",
    shortcuts: [
      {
        action: "Save the current page to Tobira",
        context: "The assigned shortcut can be changed in Chrome's extension settings",
        keys: [
          ["Ctrl", "Shift", "S"],
          ["Cmd", "Shift", "S"],
        ],
      },
      {
        action: "Save from the Chrome address bar",
        context: "Type tobira, enter keyword mode, then submit",
        keys: [["tobira"], ["Enter"]],
        separator: "then",
      },
    ],
  },
];

function getPlatformCombinations(keys: string[][], platform: Platform) {
  if (platform === "unknown") return keys;

  const modifier = platform === "mac" ? "Cmd" : "Ctrl";

  return keys
    .filter((combination) =>
      combination.some((key) => key === "Ctrl" || key === "Cmd")
        ? combination.includes(modifier)
        : true,
    )
    .map((combination) =>
      combination.map((key) => (key === "Ctrl" || key === "Cmd" ? modifier : key)),
    );
}

function renderKey(key: string, platform: Platform): ReactNode {
  if (key === "+") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 1.84961C8.45104 1.84961 8.81641 2.21596 8.81641 2.66699V7.18359H13.333C13.7841 7.18359 14.1504 7.54896 14.1504 8C14.1504 8.45104 13.7841 8.81641 13.333 8.81641H8.81641V13.333C8.81641 13.7841 8.45104 14.1504 8 14.1504C7.54896 14.1504 7.18359 13.7841 7.18359 13.333V8.81641H2.66699C2.21596 8.81641 1.84961 8.45104 1.84961 8C1.84961 7.54896 2.21596 7.18359 2.66699 7.18359H7.18359V2.66699C7.18359 2.21596 7.54896 1.84961 8 1.84961Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0.3"
        />
      </svg>
    );
  }

  if (key === "-") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12.4443 7.18295C12.8584 7.18295 13.1504 7.57606 13.1504 8.00034C13.1502 8.42448 12.8583 8.81674 12.4443 8.81674H3.55566C3.14166 8.81674 2.84976 8.42449 2.84961 8.00034C2.84961 7.57606 3.14156 7.18295 3.55566 7.18295H12.4443Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0.3"
        />
      </svg>
    );
  }

  if (platform !== "mac" && !["Left", "Right", "Up", "Down"].includes(key)) {
    return key === "Cmd" ? "Command" : key === "Option" ? "Alt" : key;
  }

  switch (key) {
    case "Cmd":
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2 4.33333C2 3.04467 3.04467 2 4.33333 2C5.622 2 6.66667 3.04467 6.66667 4.33333V5.66667H9.33333V4.33333C9.33333 3.04467 10.378 2 11.6667 2C12.9553 2 14 3.04467 14 4.33333C14 5.622 12.9553 6.66667 11.6667 6.66667H10.3333V9.33333H11.6667C12.9553 9.33333 14 10.378 14 11.6667C14 12.9553 12.9553 14 11.6667 14C10.378 14 9.33333 12.9553 9.33333 11.6667V10.3333H6.66667V11.6667C6.66667 12.9553 5.622 14 4.33333 14C3.04467 14 2 12.9553 2 11.6667C2 10.378 3.04467 9.33333 4.33333 9.33333H5.66667V6.66667H4.33333C3.04467 6.66667 2 5.622 2 4.33333ZM5.66667 5.66667V4.33333C5.66667 3.59695 5.06971 3 4.33333 3C3.59695 3 3 3.59695 3 4.33333C3 5.06971 3.59695 5.66667 4.33333 5.66667H5.66667ZM6.66667 6.66667V9.33333H9.33333V6.66667H6.66667ZM5.66667 10.3333H4.33333C3.59695 10.3333 3 10.9303 3 11.6667C3 12.4031 3.59695 13 4.33333 13C5.06971 13 5.66667 12.4031 5.66667 11.6667V10.3333ZM10.3333 10.3333V11.6667C10.3333 12.4031 10.9303 13 11.6667 13C12.4031 13 13 12.4031 13 11.6667C13 10.9303 12.4031 10.3333 11.6667 10.3333H10.3333ZM10.3333 5.66667H11.6667C12.4031 5.66667 13 5.06971 13 4.33333C13 3.59695 12.4031 3 11.6667 3C10.9303 3 10.3333 3.59695 10.3333 4.33333V5.66667Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.4"
          />
        </svg>
      );
    case "Alt":
    case "Option":
      return platform === "mac" ? "⌥" : "Alt";
    case "Shift":
      return platform === "mac" ? (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M13.2343 2.51905C12.5352 1.82698 11.4648 1.82698 10.7657 2.51904L2.59995 10.6028C1.36576 11.8246 2.16299 14.0533 3.83423 14.0533H6.50836V17.0305C6.50836 19.2227 8.14749 21 10.1695 21H13.8305C15.8526 21 17.4916 19.2227 17.4916 17.0305V14.0533H20.1658C21.837 14.0533 22.6343 11.8246 21.4 10.6028L13.2343 2.51905Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        "Shift"
      );
    case "Enter":
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M13.333 2.51627C13.7841 2.51627 14.1504 2.88262 14.1504 3.33365V7.99966C14.1504 9.55524 12.8886 10.817 11.333 10.817H4.63867L5.91113 12.0895C6.22963 12.4083 6.22963 12.925 5.91113 13.2438C5.5922 13.5627 5.07479 13.5627 4.75586 13.2438L2.08887 10.5778C1.76999 10.2589 1.7701 9.74144 2.08887 9.42252L4.75586 6.75552C5.0748 6.43676 5.59226 6.43665 5.91113 6.75552C6.23001 7.07438 6.2299 7.59187 5.91113 7.9108L4.6377 9.18326H11.333C11.9866 9.18326 12.5166 8.65322 12.5166 7.99966V3.33365C12.5166 2.88273 12.8821 2.51644 13.333 2.51627Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.2"
          />
        </svg>
      );
    case "Backspace":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.41755 4C8.22054 4 7.08644 4.53608 6.32664 5.46104L3.04093 9.46104C1.8288 10.9367 1.8288 13.0633 3.04093 14.539L6.32664 18.539C7.08643 19.4639 8.22054 20 9.41755 20H17.9995C20.2086 20 21.9995 18.2091 21.9995 16V8C21.9995 5.79086 20.2086 4 17.9995 4H9.41755ZM10.5407 9.29289C10.9312 8.90237 11.5644 8.90237 11.9549 9.29289L13.2495 10.5875L14.544 9.29289C14.9346 8.90237 15.5677 8.90237 15.9582 9.29289C16.3488 9.68342 16.3488 10.3166 15.9582 10.7071L14.6637 12.0017L15.9566 13.2946C16.3471 13.6851 16.3471 14.3182 15.9566 14.7088C15.5661 15.0993 14.9329 15.0993 14.5424 14.7088L13.2495 13.4159L11.9566 14.7088C11.5661 15.0993 10.9329 15.0993 10.5424 14.7088C10.1518 14.3182 10.1518 13.6851 10.5424 13.2946L11.8353 12.0017L10.5407 10.7071C10.1502 10.3166 10.1502 9.68342 10.5407 9.29289Z"
            fill="currentColor"
          />
        </svg>
      );
    case "Left":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.0607 18.5607C10.4749 19.1464 9.52513 19.1464 8.93934 18.5607L3.43934 13.0607C3.15804 12.7794 3 12.3978 3 12C3 11.6022 3.15803 11.2207 3.43934 10.9394L8.93934 5.43934C9.52512 4.85355 10.4749 4.85355 11.0607 5.43934C11.6464 6.02512 11.6464 6.97487 11.0607 7.56066L8.12131 10.5H19.5C20.3284 10.5 21 11.1716 21 12C21 12.8284 20.3284 13.5 19.5 13.5H8.12133L11.0607 16.4393C11.6464 17.0251 11.6464 17.9749 11.0607 18.5607Z"
            fill="currentColor"
          />
        </svg>
      );
    case "Right":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.9393 5.43934C13.5251 4.85355 14.4749 4.85355 15.0607 5.43934L20.5607 10.9393C20.842 11.2206 21 11.6022 21 12C21 12.3978 20.842 12.7793 20.5607 13.0606L15.0607 18.5607C14.4749 19.1464 13.5251 19.1464 12.9393 18.5607C12.3536 17.9749 12.3536 17.0251 12.9393 16.4393L15.8787 13.5H4.5C3.67157 13.5 3 12.8284 3 12C3 11.1716 3.67157 10.5 4.5 10.5H15.8787L12.9393 7.56066C12.3536 6.97488 12.3536 6.02513 12.9393 5.43934Z"
            fill="currentColor"
          />
        </svg>
      );
    case "Up":
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3.62652 7.3738C3.23606 6.98327 3.23606 6.35009 3.62652 5.95956L7.29319 2.29289C7.48072 2.10536 7.73512 2 8.00032 2C8.26552 2 8.51986 2.10535 8.70739 2.29289L12.3741 5.95956C12.7646 6.35008 12.7646 6.98327 12.3741 7.3738C11.9836 7.76427 11.3504 7.76427 10.9599 7.3738L9.00032 5.41421L9.00032 13C9.00032 13.5523 8.55259 14 8.00032 14C7.44806 14 7.00032 13.5523 7.00032 13L7.00032 5.41422L5.04079 7.3738C4.65026 7.76427 4.01706 7.76427 3.62652 7.3738Z"
            fill="currentColor"
          />
        </svg>
      );
    case "Down":
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12.3735 8.6262C12.7639 9.01673 12.7639 9.64991 12.3735 10.0404L8.70681 13.7071C8.51928 13.8946 8.26488 14 7.99968 14C7.73448 14 7.48014 13.8946 7.29261 13.7071L3.6259 10.0404C3.23538 9.64992 3.23538 9.01673 3.6259 8.6262C4.01642 8.23573 4.64959 8.23573 5.04012 8.6262L6.99968 10.5858V3C6.99968 2.44773 7.44741 2 7.99968 2C8.55194 2 8.99968 2.44773 8.99968 3V10.5858L10.9592 8.6262C11.3497 8.23573 11.9829 8.23573 12.3735 8.6262Z"
            fill="currentColor"
          />
        </svg>
      );
    case "Ctrl":
      return platform === "mac" ? "⌃" : "Ctrl";
    default:
      return key;
  }
}

function ShortcutKeys({
  keys,
  platform,
  separator = "or",
}: Pick<Shortcut, "keys" | "separator"> & {platform: Platform}) {
  const platformKeys = getPlatformCombinations(keys, platform);

  return (
    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
      {platformKeys.map((combination, index) => (
        <div key={combination.join("+")} className="flex items-center gap-2">
          {index > 0 ? <span className="text-muted-foreground text-xs">{separator}</span> : null}
          <Button
            variant="kbd"
            size="xs"
            aria-label={`Use ${combination.join(" plus ")} shortcut`}
            className="shrink-0 font-sans text-sm! font-medium">
            {combination.map((key, keyIndex) => (
              <span key={key} className="inline-flex items-center gap-1">
                {renderKey(key, platform)}
                {keyIndex < combination.length - 1 ? (
                  <span className="text-muted-foreground"> + </span>
                ) : null}
              </span>
            ))}
          </Button>
        </div>
      ))}
    </div>
  );
}

function ShortcutRow({action, keys, platform, separator}: Shortcut & {platform: Platform}) {
  return (
    <li className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-foreground text-sm font-medium">{action}</p>
      </div>
      <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
        <ShortcutKeys keys={keys} platform={platform} separator={separator} />
        {/*<div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Reset ${action} shortcut`}
            className="bg-muted-foreground/7 text-foreground/80 hover:bg-muted hover:text-foreground! [&_svg]:size-4!">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.33343 2C3.70161 2 4.00009 2.29848 4.00009 2.66667V3.61551C4.33177 3.30845 4.67983 3.03617 5.05348 2.80683C5.90876 2.28185 6.8682 2 8.019 2C11.3327 2 14.019 4.68629 14.019 8C14.019 11.3137 11.3327 14 8.019 14C5.40549 14 3.18391 12.3294 2.36055 9.99993C2.23785 9.6528 2.41981 9.27193 2.76695 9.1492C3.11409 9.02653 3.49497 9.20847 3.61767 9.5556C4.25863 11.3691 5.98811 12.6667 8.019 12.6667C10.5963 12.6667 12.6857 10.5773 12.6857 8C12.6857 5.42267 10.5963 3.33333 8.019 3.33333C7.10573 3.33333 6.38911 3.55148 5.75095 3.94317C5.43484 4.13721 5.13116 4.37798 4.82848 4.66667H6.0001C6.36828 4.66667 6.66674 4.96515 6.66674 5.33333C6.66674 5.70152 6.36828 6 6.0001 6H3.33343C2.96523 6 2.66676 5.70152 2.66676 5.33333V2.66667C2.66676 2.29848 2.96523 2 3.33343 2Z"
                fill="currentColor"
              />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Delete ${action} shortcut`}
            className="bg-muted-foreground/7 text-foreground/80 hover:bg-muted hover:text-foreground! [&_svg]:size-4!">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.24552 3.33334H2.1665C1.89036 3.33334 1.6665 3.5572 1.6665 3.83334C1.6665 4.10948 1.89036 4.33334 2.1665 4.33334H2.66648C2.6665 4.34494 2.66691 4.35662 2.66773 4.36836L3.22761 12.3418C3.31956 13.6513 4.40871 14.6667 5.72147 14.6667H10.2782C11.591 14.6667 12.6801 13.6513 12.772 12.3418L13.332 4.36836C13.3328 4.35662 13.3332 4.34494 13.3332 4.33334H13.8332C14.1093 4.33334 14.3332 4.10948 14.3332 3.83334C14.3332 3.5572 14.1093 3.33334 13.8332 3.33334H10.7542C10.4542 2.09005 9.33524 1.16667 7.9999 1.16667C6.66455 1.16667 5.5455 2.09005 5.24552 3.33334ZM6.2914 3.33334H9.70837C9.4417 2.65056 8.77704 2.16667 7.9999 2.16667C7.2227 2.16667 6.55804 2.65056 6.2914 3.33334ZM6.6665 6.50001C6.94264 6.50001 7.1665 6.72387 7.1665 7.00001V10.8333C7.1665 11.1095 6.94264 11.3333 6.6665 11.3333C6.39036 11.3333 6.1665 11.1095 6.1665 10.8333V7.00001C6.1665 6.72387 6.39036 6.50001 6.6665 6.50001ZM9.33317 6.50001C9.6093 6.50001 9.83317 6.72387 9.83317 7.00001V10.8333C9.83317 11.1095 9.6093 11.3333 9.33317 11.3333C9.05704 11.3333 8.83317 11.1095 8.83317 10.8333V7.00001C8.83317 6.72387 9.05704 6.50001 9.33317 6.50001Z"
                fill="currentColor"
              />
            </svg>
          </Button>
        </div>*/}
      </div>
    </li>
  );
}

function ShortcutSection({title, shortcuts, platform}: ShortcutSection & {platform: Platform}) {
  return (
    <section aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}>
      <div className="mb-4">
        <h2
          id={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}
          className="text-foreground/95 text-[16px] font-[550]">
          {title}
        </h2>
      </div>
      <ul className="divide-border divide-y">
        {shortcuts.map((shortcut) => (
          <ShortcutRow key={shortcut.action} {...shortcut} platform={platform} />
        ))}
      </ul>
    </section>
  );
}

export default function ShortcutsContent({platform}: {platform: Platform}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filteredSections = shortcutSections
    .map((section) => ({
      ...section,
      shortcuts: section.shortcuts.filter((shortcut) =>
        [
          section.title,
          section.description,
          shortcut.action,
          shortcut.context,
          ...shortcut.keys.flat(),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(deferredQuery),
      ),
    }))
    .filter((section) => section.shortcuts.length > 0);

  return (
    <div className="flex h-full w-full">
      <ScrollArea className="min-h-0 flex-1" viewportProps={{tabIndex: -1}}>
        <div className="mx-auto my-12 flex max-w-4xl flex-col gap-6 px-4 sm:px-6">
          <PageHeader
            title="Keyboard shortcuts"
            description="Work faster in Tobira with shortcuts for navigation, media, editing, and the browser extension."
          />
          <InputGroup aria-label="Search keyboard shortcuts">
            <InputGroupAddon>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M13.3333 13.3333L10.751 10.751M10.751 10.751C11.6257 9.87633 12.1667 8.668 12.1667 7.33333C12.1667 4.66396 10.0027 2.5 7.33333 2.5C4.66396 2.5 2.5 4.66396 2.5 7.33333C2.5 10.0027 4.66396 12.1667 7.33333 12.1667C8.668 12.1667 9.87633 11.6257 10.751 10.751Z"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search keyboard shortcuts"
              placeholder="Search shortcuts"
              type="search"
              value={query}
              className="w-full"
              onChange={(event) => setQuery(event.target.value)}
            />
          </InputGroup>
          {filteredSections.length > 0 ? (
            <div className="flex flex-col gap-11">
              {filteredSections.map((section) => (
                <ShortcutSection key={section.title} {...section} platform={platform} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg border px-5 py-12 text-center">
              <p className="text-foreground text-sm font-medium">No shortcuts found</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Try searching for an action, key, or feature.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
