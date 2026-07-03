// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isSentryEnabled =
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

if (isSentryEnabled) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    integrations: [Sentry.browserProfilingIntegration()],

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 0.2,
    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Set profileSessionSampleRate to 1.0 to profile during every session
    profileSessionSampleRate: 0.05,

    dataCollection: {
      // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
      // userInfo: false,
      // httpBodies: [],
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
