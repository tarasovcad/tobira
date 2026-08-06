import type { ComponentType } from "react";

import arcIcon from "@/assets/socials/arc.svg";
import chromeIcon from "@/assets/socials/chrome.svg";
import diaIcon from "@/assets/socials/dia.png";
import dribbbleIcon from "@/assets/socials/dribbble.svg";
import firefoxIcon from "@/assets/socials/firefox.svg";
import pinterestIcon from "@/assets/socials/pinterest.svg";
import redditIcon from "@/assets/socials/reddit.svg";
import safariIcon from "@/assets/socials/safari.svg";
import xIcon from "@/assets/socials/x.svg";
import youtubeIcon from "@/assets/socials/youtube.svg";
import { ChromeSection } from "./ChromeSection";
import { XLogo, XSection } from "./XSection";

export type ProviderIcon = string | ComponentType<{ className?: string }>;

export type ProviderSectionProps = {
  icon: ProviderIcon;
  connected: boolean;
  onBack: () => void;
  onConnect: () => void;
};

export type Provider = {
  id: string;
  name: string;
  image: string;
  sectionIcon: ProviderIcon;
  description: string;
  color: string;
  section: ComponentType<ProviderSectionProps> | undefined;
};

export const PROVIDERS = [
  {
    id: "x",
    name: "X",
    image: xIcon,
    sectionIcon: XLogo,
    description: "Saved posts, links, and media.",
    color: "#000000",
    section: XSection,
  },
  {
    id: "chrome",
    name: "Chrome",
    image: chromeIcon,
    sectionIcon: chromeIcon,
    description: "Bookmark folders and links.",
    color: "#4285F4",
    section: ChromeSection,
  },
  {
    id: "reddit",
    name: "Reddit",
    image: redditIcon,
    sectionIcon: redditIcon,
    description: "Saved posts, threads, and links.",
    color: "#FF4500",
    section: undefined,
  },
  {
    id: "dribbble",
    name: "Dribbble",
    image: dribbbleIcon,
    sectionIcon: dribbbleIcon,
    description: "Liked shots and inspiration.",
    color: "#EA4C89",
    section: undefined,
  },
  {
    id: "arc",
    name: "Arc",
    image: arcIcon,
    sectionIcon: arcIcon,
    description: "Tabs, spaces, and sessions.",
    color: "#8B5CF6",
    section: undefined,
  },
  {
    id: "dia",
    name: "Dia",
    image: diaIcon,
    sectionIcon: diaIcon,
    description: "Saved tabs and reading flows.",
    color: "#06B6D4",
    section: undefined,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    image: pinterestIcon,
    sectionIcon: pinterestIcon,
    description: "Boards and saved pins.",
    color: "#E60023",
    section: undefined,
  },
  {
    id: "youtube",
    name: "YouTube",
    image: youtubeIcon,
    sectionIcon: youtubeIcon,
    description: "Watch later and playlists.",
    color: "#FF0000",
    section: undefined,
  },
  {
    id: "firefox",
    name: "Firefox",
    image: firefoxIcon,
    sectionIcon: firefoxIcon,
    description: "Bookmarks and reading list.",
    color: "#FF7139",
    section: undefined,
  },
  {
    id: "safari",
    name: "Safari",
    image: safariIcon,
    sectionIcon: safariIcon,
    description: "Bookmarks and reading list.",
    color: "#006CFF",
    section: undefined,
  },
] as const satisfies readonly Provider[];

export type ProviderId = (typeof PROVIDERS)[number]["id"];
