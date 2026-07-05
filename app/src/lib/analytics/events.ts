export type AnalyticsPrimitive = string | number | boolean | null;
export type AnalyticsProperties = Record<string, AnalyticsPrimitive | undefined>;

export type AuthMethod = "otp" | "google" | "github" | "unknown";
export type SocialProvider = "google" | "github";

export type AnalyticsEventProperties = {
  auth_otp_requested: {
    source: "login";
    success: boolean;
    rate_limited?: boolean;
    error_code?: string;
  };
  auth_otp_resent: {
    success: boolean;
    cooldown_seconds?: number;
    error_code?: string;
  };
  auth_otp_verified: {
    success: boolean;
    error_code?: string;
  };
  auth_social_started: {
    provider: SocialProvider;
  };
  auth_social_failed: {
    provider: SocialProvider;
    error_code?: string;
  };
  user_signed_in: {
    method: AuthMethod;
  };
  user_signed_up: {
    method: AuthMethod;
  };
  user_signed_out: {
    success: boolean;
    error_code?: string;
  };
};

export type AnalyticsEventName = keyof AnalyticsEventProperties;

export function compactAnalyticsProperties(
  properties: AnalyticsProperties,
): Record<string, AnalyticsPrimitive> {
  return Object.fromEntries(
    Object.entries(properties).filter((entry): entry is [string, AnalyticsPrimitive] => {
      const [, value] = entry;
      return value !== undefined;
    }),
  );
}
