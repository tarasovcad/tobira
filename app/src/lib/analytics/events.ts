export type AnalyticsPrimitive = string | number | boolean | null;
export type AnalyticsPropertyValue = AnalyticsPrimitive | Record<string, number>;
export type AnalyticsProperties = Record<string, AnalyticsPropertyValue | undefined>;

export type AuthMethod = "otp" | "google" | "github" | "unknown";
export type SocialProvider = "google" | "github";
export type BookmarkKind = "website" | "media" | "post";
export type BookmarkKindCounts = Record<BookmarkKind, number>;
export type AnalyticsBoolean = "true" | "false";

export type WebsiteJobType = "process_website_bookmark";
export type MediaJobType = "process_media_bookmark";
export type PostJobType = "process_post_media";
export type BookmarkProcessingJobType = WebsiteJobType | MediaJobType | PostJobType;
export type WebsiteProcessingStatus = "ready" | "missing" | "failed";

export type AnalyticsEventProperties = {
  bookmark_processing_job_queued: {
    kind: BookmarkKind;
    job_type: BookmarkProcessingJobType;
    url_host: string;
    qstash_publish_ms: number;
  };
  bookmark_processing_completed: {
    kind: "website";
    job_type: WebsiteJobType;
    duration_ms: number;
    success: AnalyticsBoolean;
    error_code: string;
    url_host?: string;
    qstash_verify_ms?: number;
    bookmark_select_db_ms?: number;
    website_record_select_db_ms?: number;
    db_ms?: number;
    html_fetch_ms?: number;
    html_extract_ms?: number;
    r2_exists_ms?: number;
    favicon_ms?: number;
    og_ms?: number;
    preview_ms?: number;
    bookmark_update_db_ms?: number;
    website_record_upsert_db_ms?: number;
    html_status?: WebsiteProcessingStatus;
    favicon_status?: WebsiteProcessingStatus;
    og_status?: WebsiteProcessingStatus;
    preview_status?: WebsiteProcessingStatus;
    website_protected?: AnalyticsBoolean;
  };
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
