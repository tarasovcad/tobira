import {withSentryConfig} from "@sentry/nextjs";
import type {NextConfig} from "next";

const isSentryEnabled =
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async headers() {
    if (!isSentryEnabled) return [];

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Document-Policy",
            value: "js-profiling",
          },
        ],
      },
    ];
  },
  images: {
    // Skip Vercel's image optimizer globally — images are served directly from
    // R2 (free egress) instead of being proxied through Vercel (counts against
    // Fast Data Transfer quota). To opt a specific <Image> back into
    // optimization, pass unoptimized={false} explicitly on that component.
    unoptimized: true,
    qualities: [100, 50, 60, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-37dc11bd0a0647d296d3cfa6eacbf787.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/**",
      },
    ],
  },
};

export default isSentryEnabled
  ? withSentryConfig(nextConfig, {
      // For all available options, see:
      // https://www.npmjs.com/package/@sentry/webpack-plugin#options

      org: "tarasovcad",

      project: "tobira",

      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,

      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
      // This can increase your server load as well as your hosting bill.
      // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
      // side errors will fail.
      tunnelRoute: "/monitoring",

      webpack: {
        // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
        // See the following for more information:
        // https://docs.sentry.io/product/crons/
        // https://vercel.com/docs/cron-jobs
        automaticVercelMonitors: true,

        // Tree-shaking options for reducing bundle size
        treeshake: {
          // Automatically tree-shake Sentry logger statements to reduce bundle size
          removeDebugLogging: true,
        },
      },
    })
  : nextConfig;
