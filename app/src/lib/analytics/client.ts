"use client";

import {
  compactAnalyticsProperties,
  type AnalyticsProperties,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
} from "./events";

function withRybbit(callback: (rybbit: NonNullable<Window["rybbit"]>) => void, operation: string) {
  if (typeof window === "undefined") return;

  const rybbit = window.rybbit;
  if (!rybbit) {
    console.log("[analytics] Skipping client operation; Rybbit is not available.", {
      operation,
    });
    return;
  }

  if (rybbit.onReady) {
    rybbit.onReady(callback);
    return;
  }

  callback(rybbit);
}

export function trackClientEvent<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEventProperties[Name],
) {
  withRybbit((rybbit) => {
    rybbit.event(name, compactAnalyticsProperties(properties));
  }, name);
}

export function identifyClientUser(userId: string, traits?: AnalyticsProperties) {
  withRybbit((rybbit) => {
    rybbit.identify(userId, traits ? compactAnalyticsProperties(traits) : undefined);
  }, "identify_user");
}

export function clearClientUser() {
  withRybbit((rybbit) => {
    rybbit.clearUserId();
  }, "clear_user_id");
}
