import {create} from "zustand";
import {
  DEFAULT_SIDEBAR_PREFERENCES,
  type SidebarPreferences,
  type SidebarSectionId,
  type SidebarSectionLimit,
  writeSidebarPreferencesCookie,
} from "@/lib/sidebar-preferences";

export type SidebarMode = "main" | "settings";

interface SidebarState {
  isOpen: boolean;
  initialized: boolean;
  preferences: SidebarPreferences;
  requestedMode: SidebarMode | null;
  initializePreferences: (preferences: SidebarPreferences) => void;
  setOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setSectionLimit: (section: SidebarSectionId, limit: SidebarSectionLimit) => void;
  moveSection: (section: SidebarSectionId, direction: "up" | "down") => void;
  requestMode: (mode: SidebarMode) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: !DEFAULT_SIDEBAR_PREFERENCES.collapsed,
  initialized: false,
  preferences: DEFAULT_SIDEBAR_PREFERENCES,
  requestedMode: null,
  initializePreferences: (preferences) =>
    set((state) =>
      state.initialized
        ? state
        : {
            preferences,
            isOpen: !preferences.collapsed,
            initialized: true,
          },
    ),
  setOpen: (isOpen) =>
    set((state) => {
      const preferences = {...state.preferences, collapsed: !isOpen};
      writeSidebarPreferencesCookie(preferences);
      return {isOpen, preferences};
    }),
  toggleSidebar: () =>
    set((state) => {
      const isOpen = !state.isOpen;
      const preferences = {...state.preferences, collapsed: !isOpen};
      writeSidebarPreferencesCookie(preferences);
      return {isOpen, preferences};
    }),
  setSectionLimit: (section, limit) =>
    set((state) => {
      const preferences = {
        ...state.preferences,
        sections: state.preferences.sections.map(([id, currentLimit]) =>
          id === section ? [id, limit] : [id, currentLimit],
        ),
      } satisfies SidebarPreferences;
      writeSidebarPreferencesCookie(preferences);
      return {preferences};
    }),
  moveSection: (section, direction) =>
    set((state) => {
      const index = state.preferences.sections.findIndex(([id]) => id === section);
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (index === -1 || targetIndex < 0 || targetIndex >= state.preferences.sections.length) {
        return state;
      }

      const [firstSection, secondSection] = state.preferences.sections;
      const sections: SidebarPreferences["sections"] = [secondSection, firstSection];

      const preferences = {...state.preferences, sections};
      writeSidebarPreferencesCookie(preferences);
      return {preferences};
    }),
  requestMode: (mode) => set({requestedMode: mode}),
}));
