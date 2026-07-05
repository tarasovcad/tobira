import {
  compactAnalyticsProperties,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
} from "./events";
import {logger, toLogError} from "@/lib/shared/logger";

type TrackServerEventOptions = {
  hostname?: string;
  pathname?: string;
  userId?: string;
};

const TRACKING_TIMEOUT_MS = 2000;

export async function trackServerEvent<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEventProperties[Name],
  options: TrackServerEventOptions = {},
) {
  const apiKey = process.env.ANALYTICS_API_KEY?.trim();
  const siteId = process.env.ANALYTICS_DATA_SITE_ID?.trim();
  const trackUrl = process.env.ANALYTICS_API_URL?.trim();
  if (!apiKey || !siteId || !trackUrl) {
    console.log("[analytics] Skipping server event; analytics env is not configured.", {
      event: name,
      hasApiKey: Boolean(apiKey),
      hasSiteId: Boolean(siteId),
      hasTrackUrl: Boolean(trackUrl),
    });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRACKING_TIMEOUT_MS);

  try {
    const response = await fetch(trackUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        site_id: siteId,
        type: "custom_event",
        pathname: options.pathname ?? "/server",
        event_name: name,
        properties: JSON.stringify(compactAnalyticsProperties(properties)),
        ...(options.hostname ? {hostname: options.hostname} : {}),
        ...(options.userId ? {user_id: options.userId} : {}),
      }),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      logger.warn("[analytics] Failed to track server event", {
        event: name,
        response: responseText,
        status: response.status,
      });
    }
  } catch (error) {
    logger.warn("[analytics] Failed to track server event", {
      event: name,
      error: toLogError(error),
    });
  } finally {
    clearTimeout(timeout);
  }
}
