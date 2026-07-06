"use client";

import {useEffect} from "react";
import {identifyClientUser} from "@/lib/analytics/client";

type AnalyticsIdentityProps = {
  userId: string | null;
};

export function AnalyticsIdentity({userId}: AnalyticsIdentityProps) {
  useEffect(() => {
    if (!userId) return;

    identifyClientUser(userId);
  }, [userId]);

  return null;
}
