import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    qualities: [50, 60, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-37dc11bd0a0647d296d3cfa6eacbf787.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
