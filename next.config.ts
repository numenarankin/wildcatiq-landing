import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the Turbopack filesystem root to this project. Without it, the parent
  // `wildcat` directory (which also holds wildcat-webapp) is inferred as the
  // root and its code/lockfiles bleed into this build.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
