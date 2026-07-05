"use client";

import {
  compactAnalyticsProperties,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
} from "./events";

export function trackClientEvent<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEventProperties[Name],
) {
  if (typeof window === "undefined") return;

  if (!window.rybbit?.event) {
    console.log("[analytics] Skipping client event; Rybbit is not available.", {
      event: name,
    });
    return;
  }

  window.rybbit.event(name, compactAnalyticsProperties(properties));
}
