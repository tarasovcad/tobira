import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // Skip Vercel's image optimizer globally — images are served directly from
    // R2 (free egress) instead of being proxied through Vercel (counts against
    // Fast Data Transfer quota). To opt a specific <Image> back into
    // optimization, pass unoptimized={false} explicitly on that component.
    unoptimized: true,
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
      {
        protocol: "https",
        hostname: "jvnaqdowfvgjeiiynebq.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
