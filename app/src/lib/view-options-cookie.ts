import type {ViewLayoutOptions, ViewMode} from "@/store/use-view-options";

export const VIEW_OPTIONS_COOKIE = "tobira_view_options";
export const VIEW_OPTIONS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type ViewOptionsCookie = {
  v: 2;
  view: ViewMode;
  layouts: Record<ViewMode, ViewLayoutOptions>;
};
