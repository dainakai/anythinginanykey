import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['abcjs'],
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs`, `os`, `tty` module
    // See: https://github.com/vercel/next.js/issues/7755#issuecomment-983038405
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        tty: false,
      };
    }

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
