export const SIDEBAR_PREFERENCES_COOKIE = "tobira_sidebar";
export const SIDEBAR_PREFERENCES_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type SidebarSectionId = "collections" | "tags";
export type SidebarSectionLimit = 5 | 10 | 100;

export type SidebarPreferences = {
  v: 1;
  collapsed: boolean;
  sections: [SidebarSectionId, SidebarSectionLimit][];
};

export const SIDEBAR_SECTION_LIMITS = [5, 10, 100] as const;

export const DEFAULT_SIDEBAR_PREFERENCES: SidebarPreferences = {
  v: 1,
  collapsed: false,
  sections: [
    ["collections", 5],
    ["tags", 5],
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSidebarSectionId(value: unknown): value is SidebarSectionId {
  return value === "collections" || value === "tags";
}

function isSidebarSectionLimit(value: unknown): value is SidebarSectionLimit {
  return SIDEBAR_SECTION_LIMITS.includes(value as SidebarSectionLimit);
}

function normalizeSections(value: unknown): SidebarPreferences["sections"] {
  if (!Array.isArray(value)) {
    return DEFAULT_SIDEBAR_PREFERENCES.sections;
  }

  const seen = new Set<SidebarSectionId>();
  const sections: SidebarPreferences["sections"] = [];

  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2) {
      continue;
    }

    const [section, limit] = entry;

    if (!isSidebarSectionId(section) || !isSidebarSectionLimit(limit) || seen.has(section)) {
      continue;
    }

    seen.add(section);
    sections.push([section, limit]);
  }

  return sections.length === 2 ? sections : DEFAULT_SIDEBAR_PREFERENCES.sections;
}

export function normalizeSidebarPreferences(value: unknown): SidebarPreferences {
  if (!isRecord(value)) {
    return DEFAULT_SIDEBAR_PREFERENCES;
  }

  return {
    v: 1,
    collapsed:
      typeof value.collapsed === "boolean"
        ? value.collapsed
        : DEFAULT_SIDEBAR_PREFERENCES.collapsed,
    sections: normalizeSections(value.sections),
  };
}

export function parseSidebarPreferences(value?: string | null): SidebarPreferences {
  if (!value) {
    return DEFAULT_SIDEBAR_PREFERENCES;
  }

  try {
    return normalizeSidebarPreferences(JSON.parse(decodeURIComponent(value)));
  } catch {
    try {
      return normalizeSidebarPreferences(JSON.parse(value));
    } catch {
      return DEFAULT_SIDEBAR_PREFERENCES;
    }
  }
}

export function serializeSidebarPreferences(preferences: SidebarPreferences) {
  return encodeURIComponent(JSON.stringify(normalizeSidebarPreferences(preferences)));
}

export function writeSidebarPreferencesCookie(preferences: SidebarPreferences) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SIDEBAR_PREFERENCES_COOKIE}=${serializeSidebarPreferences(
    preferences,
  )}; Path=/; Max-Age=${SIDEBAR_PREFERENCES_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}
