export type SidebarMode = "main" | "settings";

const SIDEBAR_SWITCH_TARGET_KEY = "tobira:sidebar-switch-target";

export function markSidebarSwitchTarget(target: SidebarMode) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(SIDEBAR_SWITCH_TARGET_KEY, target);
}

export function consumeSidebarSwitchTarget(target: SidebarMode) {
  if (typeof window === "undefined") return false;

  const storedTarget = window.sessionStorage.getItem(SIDEBAR_SWITCH_TARGET_KEY);

  if (storedTarget !== target) return false;

  window.sessionStorage.removeItem(SIDEBAR_SWITCH_TARGET_KEY);
  return true;
}
