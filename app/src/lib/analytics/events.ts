export type AnalyticsPrimitive = string | number | boolean | null;
export type AnalyticsPropertyValue = AnalyticsPrimitive | Record<string, number>;
export type AnalyticsProperties = Record<string, AnalyticsPropertyValue | undefined>;

export type AuthMethod = "otp" | "google" | "github" | "unknown";
export type SocialProvider = "google" | "github";
export type BookmarkKind = "website" | "media" | "post";
export type BookmarkKindCounts = Record<BookmarkKind, number>;

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
  bookmark_add_submitted: {
    kind: BookmarkKind;
    url_host: string;
    tag_count: number;
    has_collection: boolean;
  };
  bookmark_add_succeeded: {
    kind: BookmarkKind;
  };
  bookmark_add_failed: {
    kind: BookmarkKind;
    error_code: string;
  };
  bookmark_update_succeeded: {
    kind: BookmarkKind;
  };
  bookmark_update_failed: {
    kind: BookmarkKind;
    error_code: string;
  };
  bookmark_archived: {
    count: number;
    kind_counts: BookmarkKindCounts;
  };
  bookmark_deleted: {
    count: number;
    kind_counts: BookmarkKindCounts;
  };
  bookmark_restored: {
    count: number;
    kind_counts: BookmarkKindCounts;
  };
  bookmark_permanently_deleted: {
    count: number;
    kind_counts: BookmarkKindCounts;
  };
};

export type AnalyticsEventName = keyof AnalyticsEventProperties;

export function compactAnalyticsProperties(
  properties: AnalyticsProperties,
): Record<string, AnalyticsPropertyValue> {
  return Object.fromEntries(
    Object.entries(properties).filter((entry): entry is [string, AnalyticsPropertyValue] => {
      const [, value] = entry;
      return value !== undefined;
    }),
  );
}
