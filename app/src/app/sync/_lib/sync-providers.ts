export type Provider = {
  name: string;
  image: string;
  description: string;
  invertOnDark?: boolean;
  types: string[];
  color: string;
  category: "social" | "browsers" | "media" | "reading" | "coming-soon";
};

export const PROVIDERS = [
  {
    name: "X",
    image: "/socials/x.svg",
    invertOnDark: true,
    description: "Import saved posts, links, and media you want to keep organized in Tobira.",
    types: ["Social", "Bookmarks", "Media"],
    category: "social",
    color: "#000000",
  },
  {
    name: "Reddit",
    image: "/socials/reddit.svg",
    description: "Bring in saved posts, image threads, and useful links from your account.",
    types: ["Social", "Bookmarks", "Media"],
    category: "social",
    color: "#FF4500",
  },
  {
    name: "Dribbble",
    image: "/socials/dribbble.svg",
    description: "Import liked or saved shots into your media and inspiration collections.",
    types: ["Media", "Design", "Inspiration"],
    category: "social",
    color: "#EA4C89",
  },
  {
    name: "Chrome",
    image: "/socials/chrome.svg",
    description: "Import bookmark folders and saved links from your Chrome browser.",
    types: ["Browsers", "Bookmarks", "Links"],
    category: "browsers",
    color: "#4285F4",
  },
  {
    name: "Arc",
    image: "/socials/arc.svg",
    description: "Bring over saved tabs, pinned spaces, and browsing sessions.",
    types: ["Browsers", "Tabs", "Reading"],
    category: "browsers",
    color: "#8B5CF6",
  },
  {
    name: "Dia",
    image: "/socials/dia.png",
    description: "Import saved tabs and reading flows from Dia for quick capture into Tobira.",
    types: ["Browsers", "Tabs", "Reading"],
    category: "browsers",
    color: "#06B6D4",
  },
  {
    name: "Pinterest",
    image: "/socials/pinterest.svg",
    description: "Sync boards and saved pins into media-first collections inside Tobira.",
    types: ["Media", "Inspiration", "Social"],
    category: "social",
    color: "#E60023",
  },
  {
    name: "YouTube",
    image: "/socials/youtube.svg",
    description: "Import watch-later videos, playlists, and saved references.",
    types: ["Media", "Video", "Bookmarks"],
    category: "media",
    color: "#FF0000",
  },
  {
    name: "Firefox",
    image: "/socials/firefox.svg",
    description: "Import bookmarks and reading-list style saves from Firefox.",
    types: ["Browsers", "Bookmarks", "Reading"],
    category: "browsers",
    color: "#FF7139",
  },
  {
    name: "Safari",
    image: "/socials/safari.svg",
    description: "Bring bookmarks and reading list items from Safari into Tobira.",
    types: ["Browsers", "Bookmarks", "Reading"],
    category: "browsers",
    color: "#006CFF",
  },
] satisfies Provider[];
