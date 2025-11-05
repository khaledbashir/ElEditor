import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    // Fix for BlockSuite packages when they are used
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // Handle yjs imports properly
    config.resolve.alias = {
      ...config.resolve.alias,
      'yjs': 'yjs',
    };

    return config;
  },
};

export default nextConfig;
