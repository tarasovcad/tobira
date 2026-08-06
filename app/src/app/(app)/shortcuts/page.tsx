import {headers} from "next/headers";
import ShortcutsContent from "./ShortcutsContent";

export const metadata = {
  title: "Keyboard shortcuts - Tobira",
  description: "Browse the keyboard shortcuts available in Tobira and its browser extension.",
};

type Platform = "mac" | "other" | "unknown";

function detectPlatform(requestHeaders: Headers): Platform {
  const clientPlatform = requestHeaders.get("sec-ch-ua-platform")?.replaceAll('"', "");

  if (clientPlatform === "macOS") return "mac";
  if (clientPlatform) return "other";

  const userAgent = requestHeaders.get("user-agent") ?? "";

  if (/Macintosh|Mac OS X|iPhone|iPad|iPod/.test(userAgent)) return "mac";
  if (/Windows|Linux|Android|CrOS/.test(userAgent)) return "other";

  return "unknown";
}

export default async function ShortcutsPage() {
  const requestHeaders = await headers();
  const platform = detectPlatform(requestHeaders);

  return <ShortcutsContent platform={"mac"} />;
}
