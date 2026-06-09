import {createSerializer, parseAsString, parseAsStringLiteral} from "nuqs";

export const typeFilterParser = parseAsStringLiteral([
  "website",
  "media",
  "post",
] as const).withDefault("website");

export const sortParser = parseAsStringLiteral(["recent", "oldest", "az"] as const).withDefault(
  "recent",
);

export const homeFilterParsers = {
  tag: parseAsString,
  collection: parseAsString,
  id: parseAsString,
  type: typeFilterParser,
  sort: sortParser,
};

export const serializeHomeParams = createSerializer(homeFilterParsers);

export const SETTINGS_TABS = [
  "general",
  "personalization",
  "account",
  "billing",
  "privacy",
  "meta",
  "organization",
  "integrations",
  "capture",
  "data",
  "usage",
  "kb",
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export const settingsTabParser = parseAsStringLiteral(SETTINGS_TABS).withDefault("general");

export const settingsParsers = {
  tab: settingsTabParser,
};

export const serializeSettingsParams = createSerializer(settingsParsers);
